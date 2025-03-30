// lib/services/database-service.ts
// This is the database service for the client side of the application.
// It is used to interact with the Firestore database.
// It is also used to interact with the Firebase Auth service.

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
//  deleteDoc,  // not doing hard deletes
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  addDoc,
//  DocumentReference,
  DocumentData,
  FirestoreError,
  Firestore,
  writeBatch,
//  enableIndexedDbPersistence,
//  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
// import { Auth, getAuth, User } from "firebase/auth";
import { initFirestore } from "@/lib/firebase";
// import { useDebugValue } from "react";


//if (!(this.db)) {
//  throw new Error("Firestore database is not initialized.");
//}

// Enable offline persistence with a larger cache size
//try {
//  enableIndexedDbPersistence(db, {
//    cacheSizeBytes: CACHE_SIZE_UNLIMITED
//  }).catch((err) => {
//    if (err.code === 'failed-precondition') {
//      // Multiple tabs open, persistence can only be enabled in one tab at a time
//      console.warn('Persistence failed: Multiple tabs open');
//    } else if (err.code === 'unimplemented') {
//      // The current browser does not support all of the features required for persistence
//      console.warn('Persistence not supported by this browser');
//    } else {
//      console.error('Persistence error:', err);
//    }
//  });
//} catch (error) {
//  console.error('Error enabling persistence:', error);
//}

///////////////////////////////////////////////////////////////////////////////
// Generic database service for CRUD operations
///////////////////////////////////////////////////////////////////////////////
export class DatabaseService {
  private static instance: DatabaseService;
  public db: Firestore | undefined;

  constructor() {
    this.init();    
  } 

  private async init() {
    try {
      this.db = await initFirestore();
      if (!this.db) {
        throw new Error("Failed to initialize Firestore");
      }
      console.log("Database service initialized successfully");
    } catch (error) {
      console.error("Firestore initialization error:", error);
      // Don't throw the error, let the app continue with limited functionality
    }
  }

  // singleton class to hold global state
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Create a new document with a specific Firestore Document ID
  async createWithId(collection: string, id: string, data: any): Promise<void> {
    try {
      if (this.db && collection && id) {
        const docRef = doc(this.db, collection, id);
        await setDoc(docRef, {
          ...data,
          created_at: Timestamp.now(),
          is_deleted: false
        });
      }
    } catch (error) {
      console.error(`Error creating document in ${collection} with ID ${id}:`, error);
      this.handleFirestoreError(error as FirestoreError);
      throw error;
    }
  }

