// Persona schema version 0.3.0
export type PersonaType = 'resident' | 'student' | 'official' | 'lobbyst' | 'politician';

export interface Persona {
  id: string; // Unique ID, same as Firestore Document ID
  persona_name: string; // Persona Name
  persona_type: PersonaType; // Persona Type
  persona_description?: string; // Persona Description
  persona_image?: string; // Persona Image
  persona_gender?: string; // Persona Gender
  persona_age_range?: string; // Persona Age Range
  persona_location?: string; // Persona Location
  persona_occupation?: string; // Persona Occupation
  persona_interests?: string[]; // Persona Interests
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
  created_at: Date; // Created Date and Time - updated by the database service 
  updated_at: Date; // Updated Date and Time - updated by the database service 
}

// Helper function to convert Firestore data to Persona type
export function convertToPersona(data: any): Persona {
  return {
    id: data.id,
    persona_name: data.persona_name,
    persona_type: data.persona_type,
    persona_description: data.persona_description,
    persona_image: data.persona_image,
    persona_gender: data.persona_gender,
    persona_age_range: data.persona_age_range,
    persona_location: data.persona_location,
    persona_occupation: data.persona_occupation,
    persona_interests: data.persona_interests,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false, // updated by the database service
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service
  };
}