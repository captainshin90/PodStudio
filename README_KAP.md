## AI Podcast Studio


### Key Info 

Deployed site: https://podstudio.fly.dev/

- This project is running in local .venv (Windows) with Python 3.13.2
- Activate the venv (inn Windows):
  > .\.venv\Scripts\activate  
  (.venv) C:\SRC\PodStudio> 

- Frontend is vite - React/Tailwind/shadcn/WebSocket
- Backend is app.py - Flask/Python/NodeJs/Bun

- Need to update app.py with server's IP address and port

- To install the customized podcastfy package:
xx (.venv) > pip install C:/SRC/podcastfy/dist/podcastfy-0.4.1.tar.gz
xx don't need. 

- To build the development frontend and backend:
  (.venv) > C:\SRC\podstudio> bun dev 

- To build the production frontend and backend:
  (.venv) > C:\SRC\podstudio> bun run build

- To regenerate the bun.lockb file, simply run bun install in your project directory. This will re-evaluate your dependencies and create a new lockfile based on your package.json. 
  (.venv> > bun install)

- To regenerate package-lock.json, run:
  (.venv) > npm install --package-lock 

- Open browser: 
  http://localhost:5173

- to debug frontend (Vite): 
    - in the main .venv terminal:
    (.venv)> bun dev   # runs both frontend and backend together
    - from Run Debug: select "Launch Chrome against localhost
    - opens a second debug terminal

- To debug backend (App.py):
    - in the main .venv terminal: 
    (.venv) > bun dev:frontend   # will run vite on http://localhost:5173/
    - from Run Debug: select "Python: Flask app.py"
      - will run app.py on http://127.0.0.1:8080 
      - opens a second debug terminal

- OR, open package.json, choose >Debug button and choose configuration


- To create a new GitHub repo: https://github.com/captainshin90/<new-repo>
  (.venv) > git remote remove origin   # remove old clone origin
  (.venv) > git init
  (.venv) > git remote add origin https://github.com/captainshin90/PodStudio.git  # add my private repo as the origin 
  (.venv) > git config --global --add safe.directory /workspaces/<new-repo>  # when working with .devcontainer

- To check in code to repo: 
  (.venv) > git add .
  (.venv) > git branch -M main  # when local code has no branch
  (.venv) > git commit -m "Describe code change"  #
  (.venv) > git push -u origin main               # push changed files to GitHub

- To remove a previously committed file from the repo (but not delete locally):
  > git rm --cashed <filename>   (git rm -r --cached <folder/>)


### Deploy to Netlify
- for Bun, the publishing site is "static"
- pull from GitHub https://github.com/captainshin90/PodStudio
> npm install netlify-cli -g
> netlify login
> netlify init
> netlify env:import .env  - name of .env file 


### Prerequisites

- Node.js 18+
- Python 3.11
- pip
- bun
- pyenv
- Poetry (optional but recommended)
- Fly.io CLI


### Development Setup

1. Clone the repository:

```bash
(done) git clone https://github.com/giulioco/openpod
(done) cd openpod
```

2. Set up Python environment:

# Running in local venv, not Dev Container. Buy my local machine has python 3.13.2.
# Need pyenv to run python 3.11.7

## Already running in a dev.container, so skip pyenv and venv

# Install Python 3.11.7 with shared libraries enabled
```bash
# env PYTHON_CONFIGURE_OPTS="--enable-shared" pyenv install 3.11.7
# pyenv local 3.11.7

# Create and activate virtual environment
# (done) python -m venv .venv
# source .venv/bin/activate  # On Unix/MacOS
# or
# (done) .\.venv\Scripts\activate  # On Windows

# Upgrade pip
(done) pip install --upgrade pip
```

3. Install backend dependencies:
```bash
(done) pip install -r requirements.txt
```

4.5 Install bun:
```bash
(done) npm install -g bun
(done) bun upgrade

# Install frontend dependencies
(done) bun install

# when running with Python 3.12+ build fails due to deprecated audioop. 
# Need to run: 
(done) pip install audioop-lts

# install Vite
(done) npm install -D vite

# install Concurrently
(done) pip install concurrently
```

4. Set up environment variables:

```bash
(done) cp .env.example .env
# Edit .env with your configuration
```

5. For Windows, need to edit package.json to change "python app.py" to "py app.py"

6. Start the development servers:
```bash
bun dev
```


The application will be available at `http://localhost:5173`

## With Google Cloud Shell, select Web Preview link but change the port to 5173.


### Deployment with Fly.io

https://fly.io/docs/flyctl/install/


1. Install the Fly CLI:

Windows: 
> pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"


