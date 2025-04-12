// Prompt schema version 0.2.5
export interface Model {
  id: string; // Unique ID, same as Firestore Document ID
  model_name: string; // Model Name
  model_type: string; // Model Type: LLM, TTS, STT, etc.
  model_provider: string; // Model Provider: OpenAI, Google, etc.
  model_desc: string; // Model Description
  model_url: string; // Model URL
//  model_params: string; // Model Parameters
//  model_params_desc: string; // Model Parameters Description
//  model_params_default: string; // Model Parameters Default
//  model_params_min: number; // Model Parameters Minimum
//  model_params_max: number; // Model Parameters Maximum
//  model_params_step: number; // Model Parameters Step
//  model_params_unit: string; // Model Parameters Unit
//  model_params_options: string[]; // Model Parameters Options
//  model_params_range: string; // Model Parameters Range
//  model_params_range_min: number; // Model Parameters Range Minimum
//  model_params_range_max: number; // Model Parameters Range Maximum
//  model_params_range_step: number; // Model Parameters Range Step
//  model_params_range_unit: string; // Model Parameters Range Unit
//  model_params_range_options: string[]; // Model Parameters Range Options
//  model_params_range_range: string; // Model Parameters Range Range
  top_k: number;
  top_p: number;
  temperature: number;
  max_tokens: number;
  repetition_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop_sequences: string[];
  voice_question: string;
  voice_answer: string;
  voice_model: string;
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
}


// Helper function to convert Firestore data to Prompt type
export function convertToModel(data: any): Model {
  return {
    id: data.id,
    model_name: data.model_name,
    model_desc: data.model_desc,
    model_type: data.model_type,
    model_provider: data.model_provider,
    model_url: data.model_url,
//    model_params: data.model_params,
//    model_params_desc: data.model_params_desc,
//    model_params_default: data.model_params_default,
//    model_params_min: data.model_params_min,
//    model_params_max: data.model_params_max,
//    model_params_step: data.model_params_step,
//    model_params_unit: data.model_params_unit,
//    model_params_options: data.model_params_options,
//    model_params_range: data.model_params_range,
//    model_params_range_min: data.model_params_range_min,
//    model_params_range_max: data.model_params_range_max,
//    model_params_range_step: data.model_params_range_step,
//    model_params_range_unit: data.model_params_range_unit,
//    model_params_range_options: data.model_params_range_options,
//    model_params_range_range: data.model_params_range_range,
    top_k: data.top_k,
    top_p: data.top_p,
    temperature: data.temperature,
    max_tokens: data.max_tokens,
    repetition_penalty: data.repetition_penalty,
    frequency_penalty: data.frequency_penalty,
    presence_penalty: data.presence_penalty,
    stop_sequences: data.stop_sequences,
    voice_question: data.voice_question,
    voice_answer: data.voice_answer,
    voice_model: data.voice_model,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false,
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service
  };
}

/* ---------------------------------------------------

These parameters are used to control the behavior of language models (LLMs) and text-to-speech (TTS) models in your application.
Here's what each parameter does:

Temperature (0.0 to 1.0): Controls the randomness/creativity of the model's output
Lower values (closer to 0) make the output more deterministic and focused
Higher values (closer to 1) make the output more diverse and creative
In your code, it's set to 0.7 by default, which provides a good balance

Top-k: Limits the model to consider only the top k most likely next tokens
Helps prevent the model from generating nonsensical text
Lower values make the output more focused, higher values allow more variety

Top-p (also called nucleus sampling): Similar to top-k but uses cumulative probability
Only considers tokens whose cumulative probability exceeds p
Helps maintain coherence while allowing some creativity

Max_tokens: Sets the maximum length of the generated text
In your code, it's set to 1000 by default
Prevents the model from generating excessively long responses

Repetition_penalty: Discourages the model from repeating the same words or phrases
Higher values make the model less likely to repeat itself
Useful for generating more diverse content

Frequency_penalty: Reduces the likelihood of the model using the same words repeatedly
Higher values encourage the model to use a more diverse vocabulary

Presence_penalty: Encourages the model to talk about new topics
Higher values make the model more likely to introduce new concepts
Helps prevent the model from getting stuck on one topic

Stop_sequences: Specifies strings that, when encountered, will cause the model to stop generating
Useful for controlling the format or length of responses

------------------------------------------------------*/