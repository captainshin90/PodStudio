import { useState, useEffect } from "react";
import { Episode } from "@/lib/schemas/episodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { podcastsService, promptsService, transcriptsService } from "@/lib/services/database-service";
import { storage, auth } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
// import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

/*
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
*/

///////////////////////////////////////////////////////////////////////////////
// EpisodeDetailsProps interface
///////////////////////////////////////////////////////////////////////////////

interface EpisodeDetailsProps {
  episode?: Episode | null;
  onSave: (episode: Episode) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  isGenerated?: boolean;
  isReadOnly?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// SelectDialogProps interface
///////////////////////////////////////////////////////////////////////////////

interface SelectDialogProps {
  title: string;
  items: Array<{ id: string; title: string }>;
  onSelect: (id: string) => void;
  trigger: React.ReactNode;
}

///////////////////////////////////////////////////////////////////////////////
// SelectDialog component
///////////////////////////////////////////////////////////////////////////////

function SelectDialog({ title, items, onSelect, trigger }: SelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // return the select dialog component
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.id}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

///////////////////////////////////////////////////////////////////////////////
// EpisodeDetails component
///////////////////////////////////////////////////////////////////////////////

export default function EpisodeDetails({ 
  episode, 
  onSave, 
  onCancel, 
  onDelete, 
  isNew = false,
  isGenerated = false,
  isReadOnly = false 
}: EpisodeDetailsProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Episode>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isTranscriptEditable, setIsTranscriptEditable] = useState(false);
  const [podcasts, setPodcasts] = useState<Array<{ id: string; title: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string }>>([]);
  const [transcripts, setTranscripts] = useState<Array<{ id: string; title: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (episode) {
      setFormData(episode);
      // If this is a newly generated episode (has id), treat it as a new record
      if (episode.id && isGenerated) { // new generated episode
        setHasChanges(true);
        setIsTranscriptEditable(true);
      } else {  // existing episode record
        setHasChanges(false);
        setIsTranscriptEditable(false);
      }
    } else if (isNew) { // new blank episode
      setFormData({
        id: "episode_" + nanoid(20),
        // id: crypto.randomUUID(), 
        // episode_id: formData.id,
        podcast_id: "",
        transcript_id: "",
        prompt_id: "",
        episode_title: "",
        episode_desc: "",
        episode_number: 1,
        episode_summary: "",
        content_duration: 0,
        content_transcript: "",
        topic_tags: [],
        views: 0,
        likes: 0,
        dislikes: 0,
        linklist: [],
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      });
      setHasChanges(true);
      setIsTranscriptEditable(true);
    } else { // no episode
      setFormData({});
      setHasChanges(false);
      setIsTranscriptEditable(false);
    }
  }, [episode, isNew, isGenerated]);

  useEffect(() => {
    loadSelectionData();
  }, []);

    ///////////////////////////////////////////////////////////////////////////////
  // This is the handleBeforeUnload function
  ///////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  ///////////////////////////////////////////////////////////////////////////////
  // This is the handleVisibilityChange function
  ///////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasChanges) {
        // Show confirmation dialog when switching tabs
        setShowCancelDialog(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasChanges]);

  ///////////////////////////////////////////////////////////////////////////////
  // This is the loadSelectionData function
  /////////////////////////////////////////////////////////////////////////////// 
  const loadSelectionData = async () => {
    try {
      const [loadedPodcasts, loadedPrompts, loadedTranscripts] = await Promise.all([
        podcastsService.getAllPodcasts(),
        promptsService.getAllPrompts(),
        transcriptsService.getAllTranscripts()
      ]);

      if (loadedPodcasts) {
        setPodcasts(loadedPodcasts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.id, title: p.podcast_title })));
      }
      if (loadedPrompts) {
        setPrompts(loadedPrompts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.id, title: p.prompt_name })));
      }
      if (loadedTranscripts) {
        setTranscripts(loadedTranscripts
          .filter(t => t.is_active && !t.is_deleted)
          .map(t => ({ id: t.id, title: t.transcript_title })));
      }
    } catch (error) {
      console.error("Error loading selection data:", error);
    }
  };

  if (!episode && !isNew && !formData.id) {
    return <div className="flex items-center gap-2 font-semibold text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select an episode to view details or create a new episode
    </div>;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // This is the handleSubmit function
  /////////////////////////////////////////////////////////////////////////////// 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData as Episode);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving episode:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

    ///////////////////////////////////////////////////////////////////////////////
  // This is the validateUrl function
  ///////////////////////////////////////////////////////////////////////////////
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // This is the handleChange function
  ///////////////////////////////////////////////////////////////////////////////
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);

    // Validate URL on change
    if (name === "episode_url") {
      if (value && !validateUrl(value)) {
        setUrlError("Please enter a valid URL");
      } else {
        setUrlError(null);
      }
    }
  };

    ///////////////////////////////////////////////////////////////////////////////
  // This is the handleTitleChange function
  ///////////////////////////////////////////////////////////////////////////////
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    // Convert title to slug format
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    setFormData(prev => ({
      ...prev,
      episode_title: title,
      episode_slug: slug
    }));
    setHasChanges(true);
  };

  ///////////////////////////////////////////////////////////////////////////////
  // This is the handleFileUpload function
  ///////////////////////////////////////////////////////////////////////////////
  const handleFileUpload = async (file: File) => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to upload images",
          variant: "destructive",
        });
        return;
      }

      setUploadingImage(true);
      
      // Create a unique filename using the episode ID and timestamp
      const timestamp = Date.now();
      const filename = `episodes/${formData.id}/${timestamp}-${file.name}`;
      const storageRef = ref(storage, filename);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update the form data with the permanent URL
      setFormData(prev => ({
        ...prev,
        content_image: downloadUrl
      }));
      setHasChanges(true);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // This is the handleCancel function
  ///////////////////////////////////////////////////////////////////////////////
  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // This is the main component for the episode details
  ///////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        {isNew && (
          <h2 className="text-xl font-semibold">New Episode</h2>
        )}
        {!isReadOnly && (
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {episode && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={!hasChanges && !isNew}>
              {episode ? "Save Changes" : "Save Episode"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="id" className="text-muted-foreground/70">Episode ID</Label>
            <Input
              id="id"
              name="id"
              value={formData.id || ""}
              disabled
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="episode_number" className="text-muted-foreground/70">Episode Number</Label>
            <Input
              id="episode_number"
              name="episode_number"
              type="number"
              value={formData.episode_number || 1}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="episode_title" className="text-muted-foreground/70">Title</Label>
          <Input
            id="episode_title"
            name="episode_title"
            placeholder="Enter Episode Title"
            value={formData.episode_title || ""}
            onChange={handleTitleChange}
            disabled={isReadOnly}
          />
        </div>
        <div className="space-y-1">
          {/*<Label htmlFor="episode_slug" className="text-muted-foreground/70">Slug</Label>*/}
          <Input
            id="episode_slug"
            name="episode_slug"
            value={formData.episode_slug || ""}
            disabled
            className="bg-muted text-foreground"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Podcast</Label>
            <SelectDialog
              title="Select Podcast"
              items={podcasts}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, podcast_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                  <span className="truncate">
                    {formData.podcast_id ? 
                      podcasts.find(p => p.id === formData.podcast_id)?.title || "Select Podcast" :
                      "Select Podcast"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Prompt</Label>
            <SelectDialog
              title="Select Prompt"
              items={prompts}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, prompt_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                  <span className="truncate">
                    {formData.prompt_id ? 
                      prompts.find(p => p.id === formData.prompt_id)?.title || "Select Prompt" :
                      "Select Prompt"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Transcript</Label>
            <SelectDialog
              title="Select Transcript"
              items={transcripts}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, transcript_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                  <span className="truncate">
                    {formData.transcript_id ? 
                      transcripts.find(t => t.id === formData.transcript_id)?.title || "Select Transcript" :
                      "Select Transcript"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="episode_desc" className="text-muted-foreground/70">Description</Label>
          <Textarea
            id="episode_desc"
            name="episode_desc"
            placeholder="Enter Episode Description"
            value={formData.episode_desc || ""}
            onChange={handleChange}
            className="min-h-[100px]"
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="episode_summary" className="text-muted-foreground/70">Summary</Label>
          <Textarea
            id="episode_summary"
            name="episode_summary"
            placeholder="Enter Episode Summary"
            value={formData.episode_summary || ""}
            onChange={handleChange}
            className="min-h-[100px]"
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="episode_transcript" className="text-muted-foreground/70">Generated Transcript Text</Label>
            {!isReadOnly && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="is_editable" className="text-sm text-muted-foreground/70">Edit</Label>
                <Switch
                  id="is_editable"
                  checked={isTranscriptEditable}
                  onCheckedChange={setIsTranscriptEditable}
                />
              </div>
            )}
          </div>
          <Textarea
            id="content_transcript"
            name="content_transcript"
            value={formData.content_transcript || ""}
            onChange={handleChange}
            className={`min-h-[200px] ${!isTranscriptEditable || isReadOnly ? "bg-muted text-foreground" : ""}`}
            disabled={!isTranscriptEditable || isReadOnly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Episode Image</Label>
            <div className="flex items-start gap-4">
              {formData.content_image && (
                <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                  <img
                    src={formData.content_image}
                    alt="Episode preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!isReadOnly && (
                <div className="flex-1">
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    accept="image/*"
                  />
                  {uploadingImage && (
                    <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading image...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="episode_url">Episode Audio URL</Label>
          <Input
            id="content_url"
            name="content_url"
            value={formData.content_url || ""}
            onChange={handleChange}
            placeholder="https://podstudio.fly.dev/audio/example.mp3"
            className={urlError ? "border-red-500" : ""}
            disabled={isReadOnly}
          />
          {urlError && (
            <p className="text-sm text-red-500">{urlError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="audio_player" className="text-muted-foreground/70">Play Audio</Label>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
              <audio
                id="audio_player"
                controls
                className="w-full"
                src={formData.content_url || ""}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="content_duration" className="text-muted-foreground/70">Duration (seconds)</Label>
            <Input
              id="content_duration"
              name="content_duration"
              type="number"
              value={formData.content_duration || 0}
              onChange={handleChange}
              disabled={isReadOnly}
              className="w-28"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="topic_tags">Topic Tags</Label>
          <Input
            id="topic_tags"
            name="topic_tags"
            value={formData.topic_tags?.join(", ") || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                topic_tags: e.target.value.split(",").map(tag => tag.trim())
              });
              setHasChanges(true);
            }}
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="views">Views</Label>
            <Input
              id="views"
              name="views"
              type="number"
              value={formData.views || 0}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="likes">Likes</Label>
            <Input
              id="likes"
              name="likes"
              type="number"
              value={formData.likes || 0}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dislikes">Dislikes</Label>
            <Input
              id="dislikes"
              name="dislikes"
              type="number"
              value={formData.dislikes || 0}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {!isReadOnly && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active || false}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, is_active: checked });
                  setHasChanges(true);
                }}
                disabled={isReadOnly}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_deleted"
                checked={formData.is_deleted}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, is_deleted: checked });
                  setHasChanges(true);
                }}
                disabled={isReadOnly}
              />
              <Label htmlFor="is_deleted" className="text-muted-foreground/70">Deleted</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Label className="text-muted-foreground/70">Created:</Label>
              <span className="text-sm">
                {formData.created_at 
                  ? (formData.created_at instanceof Date 
                      ? formData.created_at.toLocaleString() 
                      : typeof formData.created_at === 'object' && 'seconds' in formData.created_at
                        ? new Date((formData.created_at as any).seconds * 1000).toLocaleString()
                        : new Date(formData.created_at as any).toLocaleString())
                  : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
} 