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

interface PodcastDetailsProps {
  podcast: Podcast | null;
  onSave: (podcast: Podcast) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export default function PodcastDetails({
  podcast,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
}: PodcastDetailsProps) {
  const [formData, setFormData] = useState<Partial<Podcast>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [episodes, setEpisodes] = useState<any[]>([]);

  useEffect(() => {
    if (podcast) {
      setFormData(podcast);
      setHasChanges(false);
      // Load episodes for this podcast
      loadEpisodes(podcast.podcast_id);
    } else if (isNew) {
      setFormData({
        podcast_id: crypto.randomUUID(),
        podcast_title: "Enter Podcast Title",
        podcast_hosts: [],
        podcast_image: "",
        podcast_desc: "Enter Podcast Description",
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

  if (!podcast && !isNew && !formData.podcast_id) {
    return <div className="flex items-center gap-2 text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a podcast to view details or create a new podcast
    </div>;
  }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        {isNew && (
          <h2 className="text-xl font-semibold">New Podcast</h2>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
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
            {podcast ? "Save Changes" : "Create Podcast"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="podcast_id">Podcast ID</Label>
            <Input
              id="podcast_id"
              name="podcast_id"
              value={formData.podcast_id || ""}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="podcast_type">Type</Label>
            <Select
              value={formData.podcast_type || "summary"}
              onValueChange={(value: PodcastType) => {
                setFormData({ ...formData, podcast_type: value });
                setHasChanges(true);
              }}
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

        <div className="space-y-2">
          <Label htmlFor="podcast_title">Title</Label>
          <Input
            id="podcast_title"
            name="podcast_title"
            value={formData.podcast_title || ""}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="podcast_hosts">Hosts</Label>
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
          />
        </div>

        {isNew && (
          <div className="space-y-2">
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

        {!isNew && (
          <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="podcast_desc">Description</Label>
          <Textarea
            id="podcast_desc"
            name="podcast_desc"
            value={formData.podcast_desc || ""}
            onChange={handleChange}
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="podcast_format">Format</Label>
            <Select
              value={formData.podcast_format || "html"}
              onValueChange={(value: PodcastFormat) => {
                setFormData({ ...formData, podcast_format: value });
                setHasChanges(true);
              }}
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
          <div className="space-y-2">
            <Label htmlFor="subscription_type">Subscription Type</Label>
            <Select
              value={formData.subscription_type || "free"}
              onValueChange={(value: "free" | "premium") => {
                setFormData({ ...formData, subscription_type: value });
                setHasChanges(true);
              }}
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

        <div className="space-y-2">
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
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active || false}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, is_active: checked });
              setHasChanges(true);
            }}
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
          />
          <Label htmlFor="is_deleted">Deleted</Label>
        </div>

        {podcast && episodes.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-lg font-semibold">Episodes</h3>
            <div className="space-y-2">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                >
                  <div className="font-medium">{episode.episode_title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(episode.publish_datetime).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </form>
  );
} 