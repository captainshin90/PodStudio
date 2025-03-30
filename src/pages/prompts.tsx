import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PromptBrowser from "@/components/prompts/PromptBrowser";
import PromptDetails from "@/components/prompts/PromptDetails";
import { useState } from "react";
import { Prompt } from "@/lib/schemas/prompts";
import { promptsService } from "@/lib/services/database-service";
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

export default function PromptsPage() {
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleSave = async (updatedPrompt: Prompt) => {
    try {
      await promptsService.updatePrompt(updatedPrompt.id, updatedPrompt);
      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
      setSelectedPrompt(updatedPrompt);
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast({
        title: "Error",
        description: "Failed to update prompt",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPrompt?.id) return;
    
    try {
      await promptsService.deletePrompt(selectedPrompt.id);
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
      setSelectedPrompt(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast({
        title: "Error",
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    }
  };
/*
  const handleCreatePodcast = async () => {
    if (!selectedPrompt) return;
    // TODO: Implement podcast creation logic
    toast({
      title: "Coming Soon",
      description: "Podcast creation feature will be available soon",
    });
  };
*/
 

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-2xl font-bold mb-6">LLM Prompts Management</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Prompt List */}
        <div className="col-span-4 border rounded-lg p-4">
          <PromptBrowser 
            selectedPrompt={selectedPrompt}
            onSelectPrompt={setSelectedPrompt}
            disabled={showNewPrompt}
          />
        </div>

        {/* Right Panel - Prompt Details or New Prompt */}
        <div className="col-span-8 border rounded-lg p-4">
          {showNewPrompt ? (
            <div className="space-y-4">
              <PromptDetails
                prompt={null}
                onSave={async (newPrompt) => {
                  try {
                    const promptId = await promptsService.createPrompt(newPrompt);
                    if (promptId) {
                      toast({
                        title: "Success",
                        description: "Prompt created successfully",
                      });
                      setShowNewPrompt(false);
                    }
                  } catch (error) {
                    console.error("Error creating prompt:", error);
                    toast({
                      title: "Error",
                      description: "Failed to create prompt",
                      variant: "destructive",
                    });
                  }
                }}
                onCancel={() => setShowNewPrompt(false)}
                isNew={true}
              />
            </div>
          ) : (
            <>
              {!selectedPrompt && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowNewPrompt(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Prompt
                  </Button>
                </div>
              )}
              <PromptDetails
                prompt={selectedPrompt}
                onSave={handleSave}
                onCancel={() => setSelectedPrompt(null)}
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
              This action will delete the prompt
              "{selectedPrompt?.prompt_name}".
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