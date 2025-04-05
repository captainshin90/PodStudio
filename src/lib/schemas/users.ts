// User schema version 0.2.5
export interface User {
  id: string; // Firestore Document ID (needed for Firestore)
  user_id: string; // User ID
  login_id: string; // Login ID
  password?: string; // Not stored in Firestore, only used for registration
  first_name: string; // First Name
  last_name: string; // Last Name
  email1: string; // Primary Email
  email2?: string; // Secondary Email
  phone?: string; // Phone Number
  avatar?: string; // Avatar URL
  addresses?: Address[]; // Array of Addresses
  preferences?: UserPreferences; // User Preferences
  personas?: string[];           // Array of persona_ids
  following_topics?: string[];   // Array of topic_ids
  following_podcasts?: string[]  // Array of podcast_ids
  following_users?: string[];    // Array of user_ids
  followed_by_users?: string[];  // Array of user_ids
  subscription_type?: string;    // free, basic, premium, etc.
  subscription_startdate?: Date; // Subscription Start Date
  subscription_enddate?: Date;   // Subscription End Date
  last_payment_date?: Date;      // Last Payment Date
  next_payment_date?: Date;      // Next Payment Date
  payment_method?: string;       // Payment Method
  card_name?: string;            // Card Name
  card_number?: string;          // Should be encrypted or tokenized in production
  card_expire?: string;
  card_cvv?: string;             // Should not be stored in production
  card_city?: string;
  is_active: boolean;            // Is Active
  created_at: Date;             // updated by the database service
  updated_at: Date;             // updated by the database service
  is_deleted: boolean;          // Is Deleted - updated by the database service
}

export interface Address {
  address_type: string; // home, work, etc.
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_primary: boolean;
}

export interface UserPreferences {
  theme: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  language: string;
  timezone: string;
  content_filters?: {
    explicit_content: boolean;
    content_categories?: string[];
  };
}

// Helper function to convert Firestore data to User type
export function convertToUser(data: any): User {
  return {
    id: data.id,
    user_id: data.user_id = crypto.randomUUID(),
    login_id: data.login_id,
    first_name: data.first_name,
    last_name: data.last_name,
    email1: data.email1,
    email2: data.email2,
    phone: data.phone,
    avatar: data.avatar,
    addresses: data.addresses,
    preferences: data.preferences,
    personas: data.personas,
    following_topics: data.following_topics,
    following_podcasts: data.following_podcasts,
    following_users: data.following_users,
    followed_by_users: data.followed_by_users,
    subscription_type: data.subscription_type,
    subscription_startdate: data.subscription_startdate?.toDate(),
    subscription_enddate: data.subscription_enddate?.toDate(),
    last_payment_date: data.last_payment_date?.toDate(),
    next_payment_date: data.next_payment_date?.toDate(),
    payment_method: data.payment_method,
    card_name: data.card_name,
    card_number: data.card_number,
    card_expire: data.card_expire,
    card_cvv: data.card_cvv,
    card_city: data.card_city,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false, // updated by the database service
    created_at: data.created_at?.toDate(),    // updated by the database service
    updated_at: data.updated_at?.toDate(),    // updated by the database service
  };
}