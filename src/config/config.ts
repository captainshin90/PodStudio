// Configuration object for all API keys and settings
// Variables prefixed with VITE_ are accessible within your Vite-processed code through the import.meta.env object.
// Example:
// If you have an environment variable named API_URL defined as VITE_API_URL, you can access it in your code as import.meta.env.VITE_API_URL.
// Server-Side Only:
// Variables without the VITE_ prefix are only available on the server-side. 
// This is because Vite is a build tool that only runs in the browser.
// If you need to access server-side variables, you can use the import.meta.env object.
// https://vite.dev/guide/env-and-mode

const env = import.meta.env;

export const config = {
  port: env.VITE_PORT || 3001,
  apiPort: env.VITE_API_PORT || 3001,
  apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:3001', 

  // Firebase configuration 
  firebase: {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
  },

  // Firestore configuration
  firestore: {
    databaseId: env.VITE_FIRESTORE_DATABASE_ID || '',
  },
  
  // Server app.py reads in config parameters from from .env file
  defaultLLMProvider: env.VITE_DEFAULT_LLM_PROVIDER || 'gemini',
  defaultTTSProvider: env.VITE_DEFAULT_TTS_PROVIDER || 'gemini',
  defaultExtractTool: env.VITE_DEFAULT_EXTRACT_TOOL || 'podcastfy',

  // OpenAI configuration
  openai: {
    apiKey: env.VITE_OPENAI_API_KEY || '',
    llmModel: env.VITE_OPENAI_LLM_MODEL || 'gpt-3.5-turbo',
    ttsModel: env.VITE_OPENAI_TTS_MODEL || '',
    maxTokens: env.VITE_OPENAI_MAX_TOKENS || 1000,
    temperature: env.VITE_OPENAI_TEMPERATURE || 0.7,
  },
  
  // Microsoft Edge configuration
  edge: {
    apiKey: env.VITE_EDGE_API_KEY || '',
    llmModel: env.VITE_EDGE_LLM_MODEL || '',
    ttsModel: env.VITE_EDGE_TTS_MODEL || 'edge',
    maxTokens: env.VITE_EDGE_MAX_TOKENS || 1000, 
    temperature: env.VITE_EDGE_TEMPERATURE || 0.7,
  },

  // Google Gemini configuration
  gemini: {
    apiKey: env.VITE_GEMINI_API_KEY || '',
    llmModel: env.VITE_GEMINI_LLM_MODEL || 'gemini-1.5-pro-latest',
    ttsModel: env.VITE_GEMINI_TTS_MODEL || 'gemini-1.5-pro-latest',
    maxTokens: env.VITE_GEMINI_MAX_TOKENS || 1000,
    temperature: env.VITE_GEMINI_TEMPERATURE || 0.7,
  },

  // xAI configuration
  xai: {
    apiKey: env.VITE_XAI_API_KEY || '',
    llmModel: env.VITE_XAI_LLM_MODEL || 'grok-1.5-pro-latest',
    ttsModel: env.VITE_XAI_TTS_MODEL || 'grok',
    maxTokens: env.VITE_GEMINI_MAX_TOKENS || 1000,
    temperature: env.VITE_GEMINI_TEMPERATURE || 0.7,
  },

  // Anthropic configuration
  anthropic: {
    apiKey: env.VITE_ANTHROPIC_API_KEY || '',
    llmModel: env.VITE_ANTHROPIC_LLM_MODEL || 'claude-3-5-sonnet',
    ttsModel: env.VITE_ANTHROPIC_TTS_MODEL || '',
    maxTokens: env.VITE_ANTHROPIC_MAX_TOKENS || 1000,
    temperature: env.VITE_ANTHROPIC_TEMPERATURE || 0.7,
  },

  // Deepseek configuration
  deepseek: {
    apiKey: env.VITE_DEEPSEEK_API_KEY || '',
    apiUrl: env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    llmModel: env.VITE_DEEPSEEK_LLM_MODEL || 'deepseek-chat',
    ttsModel: env.VITE_DEEPSEEK_TTS_MODEL || '',
    maxTokens: env.VITE_DEEPSEEK_MAX_TOKENS || 1000,
    temperature: env.VITE_DEEPSEEK_TEMPERATURE || 0.7,
  },

  // ElevenLabs configuration
  elevenlabs: {
    apiKey: env.VITE_ELEVENLABS_API_KEY || '',
    voiceId: env.VITE_ELEVENLABS_VOICE_ID || 'default',
    llmModel: env.VITE_ELEVENLABS_LLM_MODEL || '',
    ttsModel: env.VITE_ELEVENLABS_TTS_MODEL || 'default',
  },
  
  // Play.ai configuration
  playai: {
    apiKey: env.VITE_PLAYAI_API_KEY || '',
    llmModel: env.VITE_PLAYAI_LLM_MODEL || '',
    ttsModel: env.VITE_PLAYAI_TTS_MODEL || '',
  },

  // Hume configuration
  hume: {
    apiKey: env.VITE_HUME_API_KEY || '',
    llmModel: env.VITE_HUME_LLM_MODEL || '',
    ttsModel: env.VITE_HUME_TTS_MODEL || '',
  },
}; 
