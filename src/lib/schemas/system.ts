// System datatypes schema version 0.3.0
export interface SystemDatatypes {
  id: string; // "datatypes" Unique ID, same as Firestore Document ID
  conversation_styles: string[]; 
  dialogue_structures: string[];
  engagement_techniques: string[];
  output_types: string[];     // output types: podcast, report, news article, blog, essay, voter guide, rofile, flyer, etc.
  roles_person1: string[];
  roles_person2: string[];
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
}

// System voices schema version 0.2.7
export interface SystemVoices {
    id: string; // "voices" Unique ID, same as Firestore Document ID
    gemini_voices: string[]; 
    gemini_pro_voices: string[];
    elevenlabs_voices: string[];
    playai_voices: string[];
    anthropic_voices: string[];
    deepseek_voices: string[];
    openai_voices: string[];
    groq_voices: string[];
    groq_pro_voices: string[];
    hume_voices: string[];
    is_active: boolean; // Is Active
    is_deleted: boolean; // Is Deleted - updated by the database service
    created_at: Date; // Created Date and Time - updated by the database service
    updated_at: Date; // Updated Date and Time - updated by the database service
  }
  

