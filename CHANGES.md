# CHANGES.md

### 3/12/2025: Add drag and drop file upload (using Cursor AI)

Can you help me add a drag and drop file upload component on this page? The uploaded files should be less than 10MB and stored in the data/uploads folder.  

1. CustomPodcast.tsx (changes)
2. FileUpload.tsx (new)
3. route.ts (new)
4. npm install react-dropzone

This implementation:
- Creates a drag-and-drop file upload component with visual feedback
- Limits file size to 10MB
- Stores files in the data/uploads directory
- Shows uploaded files in the UI with the ability to remove them
- Integrates with the existing form submission
- Provides error handling and loading states
- Supports multiple file uploads

Make sure to create the data/uploads directory in your project root and add it to your .gitignore file if you don't want to track uploaded files:

You may also want to add appropriate file type validation and security measures depending on your specific requirements.

### 3/12/2025:
- CustomPodcast.tsx: added support for pasting text into the URL field
    - x add more API KEYS to .env file
    - x allow paste into text field
    - x add support for tts_model="gemini"
    - x audio file play and download not working
    - x installed standard podcastfy package for now
    - x add UI for customization options for the podcast
    - x clear text on load

### 3/14/2025: In the CustomPodcast.tsx file, right below the "Text-to-Speech Model" dropdown selection of AI models, I would like to add new text fields for: "Voice Question", "Voice Answer", and "Model". 

This will:
Add three new input fields for voice configuration
Automatically update the fields when the TTS model changes
Use the specified default values for each model
Include the voice settings in the form submission
The fields will appear right below the TTS model selection and automatically update when the user changes the TTS model.

Can you load the ttsVoiceDefaults from a yaml file?  Also, define the values for ConversationStyle, DialogueStructure, EngagementTechnique, and TTSModel in the samle yaml file.

This approach:
Centralizes all configuration in one YAML file
Provides type safety through TypeScript interfaces
Makes it easier to modify values without changing code
Keeps the configuration separate from the component logic
The component will work exactly the same, but the values are now loaded from the configuration file instead of being hardcoded in the component.

### 3/14/2025: Can you add a "Secret Key" input field in the API Keys section of APIKeys.tsx? That will be used to read default API Keys from the .env file instead of the API keys entered by the user. You can place the Secret Key field right below the heading "API Keys". Also, add two more input fields for "Hume AI" and "Play HT" API Keys.  Then, check CustomPodcast.tsx to to make sure those new API keys are handled properly and passed in the payload when calling generate_podcast. 

I've made all the necessary changes to add the new API key fields and handle them properly:
Added a Secret Key field and two new API key fields (Hume AI and Play HT) to the APIKeys component
Updated the PodcastPayload interface to include the new API keys
Updated the TTSModel type to include the new models
Added voice defaults for the new TTS models
Updated the getRequiredApiKey function to handle the new API keys
Added the new TTS models to the selection dropdown
Updated the payload construction to include the secret key and new API keys
The changes maintain the existing functionality while adding support for the new API keys. The Secret Key field is placed at the top of the API Keys section, and the new API key fields follow the same pattern as the existing ones, including:
Password visibility toggle
Save functionality
Session storage persistence
Help tooltips
Proper validation
The backend will now receive these new API keys in the payload when generating podcasts.

Keeps API keys secure in the backend
Uses default API keys from environment variables when the secret key matches
Falls back to user-provided API keys when no secret key is provided or it doesn't match
Doesn't expose the default API keys to the frontend
Maintains the existing API key input fields for users who don't have the secret key
The user experience remains the same - they can either:
Enter the secret key to use default API keys (without seeing them)
Enter their own API keys manually
Do both - enter some API keys manually and use defaults for others
This is a more secure approach since the default API keys never leave the server.


### Todo:
    x - read API KEYs from .env file
    x - podcastfy: add support for different voices and multi-speaker in Gemini
    x - add option to set the length of the podcast in word count
    x - read default conversation_config.yaml file - not needed?
    x - create podcast from transcript
    - podcastfy: add support for Hume AI, Play HT. Check langchain.
    - podcastfy: Add Deepseek, Grok for content to transcript
    - podcastfy: Add Play.ht, Hume AI for transcript to speech
    - check why can't view the transcript: podcastify doesn't return file name
    - read default config.yaml file from project folder - what type of info?
    - save and select from generated transcripts for each user
    - save and select advanced settings for each user
    - select voices from a drop down for each provider
    - store transcripts, podcasts in a database
    - file manager UI for uploaded documents, URLs, transcripts 
    - create and manage topics to group multiple transcripts, podcasts, episodes
    - store list of voices by provider, gender, language, model in a yaml file
    - add Type: newscast, sportscast, debate, interview, seminar, presentation, documentary  
    - Handle duplicate file uploads
    - integrate podcastfy code into PodStudio? - no need
    - deploy to Netlify.dev / Fly.dev 

- submit text file transcripts, youtube videos,
- (nice to have - mp4 videos and have system transcribe)
x - choose voices and TTM model
x - Add intro title ("welcome to X, tagline Y")
- structure the format like a newscast
- less of 2 person podcast and more of news anchor introducing topic and second voice acts as reporter commenting
- ideally with different voices for different reporters for different topics
- ability to change tone and style via prompt engineering

