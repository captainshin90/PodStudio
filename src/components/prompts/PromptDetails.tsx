import { useState, useEffect, useRef } from "react";
import { Prompt } from "@/lib/schemas/prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TTSModel,
  ConversationStyle,
  DialogueStructure,
  EngagementTechnique,
  ttsVoiceDefaults,
  conversationStyles,
  dialogueStructures,
  engagementTechniques,
  LLMModel
} from '@/config/podcast-config';

interface PromptDetailsProps {
  prompt: Prompt | null;
  onSave: (prompt: Prompt) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  isReadOnly?: boolean;
}

// AddCustomValue component
// This component allows the user to add a custom value to the prompt
// It uses the useEffect hook to focus on the input field when the component is added to the DOM
// It also uses the useState hook to manage the state of the input field
// It also uses the useRef hook to manage the ref of the input field

const AddCustomValue = ({
  onAdd,
  placeholder,
}: {
  onAdd: (value: string) => void;
  placeholder: string;
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
      setIsAdding(false);
    }
  };

  return isAdding ? (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") setIsAdding(false);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <Badge
      variant="outline"
      className="cursor-pointer"
      onClick={() => setIsAdding(true)}
    >
      + Add Custom
    </Badge>
  );
};

/////////////////////////////////////////////////////////////////////////////// 
// PromptDetails component
/////////////////////////////////////////////////////////////////////////////// 

