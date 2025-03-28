export interface Prompt {
  id: string; // Firestore Document ID (needed for Firestore)
  prompt_id: string; // Prompt ID
  prompt_name: string; // Prompt Name
  prompt_desc: string; // Prompt Description
  created_by: string; // Created By user ID
  target_persona: string; // Target Persona
  prompt_text: string; // Prompt Text
  prompt_audio?: string; // Prompt Audio
  is_active: boolean; // Is Active
  // is_deleted: boolean; // Is Deleted - updated by the database service
  // created_at: Date; // Created Date and Time - updated by the database service
  // updated_at: Date; // Updated Date and Time - updated by the database service
  // modified_datetime?: Date; // Modified Date and Time
  // delete_datetime?: Date; // Delete Date and Time
}

// Helper function to convert Firestore data to Prompt type
export function convertToPrompt(data: any): Prompt {
  return {
    id: data.id,
    prompt_id: data.prompt_id = crypto.randomUUID(),
    prompt_name: data.prompt_name,
    prompt_desc: data.prompt_desc,
    created_by: data.created_by,
    target_persona: data.target_persona,
    prompt_text: data.prompt_text,
    prompt_audio: data.prompt_audio,
    is_active: data.is_active = true,
    // is_deleted: data.is_deleted = false,
    // created_at: data.created_at?.toDate(), // updated by the database service
    // updated_at: data.updated_at?.toDate(), // updated by the database service
    // modified_datetime: data.modified_datetime?.toDate(),
    // delete_datetime: data.delete_datetime?.toDate(),
  };
}