  // Create a new document with auto-generated Firestore Document ID
  async create(collectionName: string, data: any): Promise<string | null> {
    if (this.db && collectionName) {
      try {
        const collectionRef = collection(this.db, collectionName);
        // console.log(`Creating document in ${collectionName}`);
        const docRef = await addDoc(collectionRef, {

          ...data,
          created_at: Timestamp.now(),
          is_deleted: false
        });
        return docRef.id;        
      } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        this.handleFirestoreError(error as FirestoreError);
        throw error;
      }
    } else return null;
  }

  // Get a document by Firestore Document ID
  async getById(collectionName: string, id: string): Promise<DocumentData | null> {
    if (this.db && collectionName && id) {
      try {
          const docRef = doc(this.db, collectionName, id);
          const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        } else {
          return null;
        }
      } catch (error) {
        console.error(`Error getting document from ${collectionName} with ID ${id}:`, error);
        this.handleFirestoreError(error as FirestoreError);
        throw error;
      }
    } else return null;
  }

  // Update a document by Firestore Document ID
  async update(collectionName: string, id: string, data: any): Promise<void> {
    if (this.db && collectionName && id) {
      try {
        const docRef = doc(this.db, collectionName, id);
        await updateDoc(docRef, {
          ...data,
          updated_at: Timestamp.now()
      });
      } catch (error) {
        console.error(`Error updating document in ${collectionName} with ID ${id}:`, error);
        this.handleFirestoreError(error as FirestoreError);
        throw error;
      }
    } else return;
  }

  // Soft delete a document by Firestore Document ID
  async delete(collectionName: string, id: string): Promise<void> {
    if (this.db && collectionName && id) {
      try {
        const docRef = doc(this.db, collectionName, id);
        // await deleteDoc(docRef);
        await updateDoc(docRef, {       // soft delete
          deleted_at: Timestamp.now(),
          is_deleted: true
        });
      } catch (error) {
        console.error(`Error deleting document from ${collectionName} with ID ${id}:`, error);
        this.handleFirestoreError(error as FirestoreError);
        throw error;
      }
    } else return;
  }

  // Sof delete all document matching the conditions
  async deleteAll(collectionName: string, conditions: { field: string; operator: string; value: any }[]): Promise<void> {
    if (this.db && collectionName) {
      try {
        const collectionRef = collection(this.db, collectionName);
        const q = query(collectionRef, 
          ...conditions.map(condition => where(condition.field, condition.operator as any, condition.value)));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(this.db);

        querySnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            deleted_at: Timestamp.now(),
            is_deleted: true
          });
        });

        await batch.commit();
      } catch (error) {
        console.error(`Error deleting documents from ${collectionName}:`, error);
        this.handleFirestoreError(error as FirestoreError);
        throw error;
      }
    } else return;
  }

  // Get all documents from a collection
  async getAll(collectionName: string): Promise<DocumentData[] | null> {
      if (this.db && collectionName) {
        try {
        const collectionRef = collection(this.db, collectionName);
        const querySnapshot = await getDocs(collectionRef);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error(`Error getting all documents from ${collectionName}:`, error);
        this.handleFirestoreError(error as FirestoreError);
        throw error;
      }
    } else return null;
  }

  // Query documents with filters
  async query(
    collectionName: string, 
    conditions: { field: string; operator: string; value: any }[],
    orderByField?: string,
    orderDirection?: 'asc' | 'desc',
    limitCount?: number
  ): Promise<DocumentData[] | null> {

    if (this.db && collectionName) {
      try {
        const collectionRef = collection(this.db, collectionName);
        let q = query(collectionRef);
        
        // Apply where conditions
        if (conditions && conditions.length > 0) {
          q = query(
            q, 
            ...conditions.map(condition => 
              where(condition.field, condition.operator as any, condition.value)
            )
          );
        }
        
        // Apply orderBy
        if (orderByField) {
          q = query(q, orderBy(orderByField, orderDirection || 'asc'));
        }
        
        // Apply limit
        if (limitCount) {
          q = query(q, limit(limitCount));
        }
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error(`Error querying documents from ${collectionName}:`, error);
        this.handleFirestoreError(error as FirestoreError);
        throw error;
      }
    } else return null;
  }

  // Handle Firestore errors with more detailed logging
  private handleFirestoreError(error: FirestoreError): void {
    if (error.code === 'unavailable') {
      console.warn('Firebase connection unavailable. Attempting to use cached data...');
      // Don't throw the error, let the app continue with cached data
    } else if (error.code === 'permission-denied') {
      console.error('Firebase permission denied. Check your security rules and authentication.');
      throw error;
    } else if (error.code === 'not-found') {
      console.warn('Firebase resource not found. This might be expected for new users.');
      // Don't throw the error for not-found as it might be expected
    } else if (error.code === 'resource-exhausted') {
      console.error('Firebase resource exhausted. You may have exceeded your quota or rate limits.');
      throw error;
    } else {
      console.error('Firebase error:', error);
      throw error;
    }
  }

} // end of DatabaseService class

///////////////////////////////////////////////////////////////////////////////
// access singleton object
///////////////////////////////////////////////////////////////////////////////

export let databaseService = DatabaseService.getInstance();


///////////////////////////////////////////////////////////////////////////////
// Specific services for each collection
// Be Careful: Uses any data type and does not validate data
// 
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// User services
///////////////////////////////////////////////////////////////////////////////

export const usersService = {
  async createUser(userId: string, userData: any): Promise<void> {
    return databaseService.createWithId('users', userId, userData);
  },
  
  async getUserById(userId: string): Promise<DocumentData | null> {
    const users = await databaseService.query('users', [
      { field: 'user_id', operator: '==', value: userId }
    ]);
    if (users)
      return users.length > 0 ? users[0] : null;
    else return null;
  },
  
  async updateUser(id: string, userData: any): Promise<void> {
    return databaseService.update('users', id, userData);
  },
  
  async deleteUser(id: string): Promise<void> {
    return databaseService.delete('users', id);
  },

  async getUserByEmail(email: string): Promise<DocumentData | null> {
    const users = await databaseService.query('users', [
      { field: 'email1', operator: '==', value: email }
    ]);
    if (users)
      return users.length > 0 ? users[0] : null;
    else return null;
  },

  async getAllUsers(): Promise<DocumentData[] | null> {
    return databaseService.getAll('users');
  }
};

