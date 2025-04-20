// Transcript schema version 0.2.5
export type TranscriptType = 'interview' | 'meeting' | 'article' | 'petition';

export interface Transcript {
  id: string; // Unique ID, same as Firestore Document ID
  doc_id: string; // Document ID
  prompt_id: string; // Prompt ID
  model_id: string; // Model ID
  transcript_title: string; // Transcript Title
  transcript_type: TranscriptType; // Transcript Type
  topic_tags: string[]; // Topic Tags should be IDs?
  // transcript_model: string; // Transcript Model
  // transcript_model_name: string; // Transcript Model Name
  transcript_text: string; // Transcript Text
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
}


// Helper function to convert Firestore data to Transcript type
export function convertToTranscript(data: any): Transcript {
  return {
    id: data.id,
    doc_id: data.doc_id || null,
    prompt_id: data.prompt_id || null,
    model_id: data.model_id || null,
    transcript_title: data.transcript_title = "add transcript title here",
    transcript_type: data.transcript_type = "interview",
    topic_tags: data.topic_tags || [],
    // transcript_model: data.transcript_model = "",
    // transcript_model_name: data.transcript_model_name = "",     
    transcript_text: data.transcript_text = "add transcript text here",
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false, // updated by the database service
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service
  };
}
