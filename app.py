from flask import Flask, request, jsonify, send_file, session, render_template, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from dotenv import load_dotenv
import os
from podcastfy.client import generate_podcast
import shutil
from contextlib import contextmanager
import tempfile
from functools import wraps
import jwt
from datetime import datetime, timedelta
from pathlib import Path
from werkzeug.utils import secure_filename

# Load environment variables with explicit path and override
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# Create required directories
# they should be relative to the current working directory (in dev is C:/SRC/PodStudio)
# why does it use a "static" folder. why not just use "data" folder?
# use forward /, rather than \\ for file paths.
# if need to use \ slash: use a r prefix: r"C:\path\to\file"

# Flask uses the static folder for static files like images, css, and js
# Fly.io doesn't allow access to the root directory, 
# so we need to use the static folder for the temp and upload directories
STATIC_DIR = './static'
TEMP_DIR = './static/tmp'
UPLOAD_FOLDER = './static/uploads'
AUDIO_DIR = os.path.join(STATIC_DIR, 'audio')
TRANSCRIPT_DIR = os.path.join(STATIC_DIR, 'transcripts')
# STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
# UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'public/uploads')
# TEMP_DIR = os.path.join(os.path.dirname(__file__), 'public/tmp/audio')

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'html', 'json', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'mp4', 'wav', 'ogg', 'm4a', 'webm'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # max 10MB

print(f"TEMP_DIR: {TEMP_DIR}")
print(f"UPLOAD_FOLDER: {UPLOAD_FOLDER}")
print(f"STATIC_DIR: {STATIC_DIR}")
print(f"AUDIO_DIR: {AUDIO_DIR}")
print(f"TRANSCRIPT_DIR: {TRANSCRIPT_DIR}")

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(TRANSCRIPT_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__,
    static_folder='static',
    static_url_path='/static'
)

SECRET_KEY = os.getenv('SECRET_KEY', os.urandom(24))
app.config['SECRET_KEY'] = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Load API token after ensuring .env is loaded
API_TOKEN = os.getenv('API_TOKEN')
if not API_TOKEN:
    raise ValueError("app.py: API_TOKEN must be set in .env file")

# Enable CORS in development
if app.debug:
    CORS(app)
    # CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    # Serve index.html from root directory in development
    @app.route('/')
    def index():
        return send_file('../index.html')
else:
    # Serve static files in production
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

socketio = SocketIO(app, cors_allowed_origins="*")

