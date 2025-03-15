// import yaml from 'js-yaml';
// import { readFileSync } from 'fs';
// import { join } from 'path';
// yaml file is not being used as it's not compatible with Vite.

export type TTSModel = "gemini" | "geminimulti" | "edge" | "openai" | "elevenlabs" | "hume" | "playht";
export type ConversationStyle = "Engaging" | "Fast-paced" | "Enthusiastic" | "Educational" | "Casual" | "Professional" | "Friendly";
export type DialogueStructure = "Topic Introduction" | "Summary" | "Discussions" | "Q&A" | "Farewell";
export type EngagementTechnique = "Questions" | "Testimonials" | "Quotes" | "Anecdotes" | "Analogies" | "Humor";

export interface VoiceConfig {
  question: string;
  answer: string;
  model: string;
}

export const ttsVoiceDefaults: Record<TTSModel, VoiceConfig> = {
  elevenlabs: {
    question: "Chris",
    answer: "Jessica",
    model: "eleven_multilingual_v2"
  },
  openai: {
    question: "echo",
    answer: "shimmer",
    model: "tts-1-hd"
  },
  edge: {
    question: "en-US-JennyNeural",
    answer: "en-US-EricNeural",
    model: ""
  },
  gemini: {
    question: "en-US-Standard-A",
    answer: "en-US-Standard-C",
    model: ""
  },
  geminimulti: {
    question: "R",
    answer: "S",
    model: "en-US-Studio-MultiSpeaker"
  },
  hume: {
    question: "default",
    answer: "default",
    model: "default"
  },
  playht: {
    question: "default",
    answer: "default",
    model: "default"
  }
};

export const conversationStyles: ConversationStyle[] = [
  "Engaging",
  "Fast-paced",
  "Enthusiastic",
  "Educational",
  "Casual",
  "Professional",
  "Friendly"
];

export const dialogueStructures: DialogueStructure[] = [
  "Topic Introduction",
  "Summary",
  "Discussions",
  "Q&A",
  "Farewell"
];

export const engagementTechniques: EngagementTechnique[] = [
  "Questions",
  "Testimonials",
  "Quotes",
  "Anecdotes",
  "Analogies",
  "Humor"
];

/*
interface PodcastConfig {
  ttsVoiceDefaults: Record<TTSModel, VoiceConfig>;
  conversationStyles: ConversationStyle[];
  dialogueStructures: DialogueStructure[];
  engagementTechniques: EngagementTechnique[];
  ttsModels: TTSModel[];
}
*/

// yaml file is not being used as it's not compatible with Vite.
// const configPath = join(__dirname, 'podcast-config.yaml');
// const configFile = readFileSync(configPath, 'utf8');
// export const config = yaml.load(configFile) as PodcastConfig;

// export const {
//   ttsVoiceDefaults,
//   conversationStyles,
//   dialogueStructures,
//   engagementTechniques,
//   ttsModels
// } = config; 