
// export type TopicType = 'place' | 'company' | 'school' | 'club' | 'person' | 'sport' | 'issue';
// or categories: 'place', 'company', 'school', 'club', 'person', 'sport', 'issue'?

// Topic schema version 0.2.5
export interface Topic {
  id: string; // Firestore Document ID (needed for Firestore)
  topic_id: string; // Topic ID
  topic_name: string; // Topic Name
  topic_image?: string; // Topic Image
//  topic_type: TopicType;
  topic_type: string; // Topic Type
  related_topic_tags?: string[]; // Related Topic Tags, should be names not IDs
  followed_by_users?: string[]; // Followed By Users
  is_private: boolean; // Is Private
  managed_by?: string[]; // Managed By
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service
  updated_at: Date; // Updated Date and Time - updated by the database service
}

// Helper function to convert Firestore data to Topic type
export function convertToTopic(data: any): Topic {
  return {
    id: data.id,
    topic_id: data.topic_id = crypto.randomUUID(),
    topic_name: data.topic_name,
    topic_image: data.topic_image,
    topic_type: data.topic_type,
    related_topic_tags: data.related_topic_tags,
    followed_by_users: data.followed_by_users,
    is_private: data.is_private,
    managed_by: data.managed_by,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false, // updated by the database service
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate() // updated by the database service
  };
}