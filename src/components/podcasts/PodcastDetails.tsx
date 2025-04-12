import { useState, useEffect } from "react";
import { Podcast, PodcastType, PodcastFormat } from "@/lib/schemas/podcasts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

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

  // Add event listeners for audio elements
  useEffect(() => {
    const handleAudioPlay = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      setPlayingAudioId(audioElement.id.replace('audio-', ''));
    };

    const handleAudioPause = () => {
      setPlayingAudioId(null);
    };

    const handleAudioEnded = () => {
      setPlayingAudioId(null);
    };

    // Add event listeners to all audio elements
    episodes.forEach(episode => {
      if (episode.content_url) {
        const audioElement = document.getElementById(`audio-${episode.id}`) as HTMLAudioElement;
        if (audioElement) {
          audioElement.addEventListener('play', handleAudioPlay);
          audioElement.addEventListener('pause', handleAudioPause);
          audioElement.addEventListener('ended', handleAudioEnded);
        }
      }
    });

    // Clean up event listeners
    return () => {
      episodes.forEach(episode => {
        if (episode.content_url) {
          const audioElement = document.getElementById(`audio-${episode.id}`) as HTMLAudioElement;
          if (audioElement) {
            audioElement.removeEventListener('play', handleAudioPlay);
            audioElement.removeEventListener('pause', handleAudioPause);
            audioElement.removeEventListener('ended', handleAudioEnded);
          }
        }
      });
    };
  }, [episodes]);

  ///////////////////////////////////////////////////////////////////////////////
  // load the episodes for the podcast
  ///////////////////////////////////////////////////////////////////////////////
  const loadEpisodes = async (podcastId: string) => {
    try {
      const loadedEpisodes = await episodesService.getActiveEpisodes(podcastId);
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
  const handleImageUpload = async (filePath: string) => {
    setUploadingImage(true);
    try {
      setFormData(prev => ({
        ...prev,
        podcast_image: filePath
      }));
      setHasChanges(true);
    } finally {
      setUploadingImage(false);
    }
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
  // handle the audio play/pause toggle
  ///////////////////////////////////////////////////////////////////////////////
  const handleAudioToggle = (e: React.MouseEvent, episodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const audioElement = document.getElementById(`audio-${episodeId}`) as HTMLAudioElement;
    if (audioElement) {
      if (playingAudioId === episodeId) {
        audioElement.pause();
      } else {
        // Pause any currently playing audio
        if (playingAudioId) {
          const currentAudio = document.getElementById(`audio-${playingAudioId}`) as HTMLAudioElement;
          if (currentAudio) {
            currentAudio.pause();
          }
        }
        audioElement.play();
      }
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
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 flex items-center gap-2">
            <Label htmlFor="id" className="text-muted-foreground/70 whitespace-nowrap">Podcast ID:</Label>
            <Input
              id="id"
              name="id"
              value={formData.id || ""}
              disabled
              className="flex-1"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2 justify-end">
            <Label htmlFor="podcast_type" className="text-muted-foreground/70 whitespace-nowrap">Type:</Label>
            <Select
              value={formData.podcast_type || "summary"}
              onValueChange={(value: PodcastType) => {
                setFormData({ ...formData, podcast_type: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger className="w-48">
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
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.stopPropagation();
              }
            }}
          />
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

        <div className="space-y-1"> 
          <Label>Podcast Image</Label>
          <div className="flex items-start gap-4"> 
            <div className="w-48 h-48">
              {formData.podcast_image && (
                <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                  <img
                    src={formData.podcast_image}
                    alt="Podcast preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            {!isReadOnly && (
              <div className="h-48 w-48">
                <ImageUpload
                  onUpload={handleImageUpload}
                  maxSize={5242880} // 5MB max size
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
              <Label className="text-muted-foreground/70 pl-2">Updated:</Label>
              <span className="text-sm">
                {formData.updated_at 
                  ? (formData.updated_at instanceof Date 
                      ? formData.updated_at.toLocaleString() 
                      : typeof formData.updated_at === 'object' && 'seconds' in formData.updated_at
                        ? new Date((formData.updated_at as any).seconds * 1000).toLocaleString()
                        : new Date(formData.updated_at as any).toLocaleString())
                  : ""}
              </span>
            </div>
          </div>
        )}

        {podcast && episodes.length > 0 && (
          <div className="space-y-3 mt-8 border-t pt-4">
            <h3 className="text-lg font-bold">Episodes</h3>
            <div className="space-y-2">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer flex items-center gap-3"
                >
                  <div className="w-16 h-16 flex-shrink-0 relative group">
                    {episode.content_image ? (
                      <img 
                        src={episode.content_image} 
                        alt={episode.episode_title} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">No image</span>
                      </div>
                    )}
                    {episode.content_url && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <button 
                          type="button"
                          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          title={playingAudioId === episode.id ? "Pause" : "Play"}
                          onClick={(e) => handleAudioToggle(e, episode.id)}
                        >
                          {playingAudioId === episode.id ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="6" y="4" width="4" height="16"></rect>
                              <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{episode.episode_title}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">
                        {episode.publish_date 
                          ? new Date(episode.publish_date).toLocaleDateString() 
                          : "No date"}
                      </span>
                      <span className="truncate">{episode.episode_desc}</span>
                    </div>
                  </div>
                  {episode.content_url && (
                    <div className="flex-shrink-0">
                      <audio 
                        id={`audio-${episode.id}`}
                        controls
                        className="h-16 w-56"
                        src={episode.content_url}
                        title={`Play ${episode.episode_title}`}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
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