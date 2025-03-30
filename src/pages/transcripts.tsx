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

export default function TranscriptsPage() {
  const [showNewTranscript, setShowNewTranscript] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-2xl font-bold mb-6">Transcripts Management</h1>
      
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
                onSave={async (newTranscript) => {
                  try {
                    const transcriptId = await transcriptsService.createTranscript(newTranscript);
                    if (transcriptId) {
                      toast({
                        title: "Success",
                        description: "Transcript created successfully",
                      });
                      setShowNewTranscript(false);
                    }
                  } catch (error) {
                    console.error("Error creating transcript:", error);
                    toast({
                      title: "Error",
                      description: "Failed to create transcript",
                      variant: "destructive",
                    });
                  }
                }}
                onCancel={() => setShowNewTranscript(false)}
                isNew={true}
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
              "{selectedTranscript?.transcript_id}".
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