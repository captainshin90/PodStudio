// import { Podcast } from "@/lib/schemas/podcasts";

  // Episode schema version 0.2.0
export interface Episode {
  id: string; // Unique ID, same as Firestore Document ID
  // episode_id: string; // Episode ID
  podcast_id: string; // Podcast ID
  transcript_id: string; // Transcript ID
  prompt_id: string; // Prompt ID
  model_id: string; // Model ID
  episode_title: string; // Episode Title
  episode_slug: string; // Episode Slug For when you need to refer to your episode in a url.
  episode_desc: string; // Episode Description
  episode_summary: string; // Episode Summary - string containing one or more descriptive sentences summarizing your episode for potential listeners. You can specify up to 4000 characters.
  episode_number: number; // Episode Number
  topic_tags: string[]; // Topic Tags
  views: number; // Views
  likes: number; // Likes
  dislikes: number; // Dislikes
  created_by: string; // Created By
  publish_date: Date; // To Publish Date and Time
  expire_date?: Date; // To Expire Date and Time
  content_duration: number; // Episode Duration in seconds
  content_transcript: string; // Episode Transcript - this is the transcript of the episode copied from the transcript service.
  content_url: string; // Content URL - this is the url of the audio or video file.
  content_image: string; // Content Image - this is the image of the episode.
  linklist: Array<{
    link_title: string;
    link_url: string;
    link_excerpt: string;
  }>; // Linklist - this is a list of links to other websites or resources related to the episode. A more structured way to add links for show notes. Will be compiled at the end of the episode content field in a podcast RSS feed'
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
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
    // episode_id: data.episode_id = crypto.randomUUID(),
    podcast_id: data.podcast_id,
    transcript_id: data.transcript_id,
    prompt_id: data.prompt_id,
    model_id: data.model_id,
    created_by: data.created_by,
    episode_title: data.episode_title,
    episode_slug: data.episode_slug,
    episode_desc: data.episode_desc,
    episode_number: data.episode_number,
    publish_date: data.publish_date?.toDate(),
    expire_date: data.expire_date?.toDate(),
    content_duration: data.content_duration,
    content_url: data.content_url,
    content_image: data.content_image,
    episode_summary: data.episode_summary,
    content_transcript: data.content_transcript,
    topic_tags: data.topic_tags,
    views: data.views,
    likes: data.likes,
    dislikes: data.dislikes,
    linklist: data.linklist,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false, // updated by the database service
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate() // updated by the database service
  };
}


/*
// Helper function to convert Episode to PlayerEpisode
// This function is not used in the project yet
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
*/