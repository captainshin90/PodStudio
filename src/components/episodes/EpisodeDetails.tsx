import { useState, useEffect } from "react";
import { Episode } from "@/lib/schemas/episodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { podcastsService, promptsService, transcriptsService } from "@/lib/services/database-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
/*
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
*/

interface EpisodeDetailsProps {
  episode: Episode | null;
  onSave: (episode: Episode) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

interface SelectDialogProps {
  title: string;
  items: Array<{ id: string; title: string }>;
  onSelect: (id: string) => void;
  trigger: React.ReactNode;
}

function SelectDialog({ title, items, onSelect, trigger }: SelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

export default function EpisodeDetails({
  episode,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
}: EpisodeDetailsProps) {
  const [formData, setFormData] = useState<Partial<Episode>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [podcasts, setPodcasts] = useState<Array<{ id: string; title: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string }>>([]);
  const [transcripts, setTranscripts] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (episode) {
      setFormData(episode);
      setHasChanges(false);
    } else if (isNew) {
      setFormData({
        episode_id: crypto.randomUUID(),
        episode_title: "Enter Episode Title",
        episode_desc: "Enter Episode Description",
        episode_number: 1,
        episode_duration: 0,
        episode_summary: "",
        episode_transcript: "",
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
    } else {
      setFormData({});
      setHasChanges(false);
    }
  }, [episode, isNew]);

  useEffect(() => {
    loadSelectionData();
  }, []);

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
          .map(p => ({ id: p.podcast_id, title: p.podcast_title })));
      }
      if (loadedPrompts) {
        setPrompts(loadedPrompts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.prompt_id, title: p.prompt_name })));
      }
      if (loadedTranscripts) {
        setTranscripts(loadedTranscripts
          .filter(t => t.is_active && !t.is_deleted)
          .map(t => ({ id: t.transcript_id, title: t.transcript_title })));
      }
    } catch (error) {
      console.error("Error loading selection data:", error);
    }
  };

  if (!episode && !isNew && !formData.episode_id) {
    return <div className="flex items-center gap-2 text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select an episode to view details or create a new episode
    </div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData as Episode);
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
    const imageUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      episode_image: imageUrl
    }));
    setHasChanges(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        {isNew && (
          <h2 className="text-xl font-semibold">New Episode</h2>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
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
          <Button type="submit" disabled={!hasChanges}>
            {episode ? "Save Changes" : "Create Episode"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="episode_id">Episode ID</Label>
            <Input
              id="episode_id"
              name="episode_id"
              value={formData.episode_id || ""}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="episode_number">Episode Number</Label>
            <Input
              id="episode_number"
              name="episode_number"
              type="number"
              value={formData.episode_number || 1}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="episode_title">Title</Label>
          <Input
            id="episode_title"
            name="episode_title"
            value={formData.episode_title || ""}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Podcast</Label>
            <SelectDialog
              title="Select Podcast"
              items={podcasts}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, podcast_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-start">
                  {formData.podcast_id ? 
                    podcasts.find(p => p.id === formData.podcast_id)?.title || "Select Podcast" :
                    "Select Podcast"
                  }
                </Button>
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Prompt</Label>
            <SelectDialog
              title="Select Prompt"
              items={prompts}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, prompt_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-start">
                  {formData.prompt_id ? 
                    prompts.find(p => p.id === formData.prompt_id)?.title || "Select Prompt" :
                    "Select Prompt"
                  }
                </Button>
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Transcript</Label>
            <SelectDialog
              title="Select Transcript"
              items={transcripts}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, transcript_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-start">
                  {formData.transcript_id ? 
                    transcripts.find(t => t.id === formData.transcript_id)?.title || "Select Transcript" :
                    "Select Transcript"
                  }
                </Button>
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="episode_desc">Description</Label>
          <Textarea
            id="episode_desc"
            name="episode_desc"
            value={formData.episode_desc || ""}
            onChange={handleChange}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="episode_summary">Summary</Label>
          <Textarea
            id="episode_summary"
            name="episode_summary"
            value={formData.episode_summary || ""}
            onChange={handleChange}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="episode_transcript">Transcript</Label>
          <Textarea
            id="episode_transcript"
            name="episode_transcript"
            value={formData.episode_transcript || ""}
            onChange={handleChange}
            className="min-h-[200px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="episode_duration">Duration (seconds)</Label>
            <Input
              id="episode_duration"
              name="episode_duration"
              type="number"
              value={formData.episode_duration || 0}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="episode_url">Content URL</Label>
            <Input
              id="episode_url"
              name="episode_url"
              value={formData.episode_url || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Content Image</Label>
          <div className="flex items-start gap-4">
            {formData.episode_image && (
              <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                <img
                  src={formData.episode_image}
                  alt="Episode preview"
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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="views">Views</Label>
            <Input
              id="views"
              name="views"
              type="number"
              value={formData.views || 0}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="likes">Likes</Label>
            <Input
              id="likes"
              name="likes"
              type="number"
              value={formData.likes || 0}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dislikes">Dislikes</Label>
            <Input
              id="dislikes"
              name="dislikes"
              type="number"
              value={formData.dislikes || 0}
              onChange={handleChange}
            />
          </div>
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
      </div>
    </form>
  );
} 