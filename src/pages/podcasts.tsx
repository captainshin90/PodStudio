import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PodcastBrowser from "@/components/podcasts/PodcastBrowser";
import PodcastDetails from "@/components/podcasts/PodcastDetails";
import { useState } from "react";
import { Podcast } from "@/lib/schemas/podcasts";
import { podcastsService } from "@/lib/services/database-service";
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

export default function PodcastsPage() {
  const [showNewPodcast, setShowNewPodcast] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleSave = async (updatedPodcast: Podcast) => {
    try {
      await podcastsService.updatePodcast(updatedPodcast.id, updatedPodcast);
      toast({
        title: "Success",
        description: "Podcast updated successfully",
      });
      setSelectedPodcast(updatedPodcast);
    } catch (error) {
      console.error("Error updating podcast:", error);
      toast({
        title: "Error",
        description: "Failed to update podcast",
        variant: "destructive",
      });
    }
  };

  // Handle create podcast  
  const handleCreate = async (newPodcast: Podcast) => {
    try {
      await podcastsService.createPodcast(newPodcast.id, newPodcast);
      toast({
        title: "Success",
        description: "Podcast created successfully",
      });
      setShowNewPodcast(false);
    } catch (error) { 
      console.error("Error creating podcast:", error);
      toast({
        title: "Error",
        description: "Failed to create podcast",
        variant: "destructive",
      });
    }
  };

  // Handle delete podcast
  const handleDelete = async () => {
    if (!selectedPodcast?.id) return;
    
    try {
      await podcastsService.deletePodcast(selectedPodcast.id);
      toast({
        title: "Success",
        description: "Podcast deleted successfully",
      });
      setSelectedPodcast(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting podcast:", error);
      toast({
        title: "Error",
        description: "Failed to delete podcast",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-0 px-0" >
      <h1 className="text-2xl font-bold text-muted-foreground mb-6">Podcasts Management</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Podcast List */}
        <div className="col-span-4 border rounded-lg p-4">
          <PodcastBrowser 
            selectedPodcast={selectedPodcast}
            onSelectPodcast={setSelectedPodcast}
            disabled={showNewPodcast}
          />
        </div>

        {/* Right Panel - Podcast Details or New Podcast */}
        <div className="col-span-8 border rounded-lg p-4">
          {showNewPodcast ? (
            <div className="space-y-4">
              <PodcastDetails
                podcast={null}
                onSave={handleCreate}
                onCancel={() => setShowNewPodcast(false)}
                isNew={true}
              />
            </div>
          ) : (
            <>
              {!selectedPodcast && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowNewPodcast(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Podcast
                  </Button>
                </div>
              )}
              <PodcastDetails
                podcast={selectedPodcast}
                onSave={handleSave}
                onCancel={() => setSelectedPodcast(null)}
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
              This action will delete the podcast
              "{selectedPodcast?.podcast_title}".
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