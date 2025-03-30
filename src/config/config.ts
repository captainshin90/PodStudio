// Configuration object for all API keys and settings
export const config = {
  port: import.meta.env.VITE_PORT || 3000,
  apiPort: import.meta.env.VITE_API_PORT || 3001,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api', 
  
  defaultLlmProvider: import.meta.env.VITE_DEFAULT_LLM_PROVIDER || 'gemini',
  defaultTtsProvider: import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs',

  // OpenAI configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    llmModel: import.meta.env.VITE_OPENAI_LLM_MODEL || 'gpt-3.5-turbo',
    maxTokens: import.meta.env.VITE_OPENAI_MAX_TOKENS || 1000,
    temperature: import.meta.env.VITE_OPENAI_TEMPERATURE || 0.7,
  },
  
  // Google Gemini configuration
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    llmModel: import.meta.env.VITE_GEMINI_LLM_MODEL || 'gemini-pro',
    maxTokens: import.meta.env.VITE_GEMINI_MAX_TOKENS || 1000,
    temperature: import.meta.env.VITE_GEMINI_TEMPERATURE || 0.7,
  },

  // Anthropic configuration
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    llmModel: import.meta.env.VITE_ANTHROPIC_LLM_MODEL || 'claude-3-5-sonnet',
    maxTokens: import.meta.env.VITE_ANTHROPIC_MAX_TOKENS || 1000,
    temperature: import.meta.env.VITE_ANTHROPIC_TEMPERATURE || 0.7,
  },

  // Deepseek configuration
  deepseek: {
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
    apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    llmModel: import.meta.env.VITE_DEEPSEEK_LLM_MODEL || 'deepseek-chat',
    maxTokens: import.meta.env.VITE_DEEPSEEK_MAX_TOKENS || 1000,
    temperature: import.meta.env.VITE_DEEPSEEK_TEMPERATURE || 0.7,
  },

  // ElevenLabs configuration
  elevenLabs: {
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
    voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'default',
  },
  
  // Play.ai configuration
  playAi: {
    apiKey: import.meta.env.VITE_PLAYAI_API_KEY || '',
  },
  
  // Firebase configuration 
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  },

  // Firestore configuration
  firestore: {
    databaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || '',
  },
}; 
