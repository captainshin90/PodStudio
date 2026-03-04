export type DocumentSourceFormat = 'txt' | 'pdf' | 'docx' | 'mp3';
export type DocumentType = 'article' | 'podcast' | 'transcript' | 'question' | 'answer' | 'summary' | 'chat' | 'document';

// Document schema version 0.3.1
export interface Document {
  id: string; // Unique ID, same as Firestore Document ID
  doc_name: string; // Document Name
  doc_desc: string; // Document Description
  doc_type: DocumentType; // Document Type
  event_date: Date; // Event Date associated with the document
  event_location: string; // Event Location associated with the document
  event_organizer: string; // Event Organizer associated with the document
  topic_tags: string[]; // Topic Tags
  doc_source_urls: string[]; // Document Source URLs
  doc_summary: string; // Document Summary  
  doc_extracted_text: string; // Document Extracted Text
  extract_tool: string; // Extract Tool - don't need
  doc_source_format: DocumentSourceFormat; // Document Source Format
  is_active: boolean; // Is Active
  is_deleted: boolean; // Is Deleted
  created_at: Date; // Created Date and Time
  updated_at: Date; // Updated Date and Time
}


// Helper function to convert Firestore data to Document type
export function convertToDocument(data: any): Document {
  return {
    id: data.id,
    doc_name: data.doc_name,
    doc_desc: data.doc_desc,
    doc_type: data.doc_type,
    event_date: data.event_date,
    event_location: data.event_location,
    event_organizer: data.event_organizer,
    topic_tags: data.topic_tags,
    doc_source_urls: data.doc_source_urls,
    doc_summary: data.doc_summary,
    doc_extracted_text: data.doc_extracted_text,
    extract_tool: data.extract_tool,
    doc_source_format: data.doc_source_format,
    is_active: data.is_active = true,
    is_deleted: data.is_deleted = false,
    created_at: data.created_at?.toDate(),
    updated_at: data.updated_at?.toDate(),
  };
}
