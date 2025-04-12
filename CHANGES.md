# CHANGES.md


### Todo Features:
    x - read API KEYs from .env file
    x - podcastfy: add support for different voices and multi-speaker in Gemini
    x - add option to set the length of the podcast in word count
    x - read default conversation_config.yaml file - not needed?
    x - create podcast from transcript
    x - deploy to Netlify.dev (no) / Fly.dev (yes)
    x - implement Firebase initStorage() to upload images to Firebase storage
    x - store transcripts, podcasts, episodes in a database (check microfeed)
    x - Document page: add button to "Extract Text from URL/Doc"
    x - save and select from generated transcripts for each user
    x - save and select advanced settings for each user
    x - file manager UI for uploaded documents, URLs, transcripts 
    x - integrate podcastfy code into PodStudio? - no need
    x - choose voices and TTM model
    x - Extract text: use podcastfy ContentExtractor 
    x - Documents: Extract Text button just extracts text, not images or tables.
    x - Transcripts page: "Create Transcript from Document" button to generate new transcript from a document.
    x - simple access control with secret_key: only permitted users
    x - DocumentDetails: make Source URL a list to support multiple sources.
    x - DocumentDetails: support multiple file uploads, text extract support multiple documents for text extraction. 
    x - https://github.com/lfnovo/open-notebook/blob/main/open_notebook/plugins/podcasts.py
    x - Add schema, page for AI Models


    - podcastfy: Add Deepseek, Grok for content to transcript
    - podcastfy: Add Play.ht, Hume AI for transcript to speech
    - podcastfy: add support for local LLMs. Check langchain.
    - check why can't view the transcript: podcastify doesn't return file name
    - read default config.yaml file from project folder - what type of info?
    - create and manage topics to group multiple transcripts, podcasts, episodes
    - select voices from a drop down for each provider
    - store list of voices by provider, gender, language, model in a yaml file
    - add Type: newscast, sportscast, debate, interview, seminar, presentation, documentary  
    - Handle duplicate and multiple file uploads

- submit text file transcripts, youtube videos,
- (nice to have - mp4 videos and have system transcribe)
x - Add intro title ("welcome to X, tagline Y")
- structure the format like a newscast
- less of 2 person podcast and more of news anchor introducing topic and second voice acts as reporter commenting
- ideally with different voices for different reporters for different topics
- ability to change tone and style via prompt engineering

### Issues:
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead. Flask/Werkzeug is single threaded, not for production, use a production WSGI server. 


