export interface Subscription {
  id: string; // Firestore Document ID (needed for Firestore)
  subscription_id: string; // Subscription ID
  subscription_type: string; // Subscription Type
  subscription_name: string; // Subscription Name
  subscription_desc: string; // Subscription Description
  subscription_price: number; // Subscription Price
  subscription_period: string; // monthly, yearly, etc.
  features?: string[]; // Features
  is_active: boolean; // Is Active
  // is_deleted: boolean; // Is Deleted - updated by the database service
  // created_at: Date; // Created Date and Time - updated by the database service
  // updated_at: Date; // Updated Date and Time - updated by the database service
}

// Helper function to convert Firestore data to Subscription type
export function convertToSubscription(data: any): Subscription {
  return {
    id: data.id,
    subscription_id: data.subscription_id = crypto.randomUUID(),
    subscription_type: data.subscription_type,
    subscription_name: data.subscription_name,
    subscription_desc: data.subscription_desc,
    subscription_price: data.subscription_price,
    subscription_period: data.subscription_period,
    is_active: data.is_active = true,
    // is_deleted: data.is_deleted = false, // updated by the database service
    // created_at: data.created_at?.toDate(), // updated by the database service
    // updated_at: data.updated_at?.toDate() // updated by the database service
  };
}