import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Prompt } from "@/lib/schemas/prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, X } from "lucide-react";
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
  TTSModel,
  ConversationStyle,
  DialogueStructure,
  EngagementTechnique,
  ttsVoiceDefaults,
  conversationStyles,
  dialogueStructures,
  engagementTechniques
} from '@/config/podcast-config';


const formSchema = z.object({
  is_long_form: z.boolean().default(false),
  word_count: z.number().min(100).max(10000).default(250),
  creativity: z.number().min(0).max(1),
  roles_person1: z.string(),
  roles_person2: z.string(),
  conversation_style: z.array(z.string()),
  dialogue_structure: z.array(z.string()),
  engagement_techniques: z.array(z.string()),
  tts_model: z.string(),
  voice_question: z.string(),
  voice_answer: z.string(),
  voice_model: z.string(),
  ending_message: z.string(),
});

interface PromptDetailsProps {
  prompt: Prompt | null;
  onSave: (prompt: Prompt) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
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
}: PromptDetailsProps) {
  const [formData, setFormData] = useState<Partial<Prompt>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_long_form: false,
      word_count: 250,
      creativity: 0.7,
      roles_person1: "Interviewer",
      roles_person2: "Subject matter expert",
      conversation_style: ["Engaging", "Fast-paced", "Enthusiastic"],
      dialogue_structure: ["Discussions"],
      engagement_techniques: ["Questions"],
      tts_model: "gemini",
      voice_question: ttsVoiceDefaults.gemini.question,
      voice_answer: ttsVoiceDefaults.gemini.answer,
      voice_model: ttsVoiceDefaults.gemini.model,
      ending_message: "Thank you for listening to this episode.",
    },
  });

  useEffect(() => {
    if (prompt) {
      setFormData(prompt);
      setHasChanges(false);
    } else if (isNew) {
      setFormData({
       // id: crypto.randomUUID(),
        prompt_id: crypto.randomUUID(),
        prompt_name: "Enter Prompt Name",
        prompt_desc: "Enter Prompt Description",
        prompt_text: "Enter Prompt Text",
        is_long_form: false,
        word_count: 250,
        creativity: 0.7,
        roles_person1: "Interviewer",
        roles_person2: "Subject matter expert",
        conversation_style: ["Engaging", "Fast-paced", "Enthusiastic"],
        dialogue_structure: ["Discussions"], 
        engagement_techniques: ["Questions"],
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
    return <div className="flex items-center gap-2 text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      Select a prompt to view details or create a new prompt
    </div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData as Prompt);
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


// Convert the constant arrays to state so we can add to them
const [customConversationStyles, setCustomConversationStyles] =
useState<ConversationStyle[]>(conversationStyles);
const [customDialogueStructures, setCustomDialogueStructures] =
useState<DialogueStructure[]>(dialogueStructures);
const [customEngagementTechniques, setCustomEngagementTechniques] =
useState<EngagementTechnique[]>(engagementTechniques);


  //////////////////////////////////////////////////////////////////////////////
  // return the prompt details component
  //////////////////////////////////////////////////////////////////////////////
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header section: Cancel, Delete, Save buttons */}
      <div className="flex items-center justify-between mb-4">
        {isNew && (
          <h2 className="text-xl font-semibold">New Prompt</h2>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
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

      {/* Prompt details section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt_id">Prompt ID</Label>
          <Input
            id="prompt_id"
            name="prompt_id"
            value={formData.prompt_id || ""}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt_name">Name</Label>
          <Input
            id="prompt_name"
            name="prompt_name"
            value={formData.prompt_name || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt_desc">Description</Label>
          <Textarea
            id="prompt_desc"
            name="prompt_desc"
            value={formData.prompt_desc || ""}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt_text">Prompt Instructions</Label>
          <Textarea
            id="prompt_text"
            name="prompt_text"
            value={formData.prompt_text || ""}
            onChange={handleChange}
            className="min-h-[200px]"
          />
        </div>

        {/* Prompt customization settings section */}
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-4">
                <Switch
                  id="long-form"
                  checked={form.watch("is_long_form")}
                  onCheckedChange={(checked) =>
                    form.setValue("is_long_form", checked)
                  }
                />
                <Label htmlFor="long-form">Long-form Content</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="word_count">Word Count</Label>
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
                    defaultValue={250}
                    className="w-30"
                    value={form.watch("word_count")}
                    {...form.register("word_count", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Creativity Level ({form.watch("creativity")})
                  </Label>
                  <Slider
                    value={[form.watch("creativity")]}
                    onValueChange={([value]) =>
                      form.setValue("creativity", value)
                    }
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Interviewer Role</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Define the role of the first speaker (e.g.,
                            Host, Moderator, Journalist)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input {...form.register("roles_person1")} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Expert Role</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Define the role of the second speaker (e.g.,
                            Guest Expert, Specialist, Researcher)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input {...form.register("roles_person2")} />
                </div>
              </div>

            <div className="space-y-2">
              <Label>Conversation Style</Label>
              <div className="flex flex-wrap gap-2">
                {customConversationStyles.map((style) => (
                  <Badge
                    key={style}
                    variant={
                      form.watch("conversation_style").includes(style)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      const current = form.watch("conversation_style");
                      if (current.includes(style)) {
                        form.setValue(
                          "conversation_style",
                          current.filter((s) => s !== style)
                        );
                      } else {
                        form.setValue("conversation_style", [
                          ...current,
                          style,
                        ]);
                      }
                    }}
                  >
                    {style}
                  </Badge>
                ))}
                <AddCustomValue
                  onAdd={(value) => {
                    setCustomConversationStyles((prev) => [
                      ...prev,
                      value as ConversationStyle,
                    ]);
                    const current = form.watch("conversation_style");
                    if (!current.includes(value)) {
                      form.setValue("conversation_style", [
                        ...current,
                        value,
                      ]);
                    }
                  }}
                  placeholder="Enter custom style"
                />
              </div>
            </div>

          <div className="space-y-2">
            <Label>Dialogue Structure</Label>
            <div className="flex flex-wrap gap-2">
              {customDialogueStructures.map((structure) => (
                <Badge
                  key={structure}
                  variant={
                    form
                      .watch("dialogue_structure")
                      .includes(structure)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    const current = form.watch("dialogue_structure");
                    if (current.includes(structure)) {
                      form.setValue(
                        "dialogue_structure",
                        current.filter((s) => s !== structure)
                      );
                    } else {
                      form.setValue("dialogue_structure", [
                        ...current,
                        structure,
                      ]);
                    }
                  }}
                >
                  {structure}
                </Badge>
              ))}
              <AddCustomValue
                onAdd={(value) => {
                  setCustomDialogueStructures((prev) => [
                    ...prev,
                    value as DialogueStructure,
                  ]);
                  const current = form.watch("dialogue_structure");
                  if (!current.includes(value)) {
                    form.setValue("dialogue_structure", [
                      ...current,
                      value,
                    ]);
                  }
                }}
                placeholder="Enter custom structure"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Engagement Techniques</Label>
            <div className="flex flex-wrap gap-2">
              {customEngagementTechniques.map((technique) => (
                <Badge
                  key={technique}
                  variant={
                    form
                      .watch("engagement_techniques")
                      .includes(technique)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    const current = form.watch(
                      "engagement_techniques"
                    );
                    if (current.includes(technique)) {
                      form.setValue(
                        "engagement_techniques",
                        current.filter((t) => t !== technique)
                      );
                    } else {
                      form.setValue("engagement_techniques", [
                        ...current,
                        technique,
                      ]);
                    }
                  }}
                >
                  {technique}
                </Badge>
              ))}
              <AddCustomValue
                onAdd={(value) => {
                  setCustomEngagementTechniques((prev) => [
                    ...prev,
                    value as EngagementTechnique,
                  ]);
                  const current = form.watch("engagement_techniques");
                  if (!current.includes(value)) {
                    form.setValue("engagement_techniques", [
                      ...current,
                      value,
                    ]);
                  }
                }}
                placeholder="Enter custom technique"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="ending_message">Ending Message</Label>
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
              {...form.register("ending_message")}
              placeholder="Enter the ending message for your podcast"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>Text-to-Speech Model</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-6 w-6 p-0"
                    >
                      <InfoCircledIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">
                        API Key Setup Instructions:
                      </p>
                      <p>
                        <strong>Google Gemini:</strong>
                      </p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Go to Google Cloud Console</li>
                        <li>
                          Enable both "Vertex AI API" and "Cloud
                          Text-to-Speech API"
                        </li>
                        <li>
                          Create an API key with access to these APIs
                        </li>
                        <li>
                          Add Cloud Text-to-Speech API permission to
                          the key
                        </li>
                      </ol>
                      <p>
                        <strong>OpenAI:</strong> Get your API key from
                        OpenAI dashboard
                      </p>
                      <p>
                        <strong>ElevenLabs:</strong> Get your API key
                        from ElevenLabs dashboard
                      </p>
                      <p>
                        <strong>Edge TTS:</strong> No API key required
                        - free to use
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={form.watch("tts_model")}
              onValueChange={(value: TTSModel) =>
                form.setValue("tts_model", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select TTS model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">
                  Google Gemini
                </SelectItem>
                <SelectItem value="geminimulti">
                  Google Gemini Live Multi-Speaker English-only
                </SelectItem>
                <SelectItem value="edge">
                  Microsoft Edge TTS
                </SelectItem>
                <SelectItem value="openai">
                  OpenAI TTS
                </SelectItem>
                <SelectItem value="elevenlabs">
                  ElevenLabs
                </SelectItem>
                <SelectItem value="hume">
                  Hume AI
                </SelectItem>
                <SelectItem value="playht">
                  Play HT
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Question Voice</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {form.watch("tts_model").startsWith("gemini") ? (
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
                  {...form.register("voice_question")}
                  placeholder="Voice for questions"
                />
              </div>
              <div className="space-y-2">
                <Label>Answer Voice</Label>
                <Input
                  {...form.register("voice_answer")}
                  placeholder="Voice for answers"
                />
              </div>
              <div className="space-y-2">
                <Label>Voice Model</Label>
                <Input
                  {...form.register("voice_model")}
                  placeholder="Voice model"
                />
              </div>
            </div>
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