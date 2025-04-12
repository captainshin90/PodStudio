// import yaml from 'js-yaml';
// import { readFileSync } from 'fs';
// import { join } from 'path';
// yaml file is not being used as it's not compatible with Vite.
// import { config } from '@/config/config';

export type ExtractTool = "default" | "podcastfy";
export type ConversationStyle = "Engaging" | "Fast-paced" | "Enthusiastic" | "Educational" | "Casual" | "Professional" | "Friendly";
export type DialogueStructure = "Topic Introduction" | "Summary" | "Discussions" | "Q&A" | "Farewell";
export type EngagementTechnique = "Questions" | "Testimonials" | "Quotes" | "Anecdotes" | "Analogies" | "Humor";

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
export const conversationStyles: ConversationStyle[] = [
  "Analytical",
  "Argumentative",
  "Informative",
  "Humorous",
  "Casual",
  "Formal",
  "Inspirational",
  "Debate-style",
  "Interview-style",
  "Storytelling",
  "Satirical",
  "Educational",
  "Philosophical",
  "Speculative",
  "Motivational",
  "Fun",
  "Technical",
  "Light-hearted",
  "Serious",
  "Investigative",
  "Debunking",
  "Didactic",
  "Thought-provoking",
  "Controversial",
  "Sarcastic",
  "Emotional",
  "Exploratory",
  "Fast-paced",
  "Slow-paced",
  "Introspective",
];

# Dialogue Structures
export const dialogueStructures: DialogueStructure[] = [
  "Topic Introduction",
  "Opening Monologue",
  "Guest Introduction",
  "Icebreakers",
  "Historical Context",
  "Defining Terms",
  "Problem Statement",
  "Overview of the Issue",
  "Deep Dive into Subtopics",
  "Pro Arguments",
  "Con Arguments",
  "Cross-examination",
  "Expert Interviews",
  "Case Studies",
  "Myth Busting",
  "Q&A Session",
  "Rapid-fire Questions",
  "Summary of Key Points",
  "Recap",
  "Key Takeaways",
  "Actionable Tips",
  "Call to Action",
  "Future Outlook",
  "Closing Remarks",
  "Resource Recommendations",
  "Trending Topics",
  "Closing Inspirational Quote",
  "Final Reflections",
];

# Engagement Techniques
export const engagementTechniques: EngagementTechnique[] = [
  "Rhetorical Questions",
  "Anecdotes",
  "Analogies",
  "Humor",
  "Metaphors",
  "Storytelling",
  "Quizzes",
  "Personal Testimonials",
  "Quotes",
  "Jokes",
  "Emotional Appeals",
  "Provocative Statements",
  "Sarcasm",
  "Pop Culture References",
  "Thought Experiments",
  "Puzzles and Riddles",
  "Role-playing",
  "Debates",
  "Catchphrases",
  "Statistics and Facts",
  "Open-ended Questions",
  "Challenges to Assumptions",
  "Evoking Curiosity",
];


# Podcast Participant Roles
export const participant_roles = [
  "Main Summarizer",
  "Questioner/Clarifier",
  "Optimist",
  "Skeptic",
  "Specialist",
  "Thesis Presenter",
  "Counterargument Provider",
  "Professor",
  "Student",
  "Moderator",
  "Host",
  "Co-host",
  "Expert Guest",
  "Novice",
  "Devil's Advocate",
  "Analyst",
  "Storyteller",
  "Fact-checker",
  "Comedian",
  "Interviewer",
  "Interviewee",
  "Historian",
  "Visionary",
  "Strategist",
  "Critic",
  "Enthusiast",
  "Mediator",
  "Commentator",
  "Researcher",
  "Reporter",
  "Advocate",
  "Debater",
  "Explorer",
];

*/

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