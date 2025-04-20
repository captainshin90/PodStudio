import { useState, useEffect } from "react";
import { Episode } from "@/lib/schemas/episodes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EpisodeBrowser from "@/components/episodes/EpisodeBrowser";
import EpisodeDetails from "@/components/episodes/EpisodeDetails";
import { episodesService } from "@/lib/services/database-service";
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
import { useLocation } from "react-router-dom";
import { handleRegeneratePodcast } from "@/components/create/CreatePodcast";

///////////////////////////////////////////////////////////////////////////////
// Episodes page
///////////////////////////////////////////////////////////////////////////////
export default function EpisodesPage() {
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  // Load the selected episode from navigation state if available
  useEffect(() => {
    const loadSelectedEpisode = async () => {
      // Check both location state and localStorage for selectedEpisodeId
      const state = location.state as { selectedEpisodeId?: string } | null;
      const storedEpisodeId = localStorage.getItem('selectedEpisodeId');
      const episodeId = state?.selectedEpisodeId || storedEpisodeId;
      
      if (episodeId) {
        try {
          const episode = await episodesService.getEpisodeById(episodeId);
          if (episode) {
            setSelectedEpisode(episode as Episode);
            // Clear the stored episode ID after loading it
            if (storedEpisodeId) {
              localStorage.removeItem('selectedEpisodeId');
            }
          }
        } catch (error) {
          console.error("Error loading selected episode:", error);
          toast({
            title: "Error",
            description: "Failed to load selected episode",
            variant: "destructive",
          });
        }
      }
    };

    loadSelectedEpisode();
  }, [location.state, toast]);

  // Handle save episode
  const handleSave = async (updatedEpisode: Episode) => {
    try {
      if (selectedEpisode) {
        await episodesService.updateEpisode(updatedEpisode.id, updatedEpisode);
        toast({
          title: "Success",
          description: "Episode updated successfully",
        });
      } else {
        await episodesService.createEpisode(updatedEpisode.id, updatedEpisode);
        toast({
          title: "Success",
          description: "Episode created successfully",
        });
      }
      setSelectedEpisode(updatedEpisode);
      setShowNewEpisode(false);
    } catch (error) {
      console.error("Error saving episode:", error);
      toast({
        title: "Error",
        description: "Failed to save episode",
        variant: "destructive",
      });
    }
  };

  // Handle create episode  
  const handleCreate = async (newEpisode: Episode) => {
    try {
      await episodesService.createEpisode(newEpisode.id, newEpisode);
      toast({
        title: "Success",
          description: "Episode created successfully",
      });
      setShowNewEpisode(false);
    } catch (error) {
      console.error("Error creating episode:", error);  
      toast({
        title: "Error",
        description: "Failed to create episode",
        variant: "destructive",
      });
    }
  };

  // Handle delete episode
  const handleDelete = async () => {
    if (!selectedEpisode) return;

    try {
      await episodesService.deleteEpisode(selectedEpisode.id);
      toast({
        title: "Success",
        description: "Episode deleted successfully",
      });
      setSelectedEpisode(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting episode:", error);
      toast({
        title: "Error",
        description: "Failed to delete episode",
        variant: "destructive",
      });
    }
  };
  
  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle generating audio for an existing episode
  // Most of this code is duplicated from CreatePodcast.tsx
  //////////////////////////////////////////////////////////////////////////////
  
  const handleRegeneratePodcastWrapper = async (
    episode: Episode,
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
      // call handleRegeneratePodcast() in CreatePodcast.tsx
      await handleRegeneratePodcast(episode, wrappedProgressCallback, toast);

      // Refresh the episode data
      const refreshedEpisode = await episodesService.getEpisodeById(episode.id);
      if (refreshedEpisode) {
        // Update the selected episode in the UI
        setSelectedEpisode(refreshedEpisode as Episode);
      }
    } catch (error) {
      console.error("Error in handleRegeneratePodcastWrapper:", error);
    } finally {
      // Always set isGenerating to false when we're done
      setIsGenerating(false);
    }
  };



  //////////////////////////////////////////////////////////////////////////////
  // This is the main component for the episodes page
  //////////////////////////////////////////////////////////////////////////////
  return (
    <div className="container mx-auto py-0 px-0" >
      <h1 className="text-2xl font-bold text-muted-foreground mb-6">Episodes Management</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Podcast List */}
        <div className="col-span-4 border rounded-lg p-4">
          <EpisodeBrowser 
            selectedEpisode={selectedEpisode}
            onSelectEpisode={setSelectedEpisode}
            disabled={showNewEpisode}
          />
        </div>

        {/* Right Panel - Episode Details or New Episode */}
        <div className="col-span-8 border rounded-lg p-4">
          {showNewEpisode ? (
            <div className="space-y-4">
              <EpisodeDetails
                episode={null}
                onSave={handleCreate}
                onCancel={() => setShowNewEpisode(false)}
                isNew={true}
              />
            </div>
          ) : (
            <>
              {!selectedEpisode && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowNewEpisode(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Episode
                  </Button>
                </div>
              )}
              <EpisodeDetails
                episode={selectedEpisode}
                onSave={handleSave}
                onCancel={() => setSelectedEpisode(null)}
                onDelete={() => setShowDeleteDialog(true)}
                isNew={false}
                onRegenerateAudio={handleRegeneratePodcastWrapper}
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
              This action will delete the podcast
              "{selectedEpisode?.episode_title}".
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
