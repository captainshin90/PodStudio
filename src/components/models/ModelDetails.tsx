import { useState, useEffect } from "react";
import { Model } from "@/lib/schemas/models";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { nanoid } from "nanoid";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogTitle,
    AlertDialogHeader,
    AlertDialogFooter
} from "@/components/ui/alert-dialog";


///////////////////////////////////////////////////////////////////////////////
// ModelDetails component
///////////////////////////////////////////////////////////////////////////////

interface ModelDetailsProps {
  model: Model | null;
  onSave: (model: Model) => void;
  onDelete?: () => void;
  onCancel: () => void;
  isNew?: boolean;
  isReadOnly?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// ModelDetails component
///////////////////////////////////////////////////////////////////////////////

export default function ModelDetails({
  model,
  onSave,
  onDelete,
  onCancel,
  isNew = false,
  isReadOnly = false
}: ModelDetailsProps) {
  const [formData, setFormData] = useState<Partial<Model>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData(model);
      setHasChanges(false);
    } else if (isNew) {
      setFormData({
        id: "model_" + nanoid(20),
        model_name: "",
        model_desc: "",
        model_type: "",
        model_provider: "",
        model_url: "",
        top_k: 40,
        top_p: 0.95,
        temperature: 0.7,
        max_tokens: 1000,
        repetition_penalty: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stop_sequences: [],
        voice_question: "",
        voice_answer: "",
        voice_model: "",
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
  }, [model, isNew]);

  if (!model && !isNew && !formData.id) {
    return <div className="flex items-center gap-2 font-semibold text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a model to view details or create a new model
    </div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as Model);
    setHasChanges(false);
  };

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

  const handleCancel = () => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // return the model details component
  ///////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Header section: Cancel, Delete, Save buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-between mb-4">
          {isNew && (
            <h2 className="text-xl font-semibold">New Model</h2>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {model && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={!hasChanges}>
              {model ? "Save Changes" : "Save Model"}
            </Button>
          </div>
        </div>
      )}

      {/* Model details section */}
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 flex items-center gap-2">
            <Label htmlFor="id" className="text-muted-foreground/70 whitespace-nowrap">Model ID:</Label>
            <Input
              id="id"
              name="id"
              value={formData.id || ""}
              disabled
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="model_name" className="text-muted-foreground/70">Name</Label>
          <Input
            id="model_name"
            name="model_name"
            placeholder="Enter Model Name"
            value={formData.model_name || ""}
            onChange={handleChange}
            required
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="model_desc" className="text-muted-foreground/70">Description</Label>
          <Textarea
            id="model_desc"
            name="model_desc"
            placeholder="Enter Model Description"
            value={formData.model_desc || ""}
            onChange={handleChange}
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="model_type" className="text-muted-foreground/70">Model Type</Label>
            <Input
              id="model_type"
              name="model_type"
              placeholder="LLM, TTS, STT, etc."
              value={formData.model_type || ""}
              onChange={handleChange}
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="model_provider" className="text-muted-foreground/70">Provider</Label>
            <Input
              id="model_provider"
              name="model_provider"
              placeholder="OpenAI, Google, etc."
              value={formData.model_provider || ""}
              onChange={handleChange}
              required
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="model_url" className="text-muted-foreground/70">Model URL</Label>
          <Input
            id="model_url"
            name="model_url"
            placeholder="Enter Model URL"
            value={formData.model_url || ""}
            onChange={handleChange}
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="top_k" className="text-muted-foreground/70">Top K</Label>
            <Input
              id="top_k"
              name="top_k"
              type="number"
              min={1}
              max={100}
              value={formData.top_k || 40}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="top_p" className="text-muted-foreground/70">Top P</Label>
            <Input
              id="top_p"
              name="top_p"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={formData.top_p || 0.95}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="temperature" className="text-muted-foreground/70">Temperature</Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={formData.temperature || 0.7}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="max_tokens" className="text-muted-foreground/70">Max Tokens</Label>
            <Input
              id="max_tokens"
              name="max_tokens"
              type="number"
              min={1}
              max={32000}
              value={formData.max_tokens || 1000}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="repetition_penalty" className="text-muted-foreground/70">Repetition Penalty</Label>
            <Input
              id="repetition_penalty"
              name="repetition_penalty"
              type="number"
              min={1}
              max={2}
              step={0.1}
              value={formData.repetition_penalty || 1.0}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="frequency_penalty" className="text-muted-foreground/70">Frequency Penalty</Label>
            <Input
              id="frequency_penalty"
              name="frequency_penalty"
              type="number"
              min={-2}
              max={2}
              step={0.1}
              value={formData.frequency_penalty || 0.0}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="presence_penalty" className="text-muted-foreground/70">Presence Penalty</Label>
            <Input
              id="presence_penalty"
              name="presence_penalty"
              type="number"
              min={-2}
              max={2}
              step={0.1}
              value={formData.presence_penalty || 0.0}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="voice_question" className="text-muted-foreground/70">Question Voice</Label>
            <Input
              id="voice_question"
              name="voice_question"
              placeholder="Voice for questions"
              value={formData.voice_question || ""}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="voice_answer" className="text-muted-foreground/70">Answer Voice</Label>
            <Input
              id="voice_answer"
              name="voice_answer"
              placeholder="Voice for answers"
              value={formData.voice_answer || ""}
              onChange={handleChange}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="voice_model" className="text-muted-foreground/70">Voice Model</Label>
            <Input
              id="voice_model"
              name="voice_model"
              placeholder="Voice model"
              value={formData.voice_model || ""}
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
              />
              <Label htmlFor="is_active" className="text-muted-foreground/70">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_deleted"
                checked={formData.is_deleted || false}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, is_deleted: checked });
                  setHasChanges(true);
                }}
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