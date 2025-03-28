import { Podcast } from "@/lib/schemas/podcasts";

export interface Episode {
  id: string; // Firestore Document ID (needed for Firestore)
  episode_id: string; // Episode ID
  podcast_id: string; // Podcast ID
  transcript_id: string; // Transcript ID
  episode_title: string; // Episode Title
  episode_desc: string; // Episode Description
  topic_tags: string[]; // Topic Tags
  views: number; // Views
  likes: number; // Likes
  dislikes: number; // Dislikes
  publish_datetime: Date; // Publish Date and Time
  expire_datetime?: Date; // Expire Date and Time
  content_duration: number; // in seconds
  content_url: string; // Content URL
  content_image: string; // Content Image
  is_active: boolean; // Is Active
  // created_at: Date; // Created Date and Time - updated by the database service
  // updated_at: Date; // Updated Date and Time - updated by the database service
  // is_deleted: boolean; // Is Deleted - updated by the database service
}

// why need a separate PlayerEpisode type for the podcast player?
// because the podcast player needs to know about the podcast id and the transcript id
// the episode type is used for the podcast list and the topic panel
// the player episode type is used for the podcast player
export interface PlayerEpisode {
  id: string;
  title: string;
  image: string;
  audioUrl: string;
  duration: number;
  podcastId: string;
  transcriptId: string;
  description: string;
  topicTags: string[];
}

// Helper function to convert Firestore data to Episode type
export function convertToEpisode(data: any): Episode {
  return {
    id: data.id,
    episode_id: data.episode_id = crypto.randomUUID(),
    podcast_id: data.podcast_id,
    transcript_id: data.transcript_id,
    episode_title: data.episode_title,
    episode_desc: data.episode_desc,
    topic_tags: data.topic_tags,
    views: data.views,
    likes: data.likes,
    dislikes: data.dislikes,
    publish_datetime: data.publish_datetime?.toDate(),
    expire_datetime: data.expire_datetime?.toDate(),
    content_duration: data.content_duration,
    content_url: data.content_url,
    content_image: data.content_image,
    is_active: data.is_active = true,
    // created_at: data.created_at?.toDate(), // updated by the database service
    // updated_at: data.updated_at?.toDate(), // updated by the database service
    // is_deleted: data.is_deleted = false // updated by the database service
  };
}

// Helper function to convert Episode to PlayerEpisode
export function convertToPlayerEpisode(podcast: Podcast, episode: Episode): PlayerEpisode {
  return {
    id: episode.episode_id,
    title: episode.episode_title,
    image: episode.content_image || podcast.podcast_image,
    audioUrl: episode.content_url,
    duration: episode.content_duration,
    podcastId: episode.podcast_id,
    transcriptId: episode.transcript_id,
    description: episode.episode_desc,
    topicTags: episode.topic_tags
  };
}