///////////////////////////////////////////////////////////////////////////////
// Subscription services
///////////////////////////////////////////////////////////////////////////////

export const subscriptionsService = {
  async getAllSubscriptions(): Promise<DocumentData[] | null> {
    return databaseService.getAll('subscriptions');
  },
  
  async getSubscriptionById(subscriptionId: string): Promise<DocumentData | null> {
    const subscriptions = await databaseService.query('subscriptions', [
      { field: 'subscription_id', operator: '==', value: subscriptionId }
    ]);
    if (subscriptions)
      return subscriptions.length > 0 ? subscriptions[0] : null;
    else return null;
  },
  
  async createSubscription(subscriptionData: any): Promise<string | null> {
    return databaseService.create('subscriptions', subscriptionData);
  },
  
  async updateSubscription(id: string, subscriptionData: any): Promise<void> {
    return databaseService.update('subscriptions', id, subscriptionData);
  },

  async deleteSubscription(id: string): Promise<void> {
    return databaseService.delete('subscriptions', id);
  },
  
  async getActiveSubscriptions( ): Promise<DocumentData[] | null> {
    return databaseService.query('subscriptions', [
      { field: 'is_active', operator: '==', value: true }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Persona services
///////////////////////////////////////////////////////////////////////////////

export const personasService = {
  async getAllPersonas(): Promise<DocumentData[] | null> {
    return databaseService.getAll('personas');
  },
  
  async getPersonaById(personaId: string): Promise<DocumentData | null> {
    const personas = await databaseService.query('personas', [
      { field: 'persona_id', operator: '==', value: personaId }
    ]);
    if (personas)
      return personas.length > 0 ? personas[0] : null;
    else return null;
  },
  
  async createPersona(personaData: any): Promise<string | null> {
    return databaseService.create('personas', personaData);
  },

  async updatePersona(id: string, personaData: any): Promise<void> {
    return databaseService.update('personas', id, personaData);
  },

  async deletePersona(id: string): Promise<void> {
    return databaseService.delete('personas', id);
  },
  
  async getPersonasByType(type: string): Promise<DocumentData[] | null> {
    return databaseService.query('personas', [
      { field: 'persona_type', operator: '==', value: type }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Document services
///////////////////////////////////////////////////////////////////////////////

export const documentsService = {
  async getAllDocuments(): Promise<DocumentData[] | null> {
    return databaseService.getAll('documents');
  },
  
  async getDocumentById(docId: string): Promise<DocumentData | null> {
    const documents = await databaseService.query('documents', [
      { field: 'doc_id', operator: '==', value: docId }
    ]);
    if (documents)
      return documents.length > 0 ? documents[0] : null;
    else return null;
  },
  
  async createDocument(documentData: any): Promise<string | null> {
    return databaseService.create('documents', documentData);
  },
  
  async updateDocument(id: string, documentData: any): Promise<void> {
    return databaseService.update('documents', id, documentData);
  },

  async deleteDocument(id: string): Promise<void> {
    return databaseService.delete('documents', id);
  },
    
  async getDocumentsByTopic(topicTag: string): Promise<DocumentData[] | null> {
    return databaseService.query('documents', [
      { field: 'topic_tags', operator: 'array-contains', value: topicTag }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Topic services
///////////////////////////////////////////////////////////////////////////////

export const topicsService = {
  async getAllTopics(): Promise<DocumentData[] | null> {
    return databaseService.getAll('topics');
  },
  
  async getTopicById(topicId: string): Promise<DocumentData | null> {
    const topics = await databaseService.query('topics', [
      { field: 'topic_id', operator: '==', value: topicId }
    ]);
    if (topics)
      return topics.length > 0 ? topics[0] : null;
    else return null;
  },
  
  async createTopic(topicData: any): Promise<string | null> {
    return databaseService.create('topics', topicData);
  },
  
  async updateTopic(id: string, topicData: any): Promise<void> {
    return databaseService.update('topics', id, topicData);
  },
  
  async getTopicsByType(type: string): Promise<DocumentData[] | null> {
    return databaseService.query('topics', [
      { field: 'topic_type', operator: '==', value: type }
    ]);
  },
  
  async deleteTopic(id: string): Promise<void> {
    return databaseService.delete('topics', id);
  },
  
  async getPublicTopics( ): Promise<DocumentData[] | null> {
    return databaseService.query('topics', [
      { field: 'is_private', operator: '==', value: false }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Transcript services
///////////////////////////////////////////////////////////////////////////////

export const transcriptsService = {
  async getAllTranscripts(): Promise<DocumentData[] | null> {
    return databaseService.getAll('transcripts');
  },
  
  async getTranscriptById(transcriptId: string): Promise<DocumentData | null> {
    const transcripts = await databaseService.query('transcripts', [
      { field: 'transcript_id', operator: '==', value: transcriptId }
    ]);
    if (transcripts)
      return transcripts.length > 0 ? transcripts[0] : null;
    else return null;
  },
  
  async createTranscript(transcriptData: any): Promise<string | null> {
    return databaseService.create('transcripts', transcriptData);
  },
  
  async updateTranscript(id: string, transcriptData: any): Promise<void> {
    return databaseService.update('transcripts', id, transcriptData);
  },
  
  async deleteTranscript(id: string): Promise<void> {
    return databaseService.delete('transcripts', id);
  },
  
  async getTranscriptsByType(type: string): Promise<DocumentData[] | null> {
    return databaseService.query('transcripts', [
      { field: 'transcript_type', operator: '==', value: type }
    ]);
  },
  
  async getTranscriptsByTopic(topicTag: string): Promise<DocumentData[] | null> {
    return databaseService.query('transcripts', [
      { field: 'topic_tags', operator: 'array-contains', value: topicTag }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Prompt services
///////////////////////////////////////////////////////////////////////////////

export const promptsService = {
  async getAllPrompts(): Promise<DocumentData[] | null> {
    return databaseService.getAll('prompts');
  },
  
  async getPromptById(promptId: string): Promise<DocumentData | null> {
    const prompts = await databaseService.query('prompts', [
      { field: 'prompt_id', operator: '==', value: promptId }
    ]);
    if (prompts)
      return prompts.length > 0 ? prompts[0] : null;
    else return null;
  },
  
  async createPrompt(promptData: any): Promise<string | null> {
    return databaseService.create('prompts', promptData);
  },
  
  async updatePrompt(id: string, promptData: any): Promise<void> {
    return databaseService.update('prompts', id, promptData);
  },

  async deletePrompt(id: string): Promise<void> {
    return databaseService.delete('prompts', id);
  },

  async getActivePrompts(): Promise<DocumentData[] | null> {
    return databaseService.query('prompts', [
      { field: 'is_active', operator: '==', value: true }
    ]);
  },
  
  async getPromptsByPersona(personaId: string): Promise<DocumentData[] | null> {
    return databaseService.query('prompts', [
      { field: 'target_persona', operator: '==', value: personaId }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Podcast services
///////////////////////////////////////////////////////////////////////////////

export const podcastsService = {
  async getAllPodcasts(): Promise<DocumentData[] | null> {
    return databaseService.getAll('podcasts');
  },
  
  async getPodcastById(podcastId: string): Promise<DocumentData | null> {
    const podcasts = await databaseService.query('podcasts', [
      { field: 'podcast_id', operator: '==', value: podcastId }
    ]);
    if (podcasts)
      return podcasts.length > 0 ? podcasts[0] : null;
    else return null;
  },
  
  async createPodcast(podcastData: any): Promise<string | null> {
    return databaseService.create('podcasts', podcastData);
  },
  
  async updatePodcast(id: string, podcastData: any): Promise<void> {
    return databaseService.update('podcasts', id, podcastData);
  },

  async deletePodcast(id: string): Promise<void> {
    return databaseService.delete('podcasts', id);
  },

  async getPodcastsByType(type: string): Promise<DocumentData[] | null> {
    return databaseService.query('podcasts', [
      { field: 'podcast_type', operator: '==', value: type }
    ]);
  },
  
  async getPodcastsByTopic(topicTag: string): Promise<DocumentData[] | null> {
    return databaseService.query('podcasts', [
      { field: 'topic_tags', operator: 'array-contains', value: topicTag }
    ]);
  },
  
  async getPodcastsBySubscriptionType(subscriptionType: string): Promise<DocumentData[] | null> {
    return databaseService.query('podcasts', [
      { field: 'subscription_type', operator: '==', value: subscriptionType }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Episode services
///////////////////////////////////////////////////////////////////////////////

export const episodesService = {
  async getAllEpisodes(podcastId?: string): Promise<DocumentData[] | null> {
    if (podcastId) {
      return databaseService.query('episodes', [
        { field: 'podcast_id', operator: '==', value: podcastId }
      ]);
    } else {
      return databaseService.getAll('episodes');
    }
  },

  // why need both podcastId and episodeId?
  async getEpisodeById(/*podcastId: string,*/ episodeId: string): Promise<DocumentData | null> {
    const episodes = await databaseService.query('episodes', [
//      { field: 'podcast_id', operator: '==', value: podcastId },
      { field: 'episode_id', operator: '==', value: episodeId }
    ]);
    if (episodes)
      return episodes.length > 0 ? episodes[0] : null;
    else return null;
  },
  
  async createEpisode(episodeData: any): Promise<string | null> {
    return databaseService.create('episodes', episodeData);
  },
  
  async updateEpisode(id: string, episodeData: any): Promise<void> {
    return databaseService.update('episodes', id, episodeData);
  },

  async deleteEpisode(id: string): Promise<void> {
    return databaseService.delete('episodes', id);
  },
  
  async getEpisodesByTopic(topicTag: string): Promise<DocumentData[] | null> {
    return databaseService.query('episodes', [
      { field: 'topic_tags', operator: 'array-contains', value: topicTag }
    ]);
  },
  
  async getRecentEpisodes(limit: number = 10): Promise<DocumentData[] | null> {
    return databaseService.query(
      'episodes', 
      [], 
      'publish_date', 'desc', limit
    );
  },
  
  async getPopularEpisodes(limit: number = 10): Promise<DocumentData[] | null> {
    return databaseService.query(
      'episodes', 
      [], 
      'views', 'desc', limit
    );
  }
};

///////////////////////////////////////////////////////////////////////////////
// Question services
///////////////////////////////////////////////////////////////////////////////

export const questionsService = {
  async getAllQuestions(podcastId?: string): Promise<DocumentData[] | null> {
    if (podcastId) {
      return databaseService.query('questions', [
        { field: 'podcast_id', operator: '==', value: podcastId }
      ]);
    }
    return databaseService.getAll('questions');
  },
  
  async createQuestion(questionData: any): Promise<string | null> {
    return databaseService.create('questions', questionData);
  },
  
  async updateQuestion(id: string, questionData: any): Promise<void> {
    return databaseService.update('questions', id, questionData);
  },

  async deleteQuestion(id: string): Promise<void> {
    return databaseService.delete('questions', id);
  },

  async getPopularQuestions(podcastId: string, limit: number = 10): Promise<DocumentData[] | null> {
    return databaseService.query('questions', 
      [{ field: 'podcast_id', operator: '==', value: podcastId }], 
      'clicks', 'desc', limit   // sort by clicks, descending, limit to 10
    );
  },
  
  async getUserQuestions(userId: string): Promise<DocumentData[] | null> {
    return databaseService.query('questions', [
      { field: 'user_id', operator: '==', value: userId }
    ]);
  }
};

///////////////////////////////////////////////////////////////////////////////
// Chat services
///////////////////////////////////////////////////////////////////////////////

export const chatsService = {
  async getChatHistory(userId: string): Promise<DocumentData[] | null> {
    return databaseService.query(
      'chats',
      [{ field: 'user_id', operator: '==', value: userId }],
      'created_at', 'asc'
    );
  },
  
  async createChatMessage(chatData: any): Promise<string | null> {
    return databaseService.create('chats', chatData);
  },
  
  // soft delete
  async deleteChatMessage(id: string): Promise<void> {
    return databaseService.delete('chats', id);
  },
  
  async getActiveChatHistory(userId: string): Promise<DocumentData[] | null> {
    return databaseService.query(
      'chats',
      [{ field: 'user_id', operator: '==', value: userId }, 
       { field: 'is_deleted', operator: '==', value: false }],
      'created_at', 'asc'
    );
  },

  // hard delete
  async clearChatHistory(userId: string): Promise<void> {
    return databaseService.deleteAll('chats', [
      { field: 'user_id', operator: '==', value: userId }
    ]);
  }
};
