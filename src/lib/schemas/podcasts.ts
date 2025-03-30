export type PodcastType = 'summary' | 'audio_podcast' | 'video_podcast';
export type PodcastFormat = 'html' | 'mp3' | 'mp4';

export interface Podcast {
  id: string; // Firestore Document ID (needed for Firestore)
  podcast_id: string; // Podcast ID
  podcast_title: string; // Podcast Title
  podcast_slug: string; // Podcast Slug For when you need to refer to your podcast in a url.
  podcast_hosts: string[]; // Podcast Hosts
  podcast_image: string; // The image should be either jpg or png. Preferably 3000 x 3000, minimum 1400 x 1400 pixels.
  podcast_desc: string; // Podcast Description
  podcast_type: PodcastType; // Podcast Type
  podcast_format: PodcastFormat; // Podcast Format
  podcast_language: string; // Podcast Language
  followed_by_users?: string[]; // Followed By Users
  topic_tags: string[]; // Topic Tags (names not IDs)
  subscription_type: 'free' | 'premium'; // Subscription Type
  is_active: boolean; // Is Active
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
  is_deleted: boolean; // Is Deleted - updated by the database service
}


// Helper function to convert Firestore data to Podcast type
export function convertToPodcast(data: any): Podcast {
  return {
    id: data.id,
    podcast_id: data.podcast_id = crypto.randomUUID(),
    podcast_title: data.podcast_title,
    podcast_slug: data.podcast_slug,
    podcast_hosts: data.podcast_hosts,
    podcast_image: data.podcast_image,
    podcast_desc: data.podcast_desc,
    podcast_type: data.podcast_type,
    podcast_format: data.podcast_format,
    podcast_language: data.podcast_language,
    topic_tags: data.topic_tags,
    subscription_type: data.subscription_type,
    followed_by_users: data.followed_by_users,
    is_active: data.is_active = true,
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service
    is_deleted: data.is_deleted = false // updated by the database service
  };
}