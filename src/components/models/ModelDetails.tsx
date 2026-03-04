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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
// import { ttsVoiceDefaults } from "@/config/podcast-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoCircledIcon } from "@radix-ui/react-icons";


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

  // Define the provider options
  const providerOptions = [
    { id: "gemini", type: "LLM", title: "Google Gemini", question: "en-US-Standard-A", answer: "en-US-Standard-C", model: "gemini-1.5-pro-latest" },
    { id: "geminimulti", type: "LLM", title: "Google Gemini Multi", question: "R", answer: "S", model: "en-US-Studio-MultiSpeaker" },
    { id: "edge", type: "LLM", title: "Microsoft Edge", question: "en-US-JennyNeural", answer: "en-US-EricNeural", model: "" },
    { id: "openai", type: "LLM", title: "OpenAI", question: "echo", answer: "shimmer", model: "tts-1-hd" },
    { id: "deepseek", type: "LLM", title: "DeepSeek", question: "default", answer: "default", model: "default" },
    { id: "anthropic", type: "LLM", title: "Anthropic", question: "default", answer: "default", model: "default" },
    { id: "xai", type: "LLM", title: "xAI", question: "default", answer: "default", model: "default" },
    { id: "elevenlabs", type: "TTS", title: "ElevenLabs", question: "Chris", answer: "Jessica", model: "eleven_multilingual_v2" },
    { id: "hume", type: "TTS", title: "Hume AI", question: "default", answer: "default", model: "default" },
    { id: "playai", type: "TTS", title: "Play.ai", question: "default", answer: "default", model: "default" },
  ];

  // Define the model type options
  const modelTypeOptions = [
    { value: "LLM", label: "Language Model" },
    { value: "TTS", label: "Text-to-Speech" },
    { value: "STT", label: "Speech-to-Text" },
    { value: "EXTRACT", label: "Text Extraction" }
  ];

  useEffect(() => {
    if (model) {
      setFormData(model);
      setHasChanges(false);
    } else if (isNew) {
      setFormData({
        id: "mod_" + nanoid(20),
        model_title: "",
        model_name: "",
        model_desc: "",
        model_type: "",
        model_provider: "",
        model_url: "",
        top_k: 40,
        top_p: 0.95,
        temperature: 0.7,
        max_tokens: 1000,
        repetition_penalty: 1.2,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
        stop_sequences: [],
        voice_question: providerOptions.find(provider => provider.id === formData.model_provider)?.question || "",
        voice_answer: providerOptions.find(provider => provider.id === formData.model_provider)?.answer || "",
        voice_model: providerOptions.find(provider => provider.id === formData.model_provider)?.model || "",
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
          <Label htmlFor="model_title" className="text-muted-foreground/70">Model Title</Label>
          <Input
            id="model_title"
            name="model_title"
            placeholder="Enter Model Title"
            value={formData.model_title || ""}
            onChange={handleChange}
            required
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Provider</Label>
            <Select
              value={formData.model_provider || ""}
              onValueChange={(value) => {
                // Find the selected provider
                const selectedProvider = providerOptions.find(provider => provider.id === value);
                
                // Update form data with provider and its default voice settings
                setFormData(prev => ({ 
                  ...prev, 
                  model_provider: value,
                  // Set default voice values if a provider is selected
                  ...(selectedProvider && {
                    voice_question: selectedProvider.question,
                    voice_answer: selectedProvider.answer,
                    voice_model: selectedProvider.model,
                    // Set the model type based on the provider's type
                    model_type: selectedProvider.type
                  })
                }));
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="model_type" className="text-muted-foreground/70">Model Type</Label>
            <Select
              value={formData.model_type || ""}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, model_type: value }));
                setHasChanges(true);
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Model Type" />
              </SelectTrigger>
              <SelectContent>
                {modelTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="model_name" className="text-muted-foreground/70">Model Name (e.g. gemini-1.5-pro)</Label>
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
        </div>

        <div className="border-t border-zinc-200 my-4 space-y-2"></div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="temperature" className="text-muted-foreground/70">Temperature</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                    <p>Controls randomness in the output. Higher values (e.g., 0.8) make the output more random, while lower values (e.g., 0.2) make it more focused and deterministic.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="max_tokens" className="text-muted-foreground/70">Max Tokens</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                    <p>The maximum number of tokens to generate in the response. One token is roughly 4 characters for English text.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="max_tokens"
              name="max_tokens"
              type="number"
              min={1}
              max={32000}
              value={formData.max_tokens || 1000}
              onChange={handleChange}
              disabled={isReadOnly}
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="top_k" className="text-muted-foreground/70">Top K</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                    <p>Top-k: Limits the model to consider only the top k most likely next tokens. Helps prevent the model from generating nonsensical text. Lower values make the output more focused, higher values allow more variety.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="top_k"
              name="top_k"
              type="number"
              min={1}
              max={100}
              value={formData.top_k || 40}
              onChange={handleChange}
              disabled={isReadOnly}
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="top_p" className="text-muted-foreground/70">Top P</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                    <p>Top-p (also called nucleus sampling): Similar to top-k but uses cumulative probability. Only considers tokens whose cumulative probability exceeds p. Helps maintain coherence while allowing some creativity.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
              className="w-24"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="repetition_penalty" className="text-muted-foreground/70">Repetition Penalty</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                    <p>Penalizes the model for repeating the same token multiple times. Higher values (e.g., 1.2) reduce repetition, while lower values (e.g., 1.0) allow more repetition.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="frequency_penalty" className="text-muted-foreground/70">Frequency Penalty</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                    <p>Reduces the likelihood of the model repeating the same token based on its frequency in the text so far. Higher values (e.g., 0.5) reduce repetition of frequent tokens.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
              className="w-24"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="presence_penalty" className="text-muted-foreground/70">Presence Penalty</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                    <p>Reduces the likelihood of the model repeating the same topic or concept. Higher values (e.g., 0.5) encourage the model to talk about new topics.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
              className="w-24"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 space-y-0">
            <Label htmlFor="voice_question" className="text-muted-foreground/70">Question Voice</Label>
            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                  <p className="max-w-xs">
                      {formData.model_name?.startsWith("gemini") ? (
                        <>
                          Select a voice from the{" "}
                          <a 
                            href="https://cloud.google.com/text-to-speech/docs/list-voices-and-types"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Google Cloud Text-to-Speech voices list
                          </a>
                        </>
                      ) : (
                        "Voice used for the interviewer's questions"
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>            
            <Input
              id="voice_question"
              name="voice_question"
              placeholder="Voice for questions"
              value={formData.voice_question || ""}
              onChange={handleChange}
              disabled={isReadOnly}
              className="mt-2"
            />
          </div>

          <div className="space-y-0">
            <Label htmlFor="voice_answer" className="text-muted-foreground/70">Answer Voice</Label>
            <Input
              id="voice_answer"
              name="voice_answer"
              placeholder="Voice for answers"
              value={formData.voice_answer || ""}
              onChange={handleChange}
              disabled={isReadOnly}
              className="mt-2"
            />
          </div>

          <div className="space-y-0">
            <Label htmlFor="voice_model" className="text-muted-foreground/70">Voice Model</Label>
            <Input
              id="voice_model"
              name="voice_model"
              placeholder="Voice model"
              value={formData.voice_model || ""}
              onChange={handleChange}
              disabled={isReadOnly}
              className="mt-2"
            />
          </div>
        </div>

        <div className="border-t border-zinc-200 my-4"></div>

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