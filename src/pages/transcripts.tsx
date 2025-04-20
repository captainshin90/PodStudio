import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TranscriptBrowser from "@/components/transcripts/TranscriptBrowser";
import TranscriptDetails from "@/components/transcripts/TranscriptDetails";
import { useState, useEffect } from "react";
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
import { handleRegenerateTranscript } from "@/components/create/CreateTranscript";

///////////////////////////////////////////////////////////////////////////////
// Transcripts page
///////////////////////////////////////////////////////////////////////////////
export default function TranscriptsPage() {
  const [showNewTranscript, setShowNewTranscript] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Load the selected transcript from localStorage if available
  useEffect(() => {
    const loadSelectedTranscript = async () => {
      const storedTranscriptId = localStorage.getItem('selectedTranscriptId');
      
      if (storedTranscriptId) {
        try {
          const transcript = await transcriptsService.getTranscriptById(storedTranscriptId);
          if (transcript) {
            setSelectedTranscript(transcript as Transcript);
            // Clear the stored transcript ID after loading it
            localStorage.removeItem('selectedTranscriptId');
          }
        } catch (error) {
          console.error("Error loading selected transcript:", error);
          toast({
            title: "Error",
            description: "Failed to load selected transcript",
            variant: "destructive",
          });
        }
      }
    };

    loadSelectedTranscript();
  }, [toast]);

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

  ///////////////////////////////////////////////////////////////////////////////
  // Handle generate transcript
  ///////////////////////////////////////////////////////////////////////////////
  const handleRegenerateTranscriptWrapper = async (
    transcript: Transcript,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<void> => {
    try {
      setIsGenerating(true);

      // Create a wrapper for the progress callback to ensure we're updating the UI
      const wrappedProgressCallback = (progress: number, message: string) => {
        if (progressCallback) {
          progressCallback(progress, message);
        }
        // If progress is 100%, we're done
        if (progress === 100) {
          // We'll let the finally block handle setting isGenerating to false
        }
      };

      await handleRegenerateTranscript(transcript, wrappedProgressCallback, toast);
      
      // Refresh the transcript data
      const updatedTranscript = await transcriptsService.getTranscriptById(transcript.id);
      if (updatedTranscript) {
        setSelectedTranscript(updatedTranscript as Transcript);
      }
    } catch (error) {
      console.error("Error handleRegenerateTranscriptWrapper:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // Render the page
  ///////////////////////////////////////////////////////////////////////////////
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
                onRegenerateTranscript={handleRegenerateTranscriptWrapper}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
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