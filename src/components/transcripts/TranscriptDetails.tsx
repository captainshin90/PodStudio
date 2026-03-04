import { useState, useEffect } from "react";
import { Transcript, TranscriptType } from "@/lib/schemas/transcripts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
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
import { documentsService, promptsService, modelsService } from "@/lib/services/database-service";
import { nanoid } from "nanoid";
import SelectDialog from "@/components/ui/select-dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";


///////////////////////////////////////////////////////////////////////////////
// TranscriptDetailsProps interface
///////////////////////////////////////////////////////////////////////////////
interface TranscriptDetailsProps {
  transcript: Transcript | null;
  onSave: (transcript: Transcript) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  isGenerated?: boolean;
  isReadOnly?: boolean;
  onRegenerateTranscript?: (
    transcript: Transcript, 
    progressCallback?: (progress: number, message: string) => void
  ) => Promise<void>;
  isGenerating?: boolean;
  setIsGenerating?: (isGenerating: boolean) => void;
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
  isGenerated = false,
  isReadOnly = false,
  onRegenerateTranscript,
  isGenerating = false,
  setIsGenerating
}: TranscriptDetailsProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Transcript>>(transcript || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [documents, setDocuments] = useState<Array<{ id: string; title: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string }>>([]);
  const [models, setModels] = useState<Array<{ id: string; title: string }>>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  
  ///////////////////////////////////////////////////////////////////////////////
  // Handle Transcript
  ///////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (transcript) {
      setFormData(transcript);
      // If this is a newly generated transcript (has id), treat it as a new record
      if (transcript.id && isGenerated) { // new generated transcript
        setHasChanges(true);
        setIsEditable(true);
      } else {  // existing transcript record
        setHasChanges(false);
        setIsEditable(false);
      }
    } else if (isNew) { // new blank transcript
      setFormData({
        id: "tra_" + nanoid(20),
        transcript_title: "",
        transcript_type: "interview",
        topic_tags: [],
        // transcript_model: "",
        // transcript_model_name: "",
        transcript_text: "",
        is_active: true,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      });
      setHasChanges(true);
      setIsEditable(true);
    } else { // no transcript
      setFormData({});
      setHasChanges(false);
      setIsEditable(false);
     }
  }, [transcript, isNew, isGenerated]);

  useEffect(() => {
    loadSelectionData();
  }, []);

  ///////////////////////////////////////////////////////////////////////////////
  // Handle Before Unload and Visibility Change
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
  // Handle Visibility Change
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
  // Load Selection Data
  ///////////////////////////////////////////////////////////////////////////////
  const loadSelectionData = async () => {
    try {
      const [loadedDocuments, loadedPrompts, loadedModels] = await Promise.all([
        documentsService.getAllDocuments(),
        promptsService.getAllPrompts(),
        modelsService.getAllModels()
      ]);

      if (loadedDocuments) {
        setDocuments(loadedDocuments
          .filter(d => d.is_active && !d.is_deleted)
          .map(d => ({ id: d.id, title: d.doc_name })));
      }
      if (loadedPrompts) {
        setPrompts(loadedPrompts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.id, title: p.prompt_name })));
      }
      if (loadedModels) {
        setModels(loadedModels
          .filter(m => m.is_active && !m.is_deleted && m.model_type === 'LLM')
          .map(m => ({ id: m.id, title: m.model_title })));
      }
    } catch (error) {
      console.error("Error loading selection data:", error);
    }
  };

  if (!transcript && !isNew && !formData.id) {
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
    setIsLoading(true);
    try {
      await onSave(formData as Transcript);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving transcript:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

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
  // Handle Update Transcript
  ///////////////////////////////////////////////////////////////////////////////
  const handleRegenerateTranscript = async () => {
    if (!transcript || !onRegenerateTranscript) return;

    if (setIsGenerating) {
      setIsGenerating(true);
    }
    setProgress(0);
    setStatusMessage("Starting transcript update...");

    try {
      await onRegenerateTranscript(transcript, (progress, message) => {
        setProgress(progress);
        setStatusMessage(message);
      });

      // Refresh the transcript data
      // const updatedTranscript = await transcriptsService.getTranscriptById(transcript.id);
      // if (updatedTranscript) {
      //   setFormData(updatedTranscript);
      // }
    } catch (error) {
      console.error("Error updating transcript:", error);
      if (toast) {
        toast({
          title: "Error",
          description: "Failed to update transcript",
          variant: "destructive",
        });
      }
    } finally {
      if (setIsGenerating) {
        setIsGenerating(false);
      }
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // Render
  ///////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Header section: Update, Cancel, Delete, Save buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {isNew && (
              <h2 className="text-xl font-semibold">New Transcript</h2>
            )}
            {!isNew && transcript && (
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="default"
                  disabled={ !hasChanges || isGenerating || !formData.doc_id || !formData.prompt_id || !formData.model_id}
                  onClick={handleRegenerateTranscript}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating Transcript...
                    </>
                  ) : (
                    "Update Generated Transcript"
                  )}
                </Button>
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">
                      {statusMessage || `Updating transcript... ${Math.round(progress)}%`}
                    </p>
                  </div>
                )}
            </div>
            )}
          </div>
          {!isReadOnly && !isGenerating && (
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
              <Button type="submit" disabled={!hasChanges && !isNew}>  
                {transcript ? "Save Changes" : "Save Transcript"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Transcript details section */}
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 flex items-center gap-2">
            <Label htmlFor="id" className="text-muted-foreground/70 whitespace-nowrap">Transcript ID:</Label>
            <Input
              id="id"
              name="id"
              value={formData.id || ""}
              disabled
              className="flex-1"
            />
          </div>
          <div className="col-span-2 flex items-center gap-2 justify-end">
            <Label htmlFor="transcript_type" className="text-muted-foreground/70 whitespace-nowrap">Type:</Label>
            <Select
              value={formData.transcript_type || "interview"}
              onValueChange={(value: TranscriptType) => {
                setFormData({ ...formData, transcript_type: value });
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger className="w-48">
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground/70">LLM Model</Label>
            <SelectDialog
              title="Select Model"
              items={models}
              onSelect={(id) => {
                setFormData(prev => ({ ...prev, model_id: id }));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                  <span className="truncate">
                    {formData.model_id ? 
                      models.find(m => m.id === formData.model_id)?.title || "Select Model" :
                      "Select Model"
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
            onKeyDown={(e) => {
              // Prevent form from capturing arrow keys when editing the textarea
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.stopPropagation();
              }
            }}
          />
        </div>

        {!isReadOnly && (
          <div className="space-y-3">
            <div className="border-t border-zinc-200 my-4"></div>
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

            <div className="flex items-center space-x-2">
              <Label className="text-muted-foreground/70">Created:</Label>
              <span className="text-sm text-muted-foreground/70">
                {formData.created_at 
                  ? (formData.created_at instanceof Date 
                      ? formData.created_at.toLocaleString() 
                      : typeof formData.created_at === 'object' && 'seconds' in formData.created_at
                        ? new Date((formData.created_at as any).seconds * 1000).toLocaleString()
                        : new Date(formData.created_at as any).toLocaleString())
                  : ""}
              </span>
              <Label className="text-muted-foreground/70 pl-2">Updated:</Label>
              <span className="text-sm text-muted-foreground/70">
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