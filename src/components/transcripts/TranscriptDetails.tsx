import { useState, useEffect } from "react";
import { Transcript, TranscriptType } from "@/lib/schemas/transcripts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { documentsService, promptsService } from "@/lib/services/database-service";

interface TranscriptDetailsProps {
  transcript: Transcript | null;
  onSave: (transcript: Transcript) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  isReadOnly?: boolean;
}

/////////////////////////////////////////////////////////////////////////////// 
// SelectDialog component
/////////////////////////////////////////////////////////////////////////////// 

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

/////////////////////////////////////////////////////////////////////////////// 
// TranscriptDetails component
/////////////////////////////////////////////////////////////////////////////// 

export default function TranscriptDetails({
  transcript,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
  isReadOnly = false,
}: TranscriptDetailsProps) {
  const [formData, setFormData] = useState<Partial<Transcript>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [documents, setDocuments] = useState<Array<{ id: string; title: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string }>>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Add beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Add navigation guard for tab switching
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
  // Handle Transcript
  ///////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (transcript) {
      setFormData(transcript);
      setHasChanges(true);
      setIsEditable(false);
    } else if (isNew) {
      setFormData({
        transcript_id: crypto.randomUUID(),
        transcript_title: "",
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
      setIsEditable(true);
    } else {
      setFormData({});
      setHasChanges(false);
      setIsEditable(false);
    }
  }, [transcript, isNew]);

  useEffect(() => {
    loadSelectionData();
  }, []);

  ///////////////////////////////////////////////////////////////////////////////
  // Load Selection Data
  ///////////////////////////////////////////////////////////////////////////////
  const loadSelectionData = async () => {
    try {
      const [loadedDocuments, loadedPrompts] = await Promise.all([
        documentsService.getAllDocuments(),
        promptsService.getAllPrompts()
      ]);

      if (loadedDocuments) {
        setDocuments(loadedDocuments
          .filter(d => d.is_active && !d.is_deleted)
          .map(d => ({ id: d.doc_id, title: d.doc_name })));
      }
      if (loadedPrompts) {
        setPrompts(loadedPrompts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.prompt_id, title: p.prompt_name })));
      }
    } catch (error) {
      console.error("Error loading selection data:", error);
    }
  };

  if (!transcript && !isNew && !formData.transcript_id) {
    return <div className="flex items-center gap-2 font-semibold text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a transcript to view details or create a new transcript
    </div>;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Handle Submit
  ///////////////////////////////////////////////////////////////////////////////
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData as Transcript);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving transcript:", error);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // Handle Change
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
  // Handle Cancel
  ///////////////////////////////////////////////////////////////////////////////
  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // Render
  ///////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Header section: Cancel, Delete, Save buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-between mb-4">
          {isNew && (
            <h2 className="text-xl font-semibold">New Transcript</h2>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleCancel}>
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
      )}

      {/* Transcript details section */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="transcript_id" className="text-muted-foreground/70">Transcript ID</Label>
            <Input
              id="transcript_id"
              name="transcript_id"
              value={formData.transcript_id || ""}
              disabled
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="transcript_type" className="text-muted-foreground/70">Type</Label>
            <Select
              value={formData.transcript_type || "interview"}
              onValueChange={(value: TranscriptType) => {
                setFormData({ ...formData, transcript_type: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Document</Label>
            <SelectDialog
              title="Select Document"
              items={documents}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, doc_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                  <span className="truncate">
                    {formData.doc_id ? 
                      documents.find(d => d.id === formData.doc_id)?.title || "Select Document" :
                      "Select Document"
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
        </div>

        <div className="space-y-1">
            <Label htmlFor="transcript_title" className="text-muted-foreground/70">Title</Label>
            <Input
              id="transcript_title"
              name="transcript_title"
              placeholder="Enter Transcript Title"
              value={formData.transcript_title || ""}
              onChange={handleChange}
              disabled={isReadOnly}
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
                topic_tags: e.target.value.split(",").map((tag) => tag.trim()),
              });
              setHasChanges(true);
            }}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="transcript_model" className="text-muted-foreground/70">Model</Label>
          <Input
            id="transcript_model"
            name="transcript_model"
            value={formData.transcript_model || ""}
            onChange={handleChange}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="transcript_text" className="text-muted-foreground/70">Generated Transcript Text</Label>
            {!isReadOnly && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_editable"
                  checked={isEditable}
                  onCheckedChange={setIsEditable}
                />
                <Label htmlFor="is_editable" className="text-sm text-muted-foreground/70">Edit</Label>
              </div>
            )}
          </div>
          <Textarea
            id="transcript_text"
            name="transcript_text"
            value={formData.transcript_text || ""}
            onChange={handleChange}
            className={`min-h-[200px] font-mono text-sm ${!isEditable || isReadOnly ? "bg-muted text-foreground" : ""}`}
            disabled={!isEditable || isReadOnly}
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
              <Label htmlFor="is_active" className="text-muted-foreground/70">Active</Label>
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