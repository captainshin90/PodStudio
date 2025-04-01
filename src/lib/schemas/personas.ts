// Persona schema version 0.2.0
export type PersonaType = 'resident' | 'student' | 'official' | 'lobbyst' | 'politician';

export interface Persona {
  id: string; // Firestore Document ID (needed for Firestore)
  persona_id: string; // Persona ID
  persona_name: string; // Persona Name
  persona_type: PersonaType; // Persona Type
  persona_description?: string; // Persona Description
  persona_image?: string; // Persona Image
  created_at: Date; // Created Date and Time - updated by the database service 
  updated_at: Date; // Updated Date and Time - updated by the database service 
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted - updated by the database service
}

// Helper function to convert Firestore data to Persona type
export function convertToPersona(data: any): Persona {
  return {
    id: data.id,
    persona_id: data.persona_id = crypto.randomUUID(),
    persona_name: data.persona_name,
    persona_type: data.persona_type,
    persona_description: data.persona_description,
    persona_image: data.persona_image,
    is_active: data.is_active = true,
    created_at: data.created_at?.toDate(), // updated by the database service
    updated_at: data.updated_at?.toDate(), // updated by the database service
    is_deleted: data.is_deleted = false // updated by the database service
  };
}