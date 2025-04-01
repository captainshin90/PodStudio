import { useState } from "react";
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

export default function EpisodesPage() {
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

//  const handleEpisodeSelect = (episode: Episode) => {
//    setSelectedEpisode(episode);
//    setShowNewEpisode(false);
//  };

  const handleSave = async (updatedEpisode: Episode) => {
    try {
      if (selectedEpisode) {
        await episodesService.updateEpisode(updatedEpisode.id, updatedEpisode);
        toast({
          title: "Success",
          description: "Episode updated successfully",
        });
      } else {
        await episodesService.createEpisode(updatedEpisode);
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
      const episodeId = await episodesService.createEpisode(newEpisode);
      if (episodeId) {
        toast({
          title: "Success",
          description: "Episode created successfully",
        });
        setShowNewEpisode(false);
      }
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

//  const handleCancel = () => {
//    setSelectedEpisode(null);
//    setShowNewEpisode(false);
//  };


  return (
    <div className="container mx-auto py-2">
      <h1 className="text-2xl font-bold mb-6">Episodes Management</h1>
      
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
