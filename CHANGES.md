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
    x - add more API KEYS to .env file
    x - allow paste into text field
    x - add support for tts_model="gemini"
    x - audio file play and download not working

    - clear text on load
    - read API KEYs from .env file
    - read default config.yaml file from project folder
    - read default conversation_config.yaml file 
    - save and select from generated transcripts
    - save and select advanced settings 
    - add UI for customization options for the podcast
    - select voices from a drop down for each provider
    - add support for different voices and multi-speaker in Gemini
    - add support for Hume AI
    - store transcripts, podcasts in a database
    - file manager for documents, URLs, transcripts 
    - manage topics, multiple transcripts (overview, short, long), podcasts, podcasts, episodes
    - store transcripts, podcasts in a database