### ------------------------------------------------------------------------------------------------
### require api token
### ------------------------------------------------------------------------------------------------
def require_api_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'No token provided'}), 401

        if not token.startswith('Bearer '):
            return jsonify({'error': 'Invalid token format'}), 401

        token = token.split('Bearer ')[1]

        if token != API_TOKEN:
            return jsonify({'error': f'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

### ------------------------------------------------------------------------------------------------
### temporary env
### ------------------------------------------------------------------------------------------------
@contextmanager
def temporary_env(temp_env):
    """Temporarily set environment variables and restore them afterwards."""
    original_env = dict(os.environ)
    os.environ.update(temp_env)
    try:
        yield
    finally:
        os.environ.clear()
        os.environ.update(original_env)

### ------------------------------------------------------------------------------------------------
### temporary env file
### ------------------------------------------------------------------------------------------------
@contextmanager
def temporary_env_file(env_vars):
    """Creates a temporary .env file with the provided variables."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.env', delete=False) as temp_env:
        # Write variables to temp file
        for key, value in env_vars.items():
            temp_env.write(f"{key}={value}\n")
        temp_env.flush()

        # Store original env file path if it exists
        original_env_path = os.getenv('ENV_FILE')

        try:
            # Set the ENV_FILE environment variable to point to our temp file
            os.environ['ENV_FILE'] = temp_env.name
            yield
        finally:
            # Restore original ENV_FILE if it existed
            if original_env_path:
                os.environ['ENV_FILE'] = original_env_path
            else:
                os.environ.pop('ENV_FILE', None)
            # Clean up temp file
            os.unlink(temp_env.name)

### ------------------------------------------------------------------------------------------------
### socketio events
### ------------------------------------------------------------------------------------------------
@socketio.on('connect')
def handle_connect():
    print("\n=== Socket Connected ===")
    print(f"Client ID: {request.sid}")

### ------------------------------------------------------------------------------------------------
### socketio events
### ------------------------------------------------------------------------------------------------
@socketio.on('disconnect')
def handle_disconnect():
    print("\n=== Socket Disconnected ===")
    print(f"Client ID: {request.sid}")


### ------------------------------------------------------------------------------------------------
### Generate custom podcast with payload as data parameter
### ------------------------------------------------------------------------------------------------
@socketio.on('generate_podcast')
def handle_generate_podcast(data):
    try:
        print("\n=== Starting Podcast Generation ===")
        emit('status', "Starting podcast generation...")

        # Get the selected TTS model and secret key, default to gemini
        is_from_transcript = data.get('is_from_transcript')
        tts_model = data.get('tts_model', 'gemini')
        secret_key = data.get('secret_key')
        env_secret_key = os.getenv('SECRET_KEY')

        # Validate secret key if provided
        if secret_key:
            if not secret_key == env_secret_key:
                raise ValueError("app.py: Invalid secret key - please check your secret key or remove it to use your own API keys")
            use_default_keys = True
        else:
            use_default_keys = False
        
        if is_from_transcript and tts_model not in ['gemini', 'geminimulti']:
            raise ValueError("app.py: Only Gemini model supported for podcast from transcript")

        api_key_label = None
        # Set up API keys based on selected model
        if tts_model == 'gemini':
            api_key = os.getenv('GOOGLE_API_KEY') if use_default_keys else data.get('google_key')
            if not api_key:
                raise ValueError("app.py: Missing Google API key")
            os.environ['GOOGLE_API_KEY'] = api_key
            os.environ['GEMINI_API_KEY'] = api_key
            api_key_label = 'GEMINI_API_KEY'
            default_voices = {
                'question': data.get('voice_question', "en-US-Standard-A"), 
                'answer': data.get('voice_answer', "en-US-Standard-C")
            }
            voice_model = data.get('voice_model', "")
        elif tts_model == 'geminimulti':
            api_key = os.getenv('GOOGLE_API_KEY') if use_default_keys else data.get('google_key')
            if not api_key:
                raise ValueError("app.py: Missing Google API key")
            os.environ['GOOGLE_API_KEY'] = api_key
            os.environ['GEMINI_API_KEY'] = api_key
            api_key_label = 'GEMINI_API_KEY'
            default_voices = {
                'question': data.get('voice_question', "R"), 
                'answer': data.get('voice_answer', "S")
            }
            voice_model = data.get('voice_model', "en-US-Studio-MultiSpeaker")
        elif tts_model == 'edge':
            default_voices = {
                'question': data.get('voice_question', "en-US-JennyNeural"), 
                'answer': data.get('voice_answer', "en-US-EricNeural"),
            }
            voice_model = data.get('voice_model', "")
        elif tts_model == 'openai':
            api_key = os.getenv('OPENAI_API_KEY') if use_default_keys else data.get('openai_key')
            if not api_key:
                raise ValueError("app.py: Missing OpenAI API key")
            os.environ['OPENAI_API_KEY'] = api_key
            api_key_label = 'OPENAI_API_KEY'
            default_voices = {
                'question': data.get('voice_question', "echo"), 
                'answer': data.get('voice_answer', "shimmer"),
            }
            voice_model = data.get('voice_model', "tts-1-hd")
        elif tts_model == 'elevenlabs':
            api_key = os.getenv('ELEVENLABS_API_KEY') if use_default_keys else data.get('elevenlabs_key')
            if not api_key:
                raise ValueError("app.py: Missing ElevenLabs API key")
            os.environ['ELEVENLABS_API_KEY'] = api_key
            api_key_label = 'ELEVENLABS_API_KEY'
            default_voices = {
                'question': data.get('voice_question', "Chris"), 
                'answer': data.get('voice_answer', "Jessica"),
            }
            voice_model = data.get('voice_model', "eleven_multilingual_v2")
        elif tts_model == 'hume':
            api_key = os.getenv('HUME_API_KEY') if use_default_keys else data.get('hume_key')
            if not api_key:
                raise ValueError("app.py: Missing Hume AI API key")
            os.environ['HUME_API_KEY'] = api_key
            api_key_label = 'HUME_API_KEY'
            default_voices = {
                'question': data.get('voice_question', "Default"), 
                'answer': data.get('voice_answer', "Default"),
            }
            voice_model = data.get('voice_model', "default")
        elif tts_model == 'playht':
            api_key = os.getenv('PLAYHT_API_KEY') if use_default_keys else data.get('playht_key')
            if not api_key:
                raise ValueError("app.py: Missing Play HT API key")
            os.environ['PLAYHT_API_KEY'] = api_key
            api_key_label = 'PLAYHT_API_KEY'
            default_voices = {
                'question': data.get('voice_question', "Default"), 
                'answer': data.get('voice_answer', "Default"),
            }
            voice_model = data.get('voice_model', "default")  

        # Extract conversation config from data
        conversation_config = {
            'word_count': data.get('word_count', 250),
            'creativity': float(data.get('creativity', 0.7)),
            'conversation_style': data.get('conversation_style', []),
            'roles_person1': data.get('roles_person1', 'Interviewer'),
            'roles_person2': data.get('roles_person2', 'Subject matter expert'),
            'dialogue_structure': data.get('dialogue_structure', []),
            'podcast_name': data.get('name', 'Custom Podcast'),
            'podcast_tagline': data.get('tagline'),
            'output_language': data.get('output_language', 'English'),
            'user_instructions': data.get('user_instructions'),
            'engagement_techniques': data.get('engagement_techniques', []),
            'text_to_speech': {
                'temp_audio_dir': TEMP_DIR,
                'ending_message': data.get('ending_message', "Bye Bye!"),
                'default_tts_model': tts_model,
                'audio_format': 'mp3',
                'output_directories': {
                    'audio': AUDIO_DIR,
                    'transcripts': TRANSCRIPT_DIR
                },
                tts_model: {
                    'default_voices': default_voices, 
                    'model': voice_model
                }
            }
        }

        emit('status', "Generating podcast content...")
        emit('progress', {'progress': 30, 'message': 'Generating podcast content...'})

        # Add image_paths parameter if provided
        image_paths = data.get('image_urls', [])

        if not is_from_transcript:
            result = generate_podcast(
                urls=data.get('urls', []),
                text=data.get('text', ''),    # Kap: added support for text input
                conversation_config=conversation_config,
                tts_model=tts_model,
                longform=bool(data.get('is_long_form', False)),
            api_key_label=api_key_label,  # This tells podcastfy which env var to use
            image_paths=image_paths if image_paths else None  # Only pass if not empty
            )
        else:  # Generate the podcast from transcript
            urls = data.get('urls', [])
            transcript_file = urls[0] if len(urls) > 0 else None
            transcript = data.get('text') if len(data.get('text', '')) > 0 else None
            if not transcript_file and not transcript:
                raise ValueError("app.py: URLs are not allowed for podcast from transcript")    

            # Create temporary transcript file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
                if transcript:
                    temp_file.write(transcript)
                else:
                    shutil.copy2(transcript_file, temp_file.name)
                transcript_path = temp_file.name

            print(f"Created temporary transcript file: {transcript_path}")

            result = generate_podcast(
            transcript_file=transcript_path,
            conversation_config=conversation_config,
            tts_model=tts_model,
            api_key_label=api_key_label
            )
            # Clean up temporary file
            try:
                os.unlink(transcript_path)
                print(f"Cleaned up temporary transcript file: {transcript_path}")
            except Exception as e:
                print(f"Warning: Could not delete temporary file {transcript_path}: {e}")
        

        emit('status', "Processing audio...")
        emit('progress', {'progress': 90, 'message': 'Processing final audio...'})

        # Handle the result. Create a new file and copy the result to it.
        if isinstance(result, str) and os.path.isfile(result):
            filename = f"podcast_{os.urandom(8).hex()}.mp3"
            output_path = os.path.join(TEMP_DIR, filename)
            shutil.copy2(result, output_path)
            emit('progress', {'progress': 100, 'message': 'Podcast generation complete!'})
            emit('complete', {
                'audioUrl': f'{TEMP_DIR}/{filename}',
                'transcript': None
            }, room=request.sid)
        elif hasattr(result, 'audio_path'):
            filename = f"podcast_{os.urandom(8).hex()}.mp3"
            output_path = os.path.join(TEMP_DIR, filename)
            shutil.copy2(result.audio_path, output_path)
            emit('complete', {
                'audioUrl': f'/audio/{filename}',
                'transcript': result.details if hasattr(result, 'details') else None
            }, room=request.sid)
        else:
            raise Exception('Invalid result format')

    except Exception as e:
        print(f"\nError in handle_generate_podcast: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        emit('error', {'message': str(e)}, room=request.sid)

### ------------------------------------------------------------------------------------------------
### Generate news podcast
### ------------------------------------------------------------------------------------------------
@socketio.on('generate_news_podcast')
def handle_generate_news_podcast(data):
    try:
        print("\n=== Starting News Podcast Generation ===")
        emit('status', "Starting news podcast generation...")

        # Get the API key and topics
        api_key = data.get('google_key')
        topics = data.get('topics')
        secret_key = data.get('secret_key')
        env_secret_key = os.getenv('SECRET_KEY')

        # Validate secret key if provided
        if secret_key:
            if not secret_key == env_secret_key:
                raise ValueError("app.py: Invalid secret key - please check your secret key or remove it to use your own API keys")
            use_default_keys = True
        else:
            use_default_keys = False

        api_key = os.getenv('GOOGLE_API_KEY') if use_default_keys else data.get('google_key')
        if not api_key:
            raise ValueError("app.py: Missing Google API key")
        os.environ['GOOGLE_API_KEY'] = api_key
        os.environ['GEMINI_API_KEY'] = api_key
        api_key_label = 'GEMINI_API_KEY'

        if not topics:
            raise ValueError("app.py: No topics provided")

        print(f"Topics: {topics}")

        # Test the API key
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content("Test message")
            print("\n=== API Test Successful ===")
        except Exception as e:
            print("\n=== API Test Failed ===")
            print(f"Error: {str(e)}")
            raise

        emit('status', "Generating news podcast...")
        emit('progress', {'progress': 30, 'message': 'Generating content...'})

        # Use a different function for news podcasts
        result = generate_podcast(
            topic=topics,
            tts_model='gemini',  # only Gemini is supported for news podcasts
            api_key_label=api_key_label
        )

        emit('status', "Processing audio...")
        emit('progress', {'progress': 90, 'message': 'Processing final audio...'})

        # Handle the result
        if isinstance(result, str) and os.path.isfile(result):
            filename = f"news_podcast_{os.urandom(8).hex()}.mp3"
            output_path = os.path.join(TEMP_DIR, filename)
            shutil.copy2(result, output_path)
            emit('progress', {'progress': 100, 'message': 'Podcast generation complete!'})
            emit('complete', {
                'audioUrl': f'/audio/{filename}',
                'transcript': None
            }, room=request.sid)
        elif hasattr(result, 'audio_path'):
            filename = f"news_podcast_{os.urandom(8).hex()}.mp3"
            output_path = os.path.join(TEMP_DIR, filename)
            shutil.copy2(result.audio_path, output_path)
            emit('complete', {
                'audioUrl': f'/audio/{filename}',
                'transcript': result.details if hasattr(result, 'details') else None
            }, room=request.sid)
        else:
            raise Exception('Invalid result format')

    except Exception as e:
        print(f"\nError in handle_generate_news_podcast: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        emit('error', {'message': str(e)}, room=request.sid)

### ------------------------------------------------------------------------------------------------
### generate podcast from transcript as a POST in JSON and return JSON response
### ------------------------------------------------------------------------------------------------
@app.route('/api/generate-from-transcript', methods=['POST'])
@require_api_token
def generate_from_transcript():
    try:
        print("\n=== Starting Podcast from Transcript Generation ===")
        emit('status', "Starting podcast generation from transcript...")

        data = request.get_json()
        # Validate required fields
        # if not data or 'transcript' not in data:
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing transcript in request body'}), 400

        # Extract parameters from request
        # transcript = data['transcript']
        transcript = data['text']
        tts_model = data.get('tts_model', 'gemini')
        secret_key = data.get('secret_key')
        env_secret_key = os.getenv('SECRET_KEY')

        # Validate secret key if provided
        if secret_key:
            if not secret_key == env_secret_key:
                raise ValueError("app.py: Invalid secret key - please check your secret key or remove it to use your own API keys")
            use_default_keys = True
        else:
            use_default_keys = False

        # Set up API keys if needed
        api_key_label = None
        if tts_model in ['gemini', 'geminimulti']:
            api_key = os.getenv('GOOGLE_API_KEY') if use_default_keys else data.get('google_key')
            if not api_key:
                raise ValueError("app.py: Missing Google API key")
            os.environ['GOOGLE_API_KEY'] = api_key
            os.environ['GEMINI_API_KEY'] = api_key
            api_key_label = 'GEMINI_API_KEY'
            default_voices = {
                'question': data.get('voice_question', "en-US-Journey-D"), 
                'answer': data.get('voice_answer', "en-US-Journey-O")
            }
        else:
            raise ValueError("app.py: Only Gemini model supported for podcast from transcript")

        # Create temporary transcript file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            temp_file.write(transcript)
            transcript_path = temp_file.name

        print(f"Created temporary transcript file: {transcript_path}")

        # Build conversation config from request data or use defaults
        conversation_config = {
            'creativity': float(data.get('creativity', 0.7)),
            'conversation_style': data.get('conversation_style', ['casual']),
            'roles_person1': data.get('roles_person1', 'Host'),
            'roles_person2': data.get('roles_person2', 'Guest'),
            'dialogue_structure': data.get('dialogue_structure', ['Introduction', 'Content', 'Conclusion']),
            'podcast_name': data.get('podcast_name', 'Custom Transcript Podcast'),
            'podcast_tagline': data.get('podcast_tagline', ''),
            'output_language': data.get('output_language', 'English'),
            'user_instructions': data.get('user_instructions', ''),
            'engagement_techniques': data.get('engagement_techniques', []),
            'text_to_speech': {
                'temp_audio_dir': TEMP_DIR,  
                'ending_message': data.get('ending_message', "Bye Bye!"),
                'default_tts_model': tts_model,
                'audio_format': 'mp3',
                'output_directories': {
                    'audio': AUDIO_DIR,
                    'transcripts': TRANSCRIPT_DIR,
                    tts_model: {
                            'default_voices': default_voices, 
                            'model': tts_model
                    }
                }
            }
        }

        # Generate the podcast from transcript
        result = generate_podcast(
            transcript_file=transcript_path,
            conversation_config=conversation_config,
            tts_model=tts_model,
            api_key_label=api_key_label
        )

        # Clean up temporary file
        try:
            os.unlink(transcript_path)
            print(f"Cleaned up temporary transcript file: {transcript_path}")
        except Exception as e:
            print(f"Warning: Could not delete temporary file {transcript_path}: {e}")

        # Handle the result
        if isinstance(result, str):
            return jsonify({
                'success': True,
                'audio_url': f'/audio/{os.path.basename(result)}',
            })
        elif hasattr(result, 'audio_path'):
            print(f"Audio file path: {result.audio_path}")
            print(f"File exists: {os.path.exists(result.audio_path)}")
            return jsonify({
                'success': True,
                'audio_url': f'/audio/{os.path.basename(result.audio_path)}',
                'transcript': result.details if hasattr(result, 'details') else None
            })
        else:
            return jsonify({'error': 'Invalid result format'}), 500

    except Exception as e:
        print(f"\nError in generate_from_transcript: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

### ------------------------------------------------------------------------------------------------
### test environment variables
### ------------------------------------------------------------------------------------------------
@app.route('/api/test-env', methods=['GET'])
def test_env():
    """Test endpoint to verify environment variables"""
    return jsonify({
        'api_token_set': bool(API_TOKEN),
        'api_token_length': len(API_TOKEN) if API_TOKEN else 0,
    })

### ------------------------------------------------------------------------------------------------
### allowed file types
### ------------------------------------------------------------------------------------------------        
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

### ------------------------------------------------------------------------------------------------
### service audio file requests
### ------------------------------------------------------------------------------------------------    
@app.route('/audio/<path:filename>')
def serve_audio(filename):
    """Serve generated audio files"""
    # Check all possible audio paths
    possible_paths = [
        os.path.join(TEMP_DIR, filename),
        os.path.join(AUDIO_DIR, filename),
        os.path.join('data/audio', filename), # does podcastfy use this?
        os.path.join('tmp', filename),
        # Add any additional mounted volume paths here
        # "/app/data/audio/" + filename,
    ]

    for path in possible_paths:
        if os.path.exists(path):
            print(f"Serving audio from: {path}")
            return send_file(path)

    return jsonify({'error': 'Audio file not found'}), 404

### ------------------------------------------------------------------------------------------------
### upload files return file paths
### ------------------------------------------------------------------------------------------------
@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    file_paths = []

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            # in local windows dev, a full os.path (e.g. C:/) doesn't work
            # file_paths.append(f'./static/uploads/{filename}')
            # file_paths.append(filepath)
            # try returning a URL instead
            # get the base URL
            base_url = request.url_root
            file_paths.append(f'{base_url}/static/uploads/{filename}')
            print(f"Uploaded: {filepath}")
            print(f"File URL: {file_paths[-1]}")

    return jsonify({'file_paths': file_paths})

### ------------------------------------------------------------------------------------------------
### run the app
### ------------------------------------------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    socketio.run(app,
                 host='0.0.0.0',
                 port=port,
                 debug=False,  # Set to False in production
                 allow_unsafe_werkzeug=True)