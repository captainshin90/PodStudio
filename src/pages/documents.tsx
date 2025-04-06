import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import DocumentBrowser from "@/components/documents/DocumentBrowser";
import DocumentDetails from "@/components/documents/DocumentDetails";
import { useState } from "react";
import { Document } from "@/lib/schemas/documents";
import { documentsService } from "@/lib/services/database-service";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

///////////////////////////////////////////////////////////////////////////////
// Documents page
///////////////////////////////////////////////////////////////////////////////
export default function DocumentsPage() {
  const [showNewDocUpload, setShowNewDocUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Add debug handler for document selection
//  const handleDocumentSelect = (doc: Document) => {
//    console.log("Document selected in DocumentsPage:", doc);
//    setSelectedDocument(doc);
//  };

  // Handle save document
  const handleSave = async (updatedDoc: Document) => {
    try {
      await documentsService.updateDocument(updatedDoc.id, updatedDoc);
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
      setSelectedDocument(updatedDoc);
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  };

  // Handle create document
  const handleCreate = async (newDocument: Document) => {
    try {
      await documentsService.createDocument(newDocument.id, newDocument);
      toast({ 
        title: "Success",
        description: "Document created successfully",
      });
      setShowNewDocUpload(false);
    } catch (error) { 
      console.error("Error creating document:", error); 
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      });
    }
  };  

  // Handle delete document
  const handleDelete = async () => {
    if (!selectedDocument?.id) return;
    
    try {
      await documentsService.deleteDocument(selectedDocument.id);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      setSelectedDocument(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  // Render the page
  return (
    <div className="container mx-auto py-0 px-0" >
      <h1 className="text-2xl font-bold text-muted-foreground mb-6">Document Management</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Document List */}
        <div className="col-span-4 border rounded-lg p-4">
          <DocumentBrowser 
            selectedDocument={selectedDocument}
            onSelectDocument={setSelectedDocument}
            disabled={showNewDocUpload}
          />
        </div>

        {/* Right Panel - Document Details */}
        <div className="col-span-8 border rounded-lg p-4">
          {showNewDocUpload ? (
            <div className="space-y-4">
              <DocumentDetails
                document={null}
                onSave={handleCreate}
                onCancel={() => setShowNewDocUpload(false)}
                isNew={true}
              />
            </div>
          ) : (
            <>
              {!selectedDocument && !showNewDocUpload && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowNewDocUpload(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              )}
              <DocumentDetails
                document={selectedDocument}
                onSave={handleSave}
                onCancel={() => setSelectedDocument(null)}
                onDelete={() => setShowDeleteDialog(true)}
                isNew={false}
              />
            </>
          )}
        </div> 
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the document
              "{selectedDocument?.doc_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 