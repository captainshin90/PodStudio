import { useState, useEffect } from "react";
import { Transcript, TranscriptType } from "@/lib/schemas/transcripts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TranscriptDetailsProps {
  transcript: Transcript | null;
  onSave: (transcript: Transcript) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export default function TranscriptDetails({
  transcript,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
}: TranscriptDetailsProps) {
  const [formData, setFormData] = useState<Partial<Transcript>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (transcript) {
      setFormData(transcript);
      setHasChanges(false);
    } else if (isNew) {
      setFormData({
        transcript_id: crypto.randomUUID(),
        transcript_title: "Enter Transcript Title",
        transcript_type: "interview",
        topic_tags: [],
        transcript_model: "",
        transcript_text: "",
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
  }, [transcript, isNew]);

  if (!transcript && !isNew && !formData.transcript_id) {
    return <div className="flex items-center gap-2 text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a transcript to view details or create a new transcript
    </div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData as Transcript);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header section: Cancel, Delete, Save buttons */}
      <div className="flex items-center justify-between mb-4">
        {isNew && (
          <h2 className="text-xl font-semibold">New Transcript</h2>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {transcript && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
          <Button type="submit" disabled={!hasChanges}>
            {transcript ? "Save Changes" : "Save Transcript"}
          </Button>
        </div>
      </div>

      {/* Transcript details section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="transcript_id">Transcript ID</Label>
            <Input
              id="transcript_id"
              name="transcript_id"
              value={formData.transcript_id || ""}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transcript_type">Type</Label>
            <Select
              value={formData.transcript_type || "interview"}
              onValueChange={(value: TranscriptType) => {
                setFormData({ ...formData, transcript_type: value });
                setHasChanges(true);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="petition">Petition</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="transcript_title">Title</Label>
            <Input
              id="transcript_title"
              name="transcript_title"
              value={formData.transcript_title || ""}
              onChange={handleChange}
            />
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
                topic_tags: e.target.value.split(",").map((tag) => tag.trim()),
              });
              setHasChanges(true);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transcript_model">Model</Label>
          <Input
            id="transcript_model"
            name="transcript_model"
            value={formData.transcript_model || ""}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transcript_text">Transcript Text</Label>
          <Textarea
            id="transcript_text"
            name="transcript_text"
            value={formData.transcript_text || ""}
            onChange={handleChange}
            className="min-h-[200px]"
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
      </div>
    </form>
  );
} 