### PodStudio / PodCon Prototype 
(I didn't use this spec with Bolt.new. Instead, I started with OpenPod code, then used Cursor.ai to build features by feature).

>>> 1. Create a webapp named "Pod Studio" that allows the user to generate and manage audio podcasts from text, images, documents, videos

The UI should be clean, modern, and look like xxx.  User login is required to use the app. 

Set up a full-stack application with: 
- Frontend app based on Next.js, React, and shadcn.  
- Use Vite build tool on port 5173.
- Ensure responsive design across all device sizes using Tailwind CSS.
- Use Lucide icon library
- User login and authentication using Firebase. Allow Google, Facebook, or Microsoft sign-in. 
- Create a separate service layer for API calls by moving them from the UI components into dedicated service files, following best practices for separation of concerns and maintainability.

For the backend, I'd like the following:
- Server framework using Node.js and Express.js
- Store all API KEYS in a .env configuration file
- Database using Firestore and and user authentication using Firebase 
- Server connection to multiple LLM APIs: OpenAI, Gemini 
- (fails NPM install) remove DeepSeek, Anthropic
- Server connection to multiple Text-to-Speech APIs: ElevenLabs, Play.ai, Gemini 
- Support concurrent execution of both servers via package.json scripts.

>>> 3. User Interface
>>> 2. Key Functionality
- drag and drop files (max 10MB)
- store uploaded files in data/uploads
- podcast customization features
- add title, description, image to the episode

>>> 3. Database
- update podcasts collection in Firestore
>>> 3. Setup backend database and user authentication on Firebase. 
>>> 3. Setup backend database and user authentication on Supabase. 
- Create database schemas for Users, Subscriptions, Personas, Documents, Topics, Transcripts, Prompts, Podcasts, Episodes, Questions, Chats. 
- Please ensure the data is consistent and follows the existing schema relationships.

The schemas should have at least the following data fields:

Users: user_id, login_id, password, first_name, last_name, email1, email2, phone, avatar, addresses, preferences, personas, following_topics, following_users, followed_by_users, subscription_type, subscription_startdate, subscription_enddate, last_payment_date, next_payment_date, payment_method, card_name, card_number, card_expire, card_cvv, card_city

Documents: doc_id, doc_name, doc_desc, topic_tags, doc_source_url, doc_extracted_text, extract_tool, extract_datetime, doc_source_format:txt/pdf/docx/mp3

Topics: topic_id, topic_name, topic_image, topic_type:place/company/school/club/person/sport/issue, related_topic_tags, datetime, followed_by_users, is_private, managed_by

Transcripts: transcript_id, transcript_type:interview/meeting/article/petition, topic_tags, create_datetime, modified_datetime, delete_datetime, transcript_model, transcript_text 

Prompts: prompt_id, prompt_name, prompt_desc, created_by, create_datetime, modified_datetime, delete_datetime, is_active, target_persona, prompt_text, prompt_audio

Podcasts: podcast_id, podcast_title, podcast_image, podcast_desc, podcast_type:summary/audio_podcast/video_podcast, podcast_hosts,  podcast_format:html/mp3/mp4, topic_tags, prompt_id, followers, create_datetime, subscription_type 

Episodes: podcast_id, episode_id, episode_title, episode_desc, topic_tags, views, likes, dislikes, create_datetime, publish_datetime, expire_datetime, content_duration, content_url, content_image 

Questions: question_id, podcast_id, question_text, question_audio, clicks, user_id, create_datetime

>>> 4. Create a server script to create seed data to populate the database, including realistic sample entries for all tables. Here are example topics for Topics: "Newton, MA", "Weston, MA", "Massachusetts", "Elizabeth Warren", "Newton High School", "Soccer".

>>> 5. (### at end of each session - added to system prompt)
- Make sure you create all files required for the app to run.
- Please implement all features maintaining best practices and proper error handling.
- You must record your changes into docs/CHANGELOG.md
- Document all requirements I gave you into the docs folder.
- Include functional/non-functional features, implementation details, and the intended user experience.

>>> 6. Changes:

>>> xx. Later:
- Bolt.new does not yet support server framework using Python, Django, and Fast API.
- Integrate to Anthropic, DeepSeek
- integrate to Hume AI (not working initially, can't find NPM package)
- add full semantic text search: check orama
 
>>> xx. Deploy this application.


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

### 3/28/25: Can you help me add a new page to upload and manage documents? On top there are 2 tabs: Browse Documents and Upload Documents. In Browse Documents there's a document list panel on the left and a document details panel on the right. On top of the list panel, there is a Search and Filter buttons. In the list panel you can view all the records from Documents collection in Firebase based on the schema defined in documents.ts and database-service.ts. The list shows the doc_name and topic_tags. Selecting a document in the list shows details in the Details Panel. Details Panel shows a form to view and edit all the fields. Below the form are buttons for "Save" and "Cancel". Save button updates the record in Firebase. "Cancel" just clears any changes to the form. 

This implementation provides:
A tabbed interface for browsing and uploading documents
A document list with search and filter capabilities (filter to be implemented later)
A details panel for viewing and editing document properties
Integration with Firebase using the existing database service
Basic error handling and loading states
Responsive layout using CSS Grid
To use this, you'll need to:
Create the files in their respective directories
Add the page to your Next.js/React Router configuration
Ensure all the UI components (Button, Input, etc.) are properly imported
Test the Firebase integration


### 3/28/25: Can you redesign the layout of the main page in app.tsx to have these top level tabs: Podcasts, Episodes, Documents, Transcripts, Prompts. The existing CustomPodcast and TopicPodcast tabs go under Podcasts. The new Browse Documents and Upload Documents go under Documents. The API key section defined in APIKeys.tsx can go as "Settings" under a top level menu in the header. 

Key changes made:
Created a header with the app title and a settings dropdown menu containing the API Keys component
Implemented top-level tabs for all main sections
Nested the existing CustomPodcast and TopicPodcast under the Podcasts tab
Nested the DocumentBrowser and DocumentUpload under the Documents tab
Added placeholder sections for Episodes, Transcripts, and Prompts
Removed the old grid layout and simplified the structure
Maintained all existing functionality while providing a cleaner navigation structure
The layout now provides:
Clear hierarchical navigation
Easy access to settings via the dropdown menu
Consistent styling across all sections
Room for future expansion of features
Would you like me to explain any part in more detail or help implement any of the placeholder sections?

### 3/28/25: Filter button shows a dropdown with fields that can be filtered, but this will be defined later. Upload Documents panel: User can upload documents in txt, pdf, docx, ppt like in the Custom Podcasts page and are stored in the uploads folder. The uploaded document is parsed to extract the text into text data. Below the upload component, there is a new form to enter document details and view or edit the extracted text, based on the Documents schema defined in documents.ts. Below the form are buttons for "Save" and "Cancel". Save button creates a new record in Firebase using the schema in documents.ts and database-service.ts. "Cancel" just clears the form.      

This implementation includes:
File upload functionality using the existing FileUpload component
A form for document details based on the Document schema
Automatic text extraction (currently simulated)
File format detection
Integration with Firebase using the documentsService
Form validation and error handling
Toast notifications for user feedback
Cancel functionality to reset the form
For the Filter button in DocumentBrowser, we can add this placeholder dropdown:

The filter functionality can be implemented later by adding state management and filter logic to the DocumentBrowser component.
Would you like me to explain any part in more detail or help with implementing additional features?

### 3/29/25: In the Documents page, change Upload Documents tab to a button placed above the Details panel, so the Document list panel is always visible.  The Browse tab can be removed. In Document detail panel, add all the fields defined in the Document schema, and add a "Delete" button in between "Cancel" and "Save" buttons to delete the record from the database using documentsService.deleteDocument function.  

### 3/29/25: Prompts page: For the Prompts page, similar to the Documents management page, there's a prompts browse panel on the left and a prompts details panel on the right. On top of the List panel, there is a Search and a Filter buttons. On top right outside of the Details panel there’s a New Prompt button. In the List panel you can view all the records from prompts collection in Firebase based on the schema defined in prompts.ts and database-service.ts. The list shows the prompts_name and prompt_desc (up to 30 characters). Selecting a prompt item in the list shows details in the Details Panel. 

### Details Panel shows a details form to view and edit all the fields. Below the form are buttons for "Cancel", "Delete", "Save Changes", and “Create Podcast”. “Save Changes” button updates the record in Firebase. "Cancel" clears any changes, "Delete" deletes the record from the database. 

### “New Prompt” button creates a new record in the prompts collection using the same form as the details form. 

I've created three components that work together to provide the Prompts management functionality:
PromptsPage: The main page component that:
Manages the state for selected prompt and new prompt form visibility
Handles CRUD operations through the prompts service
Provides the layout with two panels
Includes the "New Prompt" button
PromptBrowser: The left panel component that:
Shows a searchable list of prompts
Displays prompt name and truncated description
Includes search and filter functionality
Becomes disabled when creating a new prompt
PromptDetails: The right panel component that:
Shows all fields from the Prompt schema
Handles both editing existing prompts and creating new ones
Includes buttons for Cancel, Delete, Save Changes, and Create Podcast
Shows a placeholder when no prompt is selected
The components follow the same patterns as the Documents management page, with similar styling and behavior. The main differences are:
Different fields based on the Prompt schema
Additional "Create Podcast" button
Simplified filter options specific to prompts
No file upload functionality (since prompts are text-based)
You'll need to ensure that the promptsService in your database service has the necessary methods (getAllPrompts, createPrompt, updatePrompt, deletePrompt) implemented to work with Firebase.

### 2/29/25: For the Transcripts page, similar to the Prompts page, there's a transcripts browse panel on the left and a transcripts details panel on the right. On top of the List panel, there is a Search and a Filter buttons. On top right outside of the Details panel there’s a New Transcript button. In the List panel you can view all the records from Transcripts collection in Firebase based on the schema defined in transcripts.ts and database-service.ts. The list shows the transcript_name and topic_tags. Selecting a transcript item in the list shows details in the Details Panel. 

### Details Panel shows a details form to view and edit all the fields. Below the form are buttons for "Cancel", "Delete",  and "Save Changes". “Save Changes” button updates the record in Firebase. "Cancel" clears any changes, "Delete" deletes the record from the database. 

### “New Transcript” button creates a new record in the transcripts collection using the same form as details form. 

### 3/30/25: For the Podcasts page, it has a Browse panel on the left and a Details panel that work like the Prompts and Transcripts pages. On top of the Browse panel, there is a Search and a Filter buttons. On top of the Details panel there are Cancel, Delete, Save Changes, and New Podcast buttons. These buttons operate like in the TranscriptDetail panel.

### In the Browse panel you can view all the records from Podcasts collection based on the schema in podcasts.ts and database-service.ts. The list shows the podcast_name and topic_tags. Selecting a podcast item in the list shows details in the Details panel.

### Details panel shows a form to view and edit all the podcast fields, including a list of all the episodes for this podcast based on the episodes.ts schema. For new records, use an image file drop component for podcast_image.

### Filter button shows a dropdown with fields that can be filtered, including podcast_type, Deleted true/false, Active true/false switches. 

### 3/30/25: Now for the Episodes page, it has a Browse panel on the left and a Details panel that work like the Podcasts and Transcripts pages. On top of the Browse panel, there is a Search and a Filter buttons. On top of the Details panel there are Cancel, Delete, Save Changes, and New Episode buttons. These buttons operate like in the PodcastDetail and TranscriptDetail panels.

### In the Browse panel you can view all the records from Episodes collection based on the schema in episodes.ts and database-service.ts. The list shows the episode_title and topic_tags. Selecting an episode item in the list shows details in the Details panel.

### Details panel shows a form to view and edit all the fields based on the episodes.ts schema. For new records, use an image file drop component for content_image. When editing or adding a new record, the Podcast Id, Prompt Id, and Transcript Id inputs should be pop-up windows with search input and a list of is_active=true and is_deleted=false Podcast/Transcript Id and Title records for selection. 

### Filter button shows a dropdown with fields that can be filtered, including Deleted true/false, Active true/false switches.

### 4/1/25: In DocumentDetails, implement a handler for Extract Text button to call "extract_text" API service in app.py using socket.emit(). Use a payload object with these parameters: text, urls [], extract_tool, secret_key. Check if there is a uploaded file or source_url. Pass the uploaded file and/or doc_source_url in the url[] parameter. Set extract_tool to "podcastfy". You can see an example on how to call the service API using socket.io in CustomPodcast.tsx onSubmit handler. Wait for the result and set the result into the extracted_text field.  

I've implemented the Extract Text button handler in DocumentDetails.tsx. Here's what the implementation does:
Added the socket.io-client import to enable WebSocket communication.
Added a new state variable isExtracting to track the extraction process.
Implemented the handleExtractText function that:
Validates that there's either a source URL or uploaded files to extract from
Creates a WebSocket connection to the server
Prepares the payload with:
Empty text (since we're extracting from URLs)
URLs array containing both the source URL and uploaded files
extract_tool set to "podcastfy"
secret_key from session storage
Sets up event handlers for:
connect: Emits the extract_text event with the payload
progress: Logs progress messages
error: Shows error toast messages
disconnect: Cleans up the connection
complete: Updates the form with the extracted text
Updated the Extract Text button to:
Call the new handleExtractText function
Show a loading state with spinner while extracting
Disable the button during extraction
The implementation follows the same pattern as seen in CustomPodcast.tsx, but is focused specifically on text extraction. When the extraction is complete, the extracted text will be placed in the doc_extracted_text field of the form.

### 4/2/25: Create Transcript:
Help me create a CreateTranscript page triggered by "Create Transcript" tab item in App.tsx. There are 2 panels. On the left panel, which is similar in size as the EpisodeBrowser component, it shows the steps: "1. Select a Document" text with SelectDialog component right below to select a document from Documents database. Then it shows "2. Select a Prompt" text with similar SelectDialog to select a prompt. Then it shows "3. Generate Transcript" button.

When a document and prompt are selected, show on the right panel a read-only DocumentDetails component on top and a PromptDetails component below filled with the selections. Hide the Cancel, Delete, and Save buttons.

The "Generate Transcript" button calls "generate_podcast" service API implemented in app.py using socket.io similar to how it's done in onSubmit() in CustomPodcast.tsx.  In the Payload, pass these parameters with data from selected Document and Prompt:   

        const payload: PodcastPayload = {
          transcript_only: True
          text: values.doc_extracted_text,
          urls: [...parsedUrls],
          name: values.doc_name,
          tagline: values.doc_desc,
          is_long_form: values.is_long_form,
          word_count: values.word_count,
          creativity: values.creativity,
          conversation_style: values.conversation_style,
          roles_person1: values.roles_person1,
          roles_person2: values.roles_person2,
          dialogue_structure: values.dialogue_structure,
          user_instructions: values.user_instructions,
          engagement_techniques: values.engagement_techniques,
          ending_message: values.ending_message,
          secret_key: sessionStorage.getItem("secret_key") || "",
        }

When the result comes back, show a TranscriptDetails component above DocumentDetail and PromptDetail components with an editable new Transcript record populated with the selected doc_id, prompt_id, and the result filled in transcript_text field. Show the Cancel and Save Transcript buttons. 

### 4/3/25: I'd like to create a new component similar to CreateTranscript.tsx called CreatePodcast that is triggered by "Create Podcast" tab in App.tsx. There are 2 panels. On the left panel,  it shows the steps: 1. "Select a Podcast" text label with SelectDialog button to select a podcast from Podcasts database. "2. Select a Transcript" text with a SelectDialog component. Next a "3. Select a Prompt" text with a SelectDialog. Then it shows "Generate Podcast" button, similar to "Generate Transcript" button in CreateTranscript.tsx. 

When a podcast, document and prompt are all selected, show on the right panel PodcastDetails, TranscriptDetails, and PromptDetails components filled with the selections. These components should be read-only. Hide the Cancel, Delete, and Save buttons. Hide the is_active and is_deleted fields.  

The "Generate Podcast" button calls "generate_podcast" service API implemented in app.py using socket.io similar to how it's done in onSubmit() in CustomPodcast.tsx.  In the Payload, pass these parameters with data from selected Document and Prompt:   

const payload: PodcastPayload = {
          is_from_transcript: True,
          transcript_only: False,
          text: selectedTranscript.transcript_text,
          name: selectedPodcast.podcast_title,
          tagline: selectedPodcast.podcast_tagline,
          is_long_form: selectedPrompt.is_long_form,
          word_count: selectedPrompt.word_count,
          creativity: selectedPrompt.creativity,
          conversation_style: selectedPrompt.conversation_style,
          roles_person1: selectedPrompt.roles_person1,
          roles_person2: selectedPrompt.roles_person2,
          dialogue_structure: selectedPrompt.dialogue_structure,
          user_instructions: selectedPrompt.prompt_text,
          engagement_techniques: selectedPrompt.engagement_techniques,
          ending_message: selectedPrompt.ending_message,
          tts_model: selectedPrompt.tts_model as TTSModel,
          voice_question: selectedPrompt.voice_question,
          voice_answer: selectedPrompt.voice_answer,
          voice_model: selectedPrompt.voice_model,
          secret_key: sessionStorage.getItem("secret_key") || "",
        };

When the result comes back, show an editable EpisodeDetails component above PodcastDetails, TranscriptDetails, and PromptDetails components with a new Episode record populated with the selected podcast_id, transcript_id, and prompt_id, along with Cancel and Save Changes buttons on top. Set new episode_url with the generated audio file. Also, copy SelectedTranscript.transcript_text to newEpisode.content_transcript, and copy SelectedPodcast.podcast_image to newEpisode.content_image.    


### Bug Fixes:

x - clone and adapt OpenPod: https://github.com/giulioco/openpod
x - using local .venv 
x - OpenPod.ipynb - port to Colab, play with it
x - cloned repo to local and Cloud Shell
x - Build OpenPod: local and Cloud Shell
x - build and debug in VS Core and Cursor
x - install my custom podcastfy package
x - add more API KEYS to .env file
x - upload to private GitHub repo 
x - figure out how to debug Python (app.py and podcastfy)
x - add drag and drop file upload UI component
x - allow paste into text field
x - add support for tts_model="gemini"
x - audio file play and download not working
x - enter voices for question and answer for each provider
x - add UI for customization options for the podcast
x - clear text on load
x - secret key to use API KEYs from .env file
x - add word_count and ending_message options
x - podcastfy: add support for different voices and multi-speaker in Gemini
x - read default conversation_config.yaml file - not needed?
x - add option to set the length of the podcast in word count
x - create podcast from transcript
x - check how an uploaded transcript file is passed to generate_from_transcript function 
x - deploy to Netlify.dev (no) / Fly.dev (yes)
x - issue with clicking on tooltips and triggering form submit
x - issue with uploading txt files
x - issue with processing txt files - just copy txt to the text field?
x - download triggers another Generate Podcast.
x - Try Bolt or Cursor to generate code for new features.
x - clear url list and other fields on clear form button.
x - Prompts: add podcastfy settings
x - Filter: Deleted true/false 
x - select voices from a drop down for each provider
x - Transcript schema: add doc_id
x - Podcasts/Episodes page: podcast_slug: from podcast_title, and episode_title
x - when updating a record, the change is not reflected in the record browser panel as it has an earlier snapshot. Need to implement snapshot.docChange() listener: 
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "modified") {
      console.log("Modified document: ", change.document.data());
In this example, the onSnapshot function sets up a listener for changes to the "your_collection" collection. The docChanges() method returns an array of DocumentChange objects, and the code iterates over them to check for modified documents.
x - Episodes: test of view(yes), delete(yes), edit-save(yes), new-save(yes)
x - Prompts: test of view(yes), delete(yes), edit-save(yes), new-save(yes)
x - Transcripts: test of view(yes), delete(yes), edit-save(yes), new-save(yes)
x - Podcasts: test of view(yes), delete(yes), edit-save(save), new-save(yes)
x - Documents: of test view(yes), delete, edit-save(yes), new-save(yes), 
x - Podcasts/Episodes schema: need to update Four Freedoms schema
x - Document upload: test document file upload
x - app.py: check how API_TOKEN is used
x - app.py: QUESTION: What does this do?
socketio = SocketIO(app, cors_allowed_origins="*")
This line initializes a WebSocket server using Flask-SocketIO with two important parameters:
cors_allowed_origins="*": This parameter configures Cross-Origin Resource Sharing (CORS) settings for the WebSocket server:
The "*" value means that the WebSocket server will accept connections from any origin (domain)
This is particularly useful during development when your frontend and backend might be running on different ports (e.g., frontend on port 5173 and backend on port 8080)
In production, you might want to restrict this to specific origins for security reasons
x - DocumentDetail: uploaded file can't be read by app.py:extract_text - should be either file path or URL. If it's a local file, pass the file path. It's sending 2 entries in url[].
x - If record has changed, ask user to save/cancel before exiting page
x - CreateTranscript: processing logo is missing
x - In all the detail panels, if closing the component but form data has changed, ask user to confirm discarding data.
x - generate_podcast(transcript_only) is returning only file name
x - app.py: Generate transcript returns text or filepath? Need text data.
x - issue with Vite app not loading in fly.dev:
Although I haven’t used React with Vite I believe the issue here is that vite builds its static files at what we call “build time”. Our secrets are only available at runtime (when you machine is started) so frontend apps such as NextJS need to have these envs as build args.
Here’s the doc for NextJS build args: Run a NextJS App · Fly Docs
https://fly.io/docs/js/frameworks/nextjs/#exposing-environment-variables-to-the-browser
Roughly add this to your Dockerfile before the CMD part:
ARG VITE_SUPABASE_API_URL="value"
ARG VITE_SUPABASE_KEY="Other value"
I can see that you defined these as secrets thinking about security. But I think that since this project is client-side react either way these secrets are going to be in your bundle.js anyway so I assume this is fine to not-be-a-secret (please someone with Supabase knowledge correct me if Im wrong)

https://fly.io/docs/apps/build-secrets/#automate-the-inclusion-of-build-secrets-using-an-ephemeral-machine
https://docs.docker.com/engine/swarm/secrets/

x - Bun run build deletes /static folder
x - use /public folder to store content
x - Prompts: add llm_model, created_at
x - only need id, not id and episode_id, in all collections
x - Database record id must be same document ID
x - Create Podcast: error saving new episode created on 4/5, other save works
x - Create Podcast: not saving to right folder in fly.dev: should be /audio
x - Create Podcast: saved content url is tmp/audio -> should be /audio
x - app.py: generate_podcast - return audio path without '/public'
x - CreateTranscript.tsx: add a switch to pass either source_urls or extracted_text or source_urls from Document, not both.
x - Podcast/EpisodeDetails: image and upload component layout issue
x - PodcastDetails > Episodes list: add desc, publish_date, edit button, compact audio player
x - make llm_model_name configurable: "gemini-1.5-pro-latest"
URL vs Filepath: 
- "Files in the public directory are served at the root path." 
- Instead of /public/images/filename.jpg, use /images/filename.jpg.
- File paths for uploads, images: show as /public/uploads or /public/images
- For now, only show filename 
- Issue: if saving in Windows, it saves url as '\public\uploads\', which may be different for 
- Better to hide /public, /uploads, /images on the app UI. Just show relative path (e.g. /uploads/filename)
- Handle duplicate files (should create an internal filename or add a counter)
- Rule for uploaded files: store storage_location (localhost, fly.dev, firebase, cloudfare) and relative path (e.g. /uploads, /images)
- e.g. /upload/filename, /images/filename), but actual path is ./public/upload
- Does <audio> component work if content_url=/audio/filename.mp3 or must be /public/audio/filename.mp3?
- How about episode/podcast image?  
- Has to be /public/images/name.jpg or /images/name.jpg?
- <CDN>/upload/filename 
- app.py/generate_podcast: how to handle filepaths, urls gracefully. Removing '/public' from audio url may cause other problems, should use relative paths and make the storage location (base_url = request.url_root) flexible. Maybe need both "Url" and "filePath"
x - Play button hover on the episode image 
x - Get more podcast types from Open Notebook in plugins/podcast.py
x - Make LLM/TTS model version database configurable 
x - sort browser records by updated_at
