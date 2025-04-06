import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TranscriptBrowser from "@/components/transcripts/TranscriptBrowser";
import TranscriptDetails from "@/components/transcripts/TranscriptDetails";
import { useState } from "react";
import { Transcript } from "@/lib/schemas/transcripts";
import { transcriptsService } from "@/lib/services/database-service";
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
// Transcripts page
///////////////////////////////////////////////////////////////////////////////
export default function TranscriptsPage() {
  const [showNewTranscript, setShowNewTranscript] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Handle save transcript
  const handleSave = async (updatedTranscript: Transcript) => {
    try {
      await transcriptsService.updateTranscript(updatedTranscript.id, updatedTranscript);
      toast({
        title: "Success",
        description: "Transcript updated successfully",
      });
      setSelectedTranscript(updatedTranscript);
    } catch (error) {
      console.error("Error updating transcript:", error);
      toast({
        title: "Error",
        description: "Failed to update transcript",
        variant: "destructive",
      });
    }
  };

  // Handle create transcript
  const handleCreate = async (newTranscript: Transcript) => {
    try {
      await transcriptsService.createTranscript(newTranscript.id, newTranscript);
      toast({
        title: "Success", 
        description: "Transcript created successfully",
      });
      setShowNewTranscript(false);
    } catch (error) {
      console.error("Error creating transcript:", error); 
      toast({
        title: "Error",
        description: "Failed to create transcript",
        variant: "destructive",
      });
    }
  };

  // Handle delete transcript
  const handleDelete = async () => {
    if (!selectedTranscript?.id) return;
    
    try {
      await transcriptsService.deleteTranscript(selectedTranscript.id);
      toast({
        title: "Success",
        description: "Transcript deleted successfully",
      });
      setSelectedTranscript(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting transcript:", error);
      toast({
        title: "Error",
        description: "Failed to delete transcript",
        variant: "destructive",
      });
    }
  };

  // Render the page
  return (
    <div className="container mx-auto py-0 px-0">
      <h1 className="text-2xl font-bold text-muted-foreground mb-6">Transcripts Management</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Transcript List */}
        <div className="col-span-4 border rounded-lg p-4">
          <TranscriptBrowser 
            selectedTranscript={selectedTranscript}
            onSelectTranscript={setSelectedTranscript}
            disabled={showNewTranscript}
          />
        </div>

        {/* Right Panel - Transcript Details or New Transcript */}
        <div className="col-span-8 border rounded-lg p-4">
          {showNewTranscript ? (
            <div className="space-y-4">
              <TranscriptDetails
                transcript={null}
                onSave={handleCreate}
                onCancel={() => setShowNewTranscript(false)}
                isNew={true}
                isReadOnly={false}
              />
            </div>
          ) : (
            <>
              {!selectedTranscript && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowNewTranscript(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Transcript
                  </Button>
                </div>
              )}
              <TranscriptDetails
                transcript={selectedTranscript}
                onSave={handleSave}
                onCancel={() => setSelectedTranscript(null)}
                onDelete={() => setShowDeleteDialog(true)}
                isNew={false}
                isReadOnly={false}
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
              This action will delete the transcript
              "{selectedTranscript?.id}".
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