export default function PromptDetails({
  prompt,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
  isReadOnly = false
}: PromptDetailsProps) {
  const [formData, setFormData] = useState<Partial<Prompt>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [customConversationStyles, setCustomConversationStyles] = useState<ConversationStyle[]>(conversationStyles);
  const [customDialogueStructures, setCustomDialogueStructures] = useState<DialogueStructure[]>(dialogueStructures);
  const [customEngagementTechniques, setCustomEngagementTechniques] = useState<EngagementTechnique[]>(engagementTechniques);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (prompt) {
      setFormData(prompt);
      setHasChanges(false);
    } else if (isNew) {
      setFormData({
        prompt_id: crypto.randomUUID(),
        prompt_name: "",
        prompt_desc: "",
        prompt_text: "",
        is_long_form: false,
        word_count: 250,
        creativity: 0.7,
        roles_person1: "Interviewer",
        roles_person2: "Subject matter expert",
        conversation_style: ["Engaging", "Fast-paced", "Enthusiastic"],
        dialogue_structure: ["Discussions"], 
        engagement_techniques: ["Questions"],
        llm_model: "gemini",
        tts_model: "gemini",
        voice_question: ttsVoiceDefaults.gemini.question,
        voice_answer: ttsVoiceDefaults.gemini.answer,
        voice_model: ttsVoiceDefaults.gemini.model,
        ending_message: "Thank you for listening to this episode.",
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
  }, [prompt, isNew]);

  if (!prompt && !isNew && !formData.prompt_id) {
    return <div className="flex items-center gap-2 font-semibold text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a prompt to view details or create a new prompt
    </div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as Prompt);
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

  //////////////////////////////////////////////////////////////////////////////
  // return the prompt details component
  //////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Header section: Cancel, Delete, Save buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-between mb-4">
          {isNew && (
            <h2 className="text-xl font-semibold">New Prompt</h2>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {prompt && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
            <Button type="submit" disabled={!hasChanges}>
              {prompt ? "Save Changes" : "Save Prompt"}
            </Button>
          </div>
        </div>
      )}

      {/* Prompt details section */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="prompt_id" className="text-muted-foreground/70">Prompt ID</Label>
          <Input
            id="prompt_id"
            name="prompt_id"
            value={formData.prompt_id || ""}
            disabled
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prompt_name" className="text-muted-foreground/70">Name</Label>
          <Input
            id="prompt_name"
            name="prompt_name"
            placeholder="Enter Prompt Name"
            value={formData.prompt_name || ""}
            onChange={handleChange}
            required
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prompt_desc" className="text-muted-foreground/70">Description</Label>
          <Textarea
            id="prompt_desc"
            name="prompt_desc"
            placeholder="Enter Prompt Description"
            value={formData.prompt_desc || ""}
            onChange={handleChange}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="prompt_text" className="text-muted-foreground/70">Prompt Instructions</Label>
          <Textarea
            id="prompt_text"
            name="prompt_text"
            placeholder="Enter Prompt Instructions"
            value={formData.prompt_text || ""}
            onChange={handleChange}
            className="min-h-[200px] font-mono text-sm"
            disabled={isReadOnly}
          />
        </div>

        {/* Prompt customization settings section */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-4">
              <Switch
                id="long-form"
                disabled={isReadOnly}
                checked={formData.is_long_form || false}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, is_long_form: checked });
                  setHasChanges(true);
                }}
              />
              <Label htmlFor="long-form" className="text-muted-foreground/70">Long-form Content</Label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="word_count" className="text-muted-foreground/70">Word Count</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Target number of words for the generated podcast (100-10000)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="word_count"
                type="number"
                min={100}
                max={10000}
                step={10}
                className="w-30"
                value={formData.word_count || 250}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-1">
              <Label>
                Creativity Level ({formData.creativity})
              </Label>
              <Slider
                value={[formData.creativity || 0.7]}
                onValueChange={([value]) => {
                  setFormData({ ...formData, creativity: value });
                  setHasChanges(true);
                }}
                max={1}
                step={0.1}
                className="w-full"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground/70">Interviewer Role</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Define the role of the first speaker (e.g., Host, Moderator, Journalist)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input 
                id="roles_person1"
                name="roles_person1"
                value={formData.roles_person1 || ""}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground/70">Expert Role</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Define the role of the second speaker (e.g., Guest Expert, Specialist, Researcher)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input 
                id="roles_person2" 
                name="roles_person2" 
                value={formData.roles_person2 || ""} 
                onChange={handleChange}
                disabled={isReadOnly}
                />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Conversation Style</Label>
            <div className="flex flex-wrap gap-2">
              {customConversationStyles.map((style) => (
                <Badge
                  key={style}
                  variant={
                    formData.conversation_style?.includes(style)
                      ? "secondary"
                      : "outline"
                  }
                  className={`cursor-pointer ${!formData.conversation_style?.includes(style) ? "text-muted-foreground/70" : ""}`}
                  onClick={() => {
                    const current = formData.conversation_style || [];
                    if (current.includes(style)) {
                      setFormData({
                        ...formData,
                        conversation_style: current.filter((s) => s !== style)
                      });
                      setHasChanges(true);
                    } else {
                      setFormData({
                        ...formData,
                        conversation_style: [...current, style],
                      });
                      setHasChanges(true);
                    }
                  }}
                >
                  {style}
                </Badge>
              ))}
              <AddCustomValue
                onAdd={(value) => {
                  setCustomConversationStyles((prev) => [...prev, value as ConversationStyle]);
                  const current = formData.conversation_style || [];
                  if (!current.includes(value)) {
                    setFormData({
                      ...formData,
                      conversation_style: [...current, value],
                      });
                    setHasChanges(true);
                  }
                }}
                placeholder="Enter custom style"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Dialogue Structure</Label>
            <div className="flex flex-wrap gap-2">
              {customDialogueStructures.map((structure) => (
                <Badge
                  key={structure}
                  variant={
                    formData.dialogue_structure?.includes(structure)
                      ? "secondary"
                      : "outline"
                  }
                  className={`cursor-pointer ${!formData.dialogue_structure?.includes(structure) ? "text-muted-foreground/70" : ""}`}
                  onClick={() => {
                    const current = formData.dialogue_structure || [];
                    if (current.includes(structure)) {
                      setFormData({
                        ...formData,
                        dialogue_structure: current.filter((s) => s !== structure)
                      });
                      setHasChanges(true);
                    } else {
                      setFormData({
                        ...formData,
                        dialogue_structure: [...current, structure],
                      });
                      setHasChanges(true);
                    }
                  }}
                >
                  {structure}
                </Badge>
              ))}
              <AddCustomValue
                onAdd={(value) => {
                  setCustomDialogueStructures((prev) => [...prev, value as DialogueStructure]);
                  const current = formData.dialogue_structure || [];
                  if (!current.includes(value)) {
                    setFormData({
                      ...formData,
                      dialogue_structure: [...current, value],
                    });
                    setHasChanges(true);
                  }
                }}
                placeholder="Enter custom structure"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground/70">Engagement Techniques</Label>
            <div className="flex flex-wrap gap-2">
              {customEngagementTechniques.map((technique) => (
                <Badge
                  key={technique}
                  variant={
                    formData.engagement_techniques?.includes(technique)
                      ? "secondary"
                      : "outline"
                  }
                  className={`cursor-pointer ${!formData.engagement_techniques?.includes(technique) ? "text-muted-foreground/70" : ""}`}
                  onClick={() => {
                    const current = formData.engagement_techniques || [];
                    if (current.includes(technique)) {
                      setFormData({
                        ...formData,
                        engagement_techniques: current.filter((t) => t !== technique)
                      });
                      setHasChanges(true);
                    } else {
                      setFormData({
                        ...formData,
                        engagement_techniques: [...current, technique],
                      });
                      setHasChanges(true);
                    }
                  }}
                >
                  {technique}
                </Badge>
              ))}
              <AddCustomValue
                onAdd={(value) => {
                  setCustomEngagementTechniques((prev) => [...prev, value as EngagementTechnique]);
                  const current = formData.engagement_techniques || [];
                  if (!current.includes(value)) {
                    setFormData({
                      ...formData,
                      engagement_techniques: [...current, value],
                    });
                    setHasChanges(true);
                  }
                }}
                placeholder="Enter custom technique"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="ending_message" className="text-muted-foreground/70">Ending Message</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The message that will be played at the end of the podcast
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="ending_message"
              name="ending_message"
              value={formData.ending_message || ""}
              onChange={handleChange}
              placeholder="Enter the ending message for your podcast"
              disabled={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground/70">LLM Model</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">API Key Setup Instructions:</p>
                        <p><strong>Google Gemini:</strong></p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Go to Google Cloud Console</li>
                          <li>Create an API key with access to these APIs</li>
                        </ol>
                        <p><strong>OpenAI: </strong>Get your API key from OpenAI dashboard</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.llm_model}
                onValueChange={(value: LLMModel) => {
                  setFormData({ ...formData, llm_model: value });
                  setHasChanges(true);
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select LLM model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="edge">Microsoft Edge TTS</SelectItem>
                  <SelectItem value="openai">OpenAI TTS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground/70">Text-to-Speech Model</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">API Key Setup Instructions:</p>
                        <p><strong>Google Gemini:</strong></p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Go to Google Cloud Console</li>
                          <li>Enable both "Vertex AI API" and "Cloud Text-to-Speech API"</li>
                          <li>Create an API key with access to these APIs</li>
                          <li>Add Cloud Text-to-Speech API permission to the key</li>
                        </ol>
                        <p><strong>OpenAI: </strong>Get your API key from OpenAI dashboard</p>
                        <p><strong>ElevenLabs: </strong>Get your API key from ElevenLabs dashboard</p>
                        <p><strong>Edge TTS: </strong>No API key required - free to use</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={formData.tts_model}
                onValueChange={(value: TTSModel) => {
                  setFormData({ ...formData, tts_model: value });
                  setHasChanges(true);
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select TTS model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="geminimulti">Google Gemini Live Multi-Speaker English-only</SelectItem>
                  <SelectItem value="edge">Microsoft Edge TTS</SelectItem>
                  <SelectItem value="openai">OpenAI TTS</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  <SelectItem value="hume">Hume AI</SelectItem>
                  <SelectItem value="playht">Play HT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 space-y-0">
                  <Label className="text-muted-foreground/70">Question Voice</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {formData.tts_model?.startsWith("gemini") ? (
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
                  value={formData.voice_question || ""}
                  onChange={handleChange}
                  placeholder="Voice for questions"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-0">
                <Label className="text-muted-foreground/70">Answer Voice</Label>
                <Input
                  id="voice_answer"
                  name="voice_answer"
                  value={formData.voice_answer || ""}
                  onChange={handleChange}
                  placeholder="Voice for answers"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-0">
                <Label className="text-muted-foreground/70">Voice Model</Label>
                <Input
                  id="voice_model"
                  name="voice_model"
                  value={formData.voice_model || ""}
                  onChange={handleChange}
                  placeholder="Voice model"
                  disabled={isReadOnly}
                />
              </div>
            </div>
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
                checked={formData.is_deleted}
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