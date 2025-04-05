// Question schema version 0.2.5
export interface Question {
  id: string; // Firestore Document ID (needed for Firestore)
  question_id: string; // Question ID
  podcast_id: string; // Podcast ID
  question_text: string; // Question Text
  question_audio?: string; // Question Audio
  clicks: number; // Clicks
  user_id: string; // User ID
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
}

export type SuggestedQuestion = {
  id: string;
  text: string;
};

// Helper function to convert Firestore data to Question type
export function convertToQuestion(data: any): Question {
  return {
    id: data.id,
    question_id: data.question_id = crypto.randomUUID(),
    podcast_id: data.podcast_id,
    question_text: data.question_text,
    question_audio: data.question_audio,
    clicks: data.clicks,
    user_id: data.user_id,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false, // updated by the database service
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service  
  };
}