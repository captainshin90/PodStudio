
// Prompt schema version 0.2.6
export interface Prompt {
  id: string; // Unique ID, same as Firestore Document ID
  prompt_name: string; // Prompt Name
  prompt_desc: string; // Prompt Description
  created_by: string; // Created By user ID
  target_persona: string; // Target Persona
  prompt_text: string; // Prompt Instructions
  prompt_audio?: string; // Prompt Audio
  is_long_form: boolean;
  word_count: number;     // similar to max_tokens, use as override for model max_tokens?
  creativity: number;     // same as temperature, use as override for model temperature?
  roles_person1: string;
  roles_person2: string;
  conversation_style: string[]; 
  dialogue_structure: string[];
  engagement_techniques: string[];
  system_instructions?: string;
  llm_model_id?: string;  // default llm model id
  tts_model_id?: string;  // default tts model id
  ending_message: string; // Question: does this need to be here?
  
  // Moved to the model schema
  // max_tokens: number;     // moved to the model schema
  // llm_model: LLMModel;  // TODO: change to model_provider
  // llm_model_name: string; // TODO: specific model version
  // tts_model: TTSModel;  
  // tts_model_name: string;    // QUESTION: is this needed? How different from voice_model?
  // voice_question: string;
  // voice_answer: string;
  // voice_model: string;

  // Chain of Thought prompting features
  use_chain_of_thought: boolean; // Whether to use Chain of Thought prompting
  cot_style: string; // Style of Chain of Thought (e.g., "Step-by-step", "Tree of Thoughts", "Self-consistency")
  cot_instructions: string; // Specific instructions for Chain of Thought
  cot_examples: string[]; // Example Chain of Thought reasoning
  cot_verification: boolean; // Whether to verify the Chain of Thought reasoning
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
}


// Helper function to convert Firestore data to Prompt type
export function convertToPrompt(data: any): Prompt {
  return {
    id: data.id,
    prompt_name: data.prompt_name,
    prompt_desc: data.prompt_desc,
    created_by: data.created_by,
    target_persona: data.target_persona,
    prompt_text: data.prompt_text,
    prompt_audio: data.prompt_audio,
    is_long_form: data.is_long_form,
    word_count: data.word_count,
    creativity: data.creativity,
    // max_tokens: data.max_tokens,
    roles_person1: data.roles_person1,
    roles_person2: data.roles_person2,
    conversation_style: data.conversation_style,
    dialogue_structure: data.dialogue_structure,
    engagement_techniques: data.engagement_techniques,
    system_instructions: data.system_instructions,
    llm_model_id: data.llm_model_id,
    tts_model_id: data.tts_model_id,
    ending_message: data.ending_message,
    // Chain of Thought prompting features
    use_chain_of_thought: data.use_chain_of_thought || false,
    cot_style: data.cot_style || "Step-by-step",
    cot_instructions: data.cot_instructions || "",
    cot_examples: data.cot_examples || [],
    cot_verification: data.cot_verification || false,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false,
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service
  };
}