```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly:
```bash
fly auth login
```

3. Create a new app:
```bash
fly launch
```

4. Set up environment variables:
```bash
# Generate a secure API token (from .devcontainer Linux)
(done) openssl rand -hex 32
c07f18dfc8b0ade00a085f6c81407078dd5c398661c5c240e6fdb2f70e939c09
# Set it in Fly.io
(done) fly secrets set API_TOKEN=c07f18dfc8b0ade00a085f6c81407078dd5c398661c5c240e6fdb2f70e939c09
```
(done) run fly secrets set for all KEYS in .env


5. Create a volume for audio files:
```bash
(done) fly volumes create audio_data --size 1
```

6. Deploy the application:
```bash
# Deploy to Fly.io (this will automatically build both frontend and backend)
(done) fly deploy
```

Deploy Token: name: "kapremote"
FlyV1 fm2_lJPECAAAAAAACGlqxBAFOrnNuXvWoXr6YHcP2nTrwrVodHRwczovL2FwaS5mbHkuaW8vdjGWAJLOAA9nCB8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDxbonrVi192QZH5w0ZxRxigF0/cXarVnyNbb14TlFksrdi55iCEmc3DMCCcT5m3Ot3IkMHEBp+ay2Z8APDETlvjGr0yVYed3pW8GZCyWRNQBD8InMX0UGSV6uv2/41xecJ1xY+wg34lArcEtiNYVVY+7vp+4KfUg2D2crF493o6a+OL38XmTh+U3CztKg2SlAORgc4Aam12HwWRgqdidWlsZGVyH6J3Zx8BxCBD+VH6EgXoa59UWzfdPZSLq35Pm/F3NIhz31lIng+/bg==,fm2_lJPETlvjGr0yVYed3pW8GZCyWRNQBD8InMX0UGSV6uv2/41xecJ1xY+wg34lArcEtiNYVVY+7vp+4KfUg2D2crF493o6a+OL38XmTh+U3CztKsQQwCeM0pLhj2FfwlOpYxhZpsO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZgEks5n1jgEzwAAAAEjzlYiF84ADs7oCpHOAA7O6AzEEEQQt4RFvfQQMbho4QRrf/rEIEN/K1Mwn1OE1D09uvBtH7O0gPXAcIFcdl8gEYSRrtfM


Issues with Bun lock file:
https://bun.sh/blog/bun-lock-text-lockfile
- bun.lock is text file new format
- bun.lockb is binary

How to deploy .env file to Fly.io:
- use command: fly secrets set API_KEY=....
- or use Fly.io admin console

Your API will be available at:
- Web UI: `https://your-app.fly.dev`
- API Endpoint: `https://your-app.fly.dev/api/generate-from-transcript`

Make sure to include your API token in requests:

```bash
curl -X POST \
  https://your-app.fly.dev/api/generate-from-transcript \
  -H 'Authorization: Bearer your_api_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "Your transcript here",
    "podcast_name": "My Podcast",
    "google_key": "your_google_api_key"
  }'
```

### Project Structure

```
.
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   └── hooks/           # Custom React hooks
├── app.py               # Flask backend
├── requirements.txt     # Python dependencies
└── fly.toml            # Fly.io configuration
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### API Endpoints

#### Generate Podcast from Transcript

A secure endpoint that generates podcasts from existing transcripts. Requires API token authentication.

##### Authentication

1. Generate a secure API token and add it to your `.env` file:
```bash
# Generate a secure token
openssl rand -hex 32

# Add to .env
API_TOKEN=your_generated_token
```

##### Endpoint Details

- **URL**: `/api/generate-from-transcript`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Headers**:
  ```
  Authorization: Bearer your_api_token
  Content-Type: application/json
  ```

##### Request Body
```json
{
  "transcript": "Your conversation transcript here",
  "tts_model": "geminimulti", // optional
  "creativity": 0.7, // optional
  "conversation_style": ["casual", "humorous"], // optional
  "roles_person1": "Host", // optional
  "roles_person2": "Guest", // optional
  "dialogue_structure": ["Introduction", "Content", "Conclusion"], // optional
  "podcast_name": "My Custom Podcast", // optional
  "podcast_tagline": "", // optional
  "output_language": "English", // optional
  "user_instructions": "", // optional
  "engagement_techniques": [], // optional
  "ending_message": "Thank you for listening", // optional
  "google_key": "your_google_api_key" // required for gemini/geminimulti
}
```

##### Response
Success Response:

```json
{
  "success": true,
  "audio_url": "/audio/transcript_podcast_abc123.mp3",
  "transcript": "Processed transcript..." // if available
}
```

Error Response:
```json
{
  "error": "Error message here"
}
```

##### Example Usage

```bash
curl -X POST \
  http://your-server/api/generate-from-transcript \
  -H 'Authorization: Bearer your_api_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "transcript": "<Person1> Hi and welcome to the podcast! </Person1>\n<Person2> Thanks for having me! </Person2>\n<Person1> Let'\''s get started with our first topic. </Person1>",
    "podcast_name": "My Custom Podcast",
    "google_key": "your_google_api_key"
  }'
```

For Windows PowerShell users:

```powershell
$body = @{
    transcript = "<Person1> Hi and welcome to the podcast! </Person1>`n<Person2> Thanks for having me! </Person2>`n<Person1> Let's get started with our first topic. </Person1>"
    podcast_name = "My Custom Podcast"
    google_key = "your_google_api_key"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
    -Uri "http://your-server/api/generate-from-transcript" `
    -Headers @{
        "Authorization" = "Bearer your_api_token"
        "Content-Type" = "application/json"
    } `
    -Body $body
```
