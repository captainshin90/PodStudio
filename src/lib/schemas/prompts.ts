import { LLMModel, TTSModel } from "@/config/podcast-config";

// Prompt schema version 0.2.5
export interface Prompt {
  id: string; // Firestore Document ID (needed for Firestore)
  prompt_id: string; // Prompt ID
  prompt_name: string; // Prompt Name
  prompt_desc: string; // Prompt Description
  created_by: string; // Created By user ID
  target_persona: string; // Target Persona
  prompt_text: string; // Prompt Instructions
  prompt_audio?: string; // Prompt Audio
  is_long_form: boolean;
  word_count: number;
  creativity: number;
  roles_person1: string;
  roles_person2: string;
  conversation_style: string[]; 
  dialogue_structure: string[];
  engagement_techniques: string[];
  system_instructions?: string;
  llm_model: LLMModel;
  tts_model: TTSModel;
  voice_question: string;
  voice_answer: string;
  voice_model: string;
  ending_message: string;
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
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
    is_long_form: data.is_long_form,
    word_count: data.word_count,
    creativity: data.creativity,
    roles_person1: data.roles_person1,
    roles_person2: data.roles_person2,
    conversation_style: data.conversation_style,
    dialogue_structure: data.dialogue_structure,
    engagement_techniques: data.engagement_techniques,
    system_instructions: data.system_instructions,
    llm_model: data.llm_model,
    tts_model: data.tts_model,
    voice_question: data.voice_question,
    voice_answer: data.voice_answer,
    voice_model: data.voice_model,
    ending_message: data.ending_message,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false,
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service
  };
}
