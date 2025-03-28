///////////////////////////////////////////////////////////////////////////////
// client-side apiService API service for API calls to server-side API points
///////////////////////////////////////////////////////////////////////////////

import axios from 'axios';
import { episodesService, transcriptsService } from './database-service';
import config from '@/server/config';

// Create axios instance with base configuration.
// Axios is a promise-based HTTP client that can be used in Next.js applications 
// to make requests to external APIs or your own server. 
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // timeout set to 10 seconds
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('Making API request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response received:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data
        }
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', {
        message: error.message,
        request: error.request,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Error:', {
        message: error.message,
        stack: error.stack,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
    }
    return Promise.reject(error);
  }
);

///////////////////////////////////////////////////////////////////////////////
// chatAPIService API service for chat/LLM
///////////////////////////////////////////////////////////////////////////////
export const chatAPIService = {
  // Generate a new conversation ID
  generateConversationId: () => {
    return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  },

  // Send message to LLM
  // Parameters: message, conversationHistory, podcastContext
  sendMessage: async (
    message: string, 
    conversationHistory: Array<{ sender: 'user' | 'assistant', content: string }>,
    podcastContext?: {
      episodeId: string;
    }
  ) => {
    try {
      let episodeContext = null;
      
      // If podcast context is provided, fetch the episode details
      if (podcastContext) {
        try {
          const episode = await episodesService.getEpisodeById(podcastContext.episodeId);
          const transcript = await transcriptsService.getTranscriptById(episode?.transcript_id);
          if (episode) {
            episodeContext = {   
              // be careful as this must match formatPodcastContext in server/services/llm-service.js
              // episode_id: episode.id,  // no need to send this to LLM
              episode_title: episode.episode_title,
              episode_desc: episode.episode_desc,
              content_duration: episode.content_duration,
              transcript_type: transcript?.transcript_type,
              transcript_text: transcript?.transcript_text,   // should be full source transcript document
              // documents:[transcript?.documents]       // TODO: can have multiple documents
              // topic_tags: episode.topic_tags          // TODO: can have multiple topic tags
              topic_tags: ['townhall', 'politics', 'election']  // hard code for now
            };
          }
        } catch (error) {
          console.error('Error fetching episode context:', error);
          // Continue without episode context if fetch fails
        }
      }
      
      // Context array for additional context (not needed with conversationId)
      // TODO: should reset conversationId when user clicks on a new episode?      
      // send message to LLM service server-side (must match the route in server/routes/api.js)
      // Parameters: message, context, episodeContext (must match the route in server/routes/api.js)
      const response = await apiClient.post('/chat', { 
        message, 
        context: conversationHistory,    // Pass the conversation history as context
        episodeContext                   // episodeContext needed for LLM service
      });

      // response must match the format in server/routes/api.js
      // response: response.content,
      // provider: response.provider
      if (!response.data) {
        throw new Error('No data received from API');
      }

      return response.data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error; // Re-throw to be handled by the caller
    }
  },

  
  // TODO: These should be client side calls to databaseService?

  // Get conversation history
  getConversationHistory: async (conversationId: string) => {
    const response = await apiClient.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },
  
  // Get all conversations
  getConversations: async () => {
    const response = await apiClient.get('/chat/conversations');
    return response.data;
  },
};


///////////////////////////////////////////////////////////////////////////////
// podcastService API service for podcasts to server-side API points
///////////////////////////////////////////////////////////////////////////////
// TODO: These should be client side calls to databaseService?

export const podcastService = {
  // Get featured podcasts
  getFeaturedPodcasts: async () => {
    const response = await apiClient.get('/podcasts/featured');
    return response.data;
  },
  
  // Get podcast by ID
  getPodcast: async (id: string) => {
    const response = await apiClient.get(`/podcasts/${id}`);
    return response.data;
  },
  
  // Get podcast episodes
  getPodcastEpisodes: async (podcastId: string) => {
    const response = await apiClient.get(`/podcasts/${podcastId}/episodes`);
    return response.data;
  },
  
    // Get episode by ID
    getEpisode: async (podcastId: string, episodeId: string) => {
      const response = await apiClient.get(`/podcasts/${podcastId}/episodes/${episodeId}`);
      return response.data;
    },

    // Get transcript by ID
    getTranscript: async (transcriptId: string) => {
      const response = await apiClient.get(`/transcripts/${transcriptId}`);
      return response.data;
    },
  
  // Search podcasts
  searchPodcasts: async (query: string) => {
    const response = await apiClient.get(`/podcasts/search?q=${query}`);
    return response.data;
  },
};


///////////////////////////////////////////////////////////////////////////////
// userService API service for user preferences
///////////////////////////////////////////////////////////////////////////////
// TODO: These should be client side calls to databaseService?

export const userService = {
  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (profileData: any) => {
    const response = await apiClient.put('/user/profile', profileData);
    return response.data;
  },
  
  // Get user favorites
  getFavorites: async () => {
    const response = await apiClient.get('/user/favorites');
    return response.data;
  },
  
  // Add to favorites
  addToFavorites: async (itemId: string, itemType: 'podcast' | 'episode') => {
    const response = await apiClient.post('/user/favorites', { itemId, itemType });
    return response.data;
  },
  
  // Remove from favorites
  removeFromFavorites: async (itemId: string) => {
    const response = await apiClient.delete(`/user/favorites/${itemId}`);
    return response.data;
  },
  
  // Get recently played
  getRecentlyPlayed: async () => {
    const response = await apiClient.get('/user/recently-played');
    return response.data;
  },
};