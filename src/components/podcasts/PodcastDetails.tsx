import { useState, useEffect } from "react";
import { Podcast, PodcastType, PodcastFormat } from "@/lib/schemas/podcasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { episodesService } from "@/lib/services/database-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { nanoid } from "nanoid";

interface PodcastDetailsProps {
  podcast: Podcast | null;
  onSave: (podcast: Podcast) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  isReadOnly?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// PodcastDetails component
///////////////////////////////////////////////////////////////////////////////

export default function PodcastDetails({
  podcast,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
  isReadOnly = false,
}: PodcastDetailsProps) {
  const [formData, setFormData] = useState<Partial<Podcast>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (podcast) {
      setFormData(podcast);
      setHasChanges(false);
      // Load episodes for this podcast
      loadEpisodes(podcast.id);
    } else if (isNew) {
      setFormData({
        id: "podcast_" + nanoid(20),
        // podcast_id: crypto.randomUUID(),
        podcast_title: "",
        podcast_slug: "",
        podcast_tagline: "",
        podcast_hosts: [],
        podcast_image: "",
        podcast_desc: "",
        podcast_type: "summary",
        podcast_format: "html",
        topic_tags: [],
        subscription_type: "free",
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      });
      setHasChanges(true);
    } else {
      setFormData({});
      setHasChanges(false);
    }
  }, [podcast, isNew]);

  ///////////////////////////////////////////////////////////////////////////////
  // load the episodes for the podcast
  ///////////////////////////////////////////////////////////////////////////////
  const loadEpisodes = async (podcastId: string) => {
    try {
      const loadedEpisodes = await episodesService.getAllEpisodes(podcastId);
      if (loadedEpisodes) {
        setEpisodes(loadedEpisodes);
      }
    } catch (error) {
      console.error("Error loading episodes:", error);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // render the podcast details component
  ///////////////////////////////////////////////////////////////////////////////
  if (!podcast && !isNew && !formData.id) {
    return <div className="flex items-center gap-2 font-semibold text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a podcast to view details or create a new podcast
    </div>;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // handle the submit event
  ///////////////////////////////////////////////////////////////////////////////
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData as Podcast);
      setHasChanges(false);
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
  // handle the change event
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
  };

  ///////////////////////////////////////////////////////////////////////////////
  // handle the title change event
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
      podcast_title: title,
      podcast_slug: slug
    }));
    setHasChanges(true);
  };

  ///////////////////////////////////////////////////////////////////////////////
  // handle the file upload event
  ///////////////////////////////////////////////////////////////////////////////
  const handleFileUpload = async (file: File) => {
    // Here you would typically upload the file to your storage service
    // and get back a URL. For now, we'll just use a placeholder
    const imageUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      podcast_image: imageUrl
    }));
    setHasChanges(true);
  };

  ///////////////////////////////////////////////////////////////////////////////
  // handle the cancel event
  ///////////////////////////////////////////////////////////////////////////////
  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // return the podcast details component
  ///////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
     {/* Header section: Cancel, Delete, Save buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-between mb-4">
          {isNew && (
            <h2 className="text-xl font-semibold">New Podcast</h2>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {podcast && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={!hasChanges}>
              {podcast ? "Save Changes" : "Save Podcast"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="id" className="text-muted-foreground/70">Podcast ID</Label>
            <Input
              id="id"
              name="id"
              value={formData.id || ""}
              disabled
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="podcast_type" className="text-muted-foreground/70">Type</Label>
            <Select
              value={formData.podcast_type || "summary"}
              onValueChange={(value: PodcastType) => {
                setFormData({ ...formData, podcast_type: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="audio_podcast">Audio Podcast</SelectItem>
                <SelectItem value="video_podcast">Video Podcast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="podcast_title" className="text-muted-foreground/70">Title</Label>
          <Input
            id="podcast_title"
            name="podcast_title"
            placeholder="Enter Podcast Title"
            value={formData.podcast_title || ""}
            onChange={handleTitleChange}
            disabled={isReadOnly}
          />
        </div>
        <div className="space-y-1">
          {/*<Label htmlFor="podcast_slug" className="text-muted-foreground/70">Slug</Label>*/}
          <Input
            id="podcast_slug"
            name="podcast_slug"
            value={formData.podcast_slug || ""}
            disabled
            className="bg-muted text-foreground"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="podcast_tagline" className="text-muted-foreground/70">Tagline</Label>
          <Input
            id="podcast_tagline"
            name="podcast_tagline"
            placeholder="Enter Podcast Tagline"
            value={formData.podcast_tagline || ""}
            onChange={handleChange}
            disabled={isReadOnly}
          />
        </div>
              
        <div className="space-y-1">
          <Label htmlFor="podcast_hosts" className="text-muted-foreground/70">Hosts</Label>
          <Input
            id="podcast_hosts"
            name="podcast_hosts"
            value={formData.podcast_hosts?.join(", ") || ""}
            onChange={(e) => {
              setFormData({
                ...formData,
                podcast_hosts: e.target.value.split(",").map(host => host.trim())
              });
              setHasChanges(true);
            }}
            disabled={isReadOnly}
          />
        </div>

        {isNew && !isReadOnly && (
          <div className="space-y-1">
            <Label>Podcast Image</Label>
            <div className="flex items-start gap-4">
              {formData.podcast_image && (
                <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                  <img
                    src={formData.podcast_image}
                    alt="Podcast preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <FileUpload
                  onFileSelect={handleFileUpload}
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        )}

        {!isNew && !isReadOnly && (
          <div className="space-y-1">
            <Label>Podcast Image</Label>
            <div className="flex items-start gap-4">
              {formData.podcast_image && (
                <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                  <img
                    src={formData.podcast_image}
                    alt="Podcast preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <FileUpload
                  onFileSelect={handleFileUpload}
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        )}

        {isReadOnly && formData.podcast_image && (
          <div className="space-y-1">
            <Label>Podcast Image</Label>
            <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
              <img
                src={formData.podcast_image}
                alt="Podcast preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="podcast_desc" className="text-muted-foreground/70">Description</Label>
          <Textarea
            id="podcast_desc"
            name="podcast_desc"
            placeholder="Enter Podcast Description"
            value={formData.podcast_desc || ""}
            onChange={handleChange}
            className="min-h-[100px]"
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="podcast_format" className="text-muted-foreground/70">Format</Label>
            <Select
              value={formData.podcast_format || "html"}
              onValueChange={(value: PodcastFormat) => {
                setFormData({ ...formData, podcast_format: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="mp4">MP4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="subscription_type" className="text-muted-foreground/70">Subscription Type</Label>
            <Select
              value={formData.subscription_type || "free"}
              onValueChange={(value: "free" | "premium") => {
                setFormData({ ...formData, subscription_type: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subscription type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="topic_tags" className="text-muted-foreground/70">Topic Tags (#topic/place/people/org/event. Lower case, no spaces, max 30 characters)</Label>
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
              <Label htmlFor="is_deleted">Deleted</Label>
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

        {podcast && episodes.length > 0 && (
          <div className="space-y-3 mt-8 border-t pt-4">
            <h3 className="text-lg font-bold">Episodes</h3>
            <div className="space-y-1">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                >
                  <div className="font-medium">{episode.episode_title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                  {episode.episode_desc}
                  {/* new Date(episode.publish_date).toLocaleDateString() */}
                  </div>
                </div>
              ))}
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