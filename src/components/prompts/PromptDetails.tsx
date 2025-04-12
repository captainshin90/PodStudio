import { useState, useEffect, useRef } from "react";
import { Prompt } from "@/lib/schemas/prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, X, ChevronDown } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ConversationStyle,
  DialogueStructure,
  EngagementTechnique,
  conversationStyles,
  dialogueStructures,
  engagementTechniques,
} from '@/config/podcast-config';
import { nanoid } from "nanoid";
import { modelsService } from "@/lib/services/database-service";

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
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="relative">
            <div className="overflow-y-auto max-h-[300px] pr-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg hover:bg-muted cursor-pointer mb-2"
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <div className="font-medium truncate">{item.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [llmModels, setLlmModels] = useState<Array<{ id: string; title: string }>>([]);
  const [ttsModels, setTtsModels] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (prompt) {
      setFormData(prompt);
      setHasChanges(false);
    } else if (isNew) {
      setFormData({
        id: "prompt_" + nanoid(20),
        prompt_name: "",
        prompt_desc: "",
        prompt_text: "",
        is_long_form: false,
        word_count: 250,      // use as override for model max_tokens
        creativity: 0.7,      // use as override for model temperature
        roles_person1: "Interviewer",
        roles_person2: "Subject matter expert",
        conversation_style: ["Engaging", "Fast-paced", "Enthusiastic"],
        dialogue_structure: ["Discussions"], 
        engagement_techniques: ["Questions"],
        ending_message: "Thank you for listening to this episode.",
        llm_model_id: "",
        tts_model_id: "",
        // Chain of Thought prompting features
        use_chain_of_thought: true,
        cot_style: "Step-by-step",
        cot_instructions: "",
        cot_examples: [],
        cot_verification: false,
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

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const models = await modelsService.getAllModels();
      if (models) {
        const llms = models
          .filter(m => m.is_active && !m.is_deleted && m.model_type === 'LLM')
          .map(m => ({ id: m.id, title: m.model_name }));
        const tts = models
          .filter(m => m.is_active && !m.is_deleted && m.model_type === 'TTS')
          .map(m => ({ id: m.id, title: m.model_name }));
        setLlmModels(llms);
        setTtsModels(tts);
      }
    } catch (error) {
      console.error("Error loading models:", error);
    }
  };

  if (!prompt && !isNew && !formData.id) {
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
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 flex items-center gap-2">
            <Label htmlFor="id" className="text-muted-foreground/70 whitespace-nowrap">Prompt ID:</Label>
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
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.stopPropagation();
              }
            }}
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
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.stopPropagation();
              }
            }}
          />
        </div>

        <div className="border-t border-zinc-200 pt-2 my-4"></div>

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
                    <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
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
                    <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
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
                    <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground/70">Default LLM Model</Label>
              <SelectDialog
                title="Select LLM Model"
                items={llmModels}
                onSelect={(id) => {
                  setFormData(prev => ({ ...prev, llm_model_id: id }));
                  setHasChanges(true);
                }}
                trigger={
                  <Button variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                    <span className="truncate">
                      {formData.llm_model_id ? 
                        llmModels.find(m => m.id === formData.llm_model_id)?.title || "Select LLM Model" :
                        "Select LLM Model"
                      }
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground/70">Default TTS Model</Label>
              <SelectDialog
                title="Select TTS Model"
                items={ttsModels}
                onSelect={(id) => {
                  setFormData(prev => ({ ...prev, tts_model_id: id }));
                  setHasChanges(true);
                }}
                trigger={
                  <Button variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                    <span className="truncate">
                      {formData.tts_model_id ? 
                        ttsModels.find(m => m.id === formData.tts_model_id)?.title || "Select TTS Model" :
                        "Select TTS Model"
                      }
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                }
              />
            </div>
          </div>
          <div className="border-t border-zinc-200 pt-2 my-4"></div>
          {/* Chain of Thought Prompting Section */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Switch
                id="use_chain_of_thought"
                checked={formData.use_chain_of_thought || false}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, use_chain_of_thought: checked });
                  setHasChanges(true);
                }}
                disabled={isReadOnly}
              />
              <Label htmlFor="use_chain_of_thought" className="text-muted-foreground/70">Use Chain of Thought Prompting</Label>
            </div>
          </div>

          <div className="space-y-3 pt-2 mt-4">
            {formData.use_chain_of_thought && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cot_style" className="text-muted-foreground/70">Chain of Thought Style</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                          <p className="max-w-xs">
                            Different styles of Chain of Thought reasoning that can be applied to the prompt.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-[300px]">
                      <Select
                        value={formData.cot_style}
                        onValueChange={(value) => {
                          setFormData({ ...formData, cot_style: value });
                          setHasChanges(true);
                        }}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Chain of Thought style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Step-by-step">Step-by-step</SelectItem>
                          <SelectItem value="Tree of Thoughts">Tree of Thoughts</SelectItem>
                          <SelectItem value="Self-consistency">Self-consistency</SelectItem>
                          <SelectItem value="Least-to-Most">Least-to-Most</SelectItem>
                          <SelectItem value="Self-refine">Self-refine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="cot_verification"
                        checked={formData.cot_verification || false}
                        onCheckedChange={(checked) => {
                          setFormData({ ...formData, cot_verification: checked });
                          setHasChanges(true);
                        }}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor="cot_verification" className="text-muted-foreground/70">Verify Chain of Thought</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                            <p className="max-w-xs">
                              Have the model verify its own Chain of Thought reasoning for accuracy and consistency.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cot_instructions" className="text-muted-foreground/70">Chain of Thought Instructions</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                          <p className="max-w-xs">
                            Specific instructions for how the model should approach the Chain of Thought reasoning.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="cot_instructions"
                    name="cot_instructions"
                    placeholder="Enter Chain of Thought instructions"
                    value={formData.cot_instructions || ""}
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cot_examples" className="text-muted-foreground/70">Chain of Thought Examples</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-100 text-zinc-900 rounded-lg border-zinc-200 px-3 py-2 text-sm shadow-lg max-w-[25vw]">
                          <p className="max-w-xs">
                            Example Chain of Thought reasoning to guide the model's approach.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-2">
                    {(formData.cot_examples || []).map((example, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Textarea
                          value={example}
                          onChange={(e) => {
                            const newExamples = [...(formData.cot_examples || [])];
                            newExamples[index] = e.target.value;
                            setFormData({ ...formData, cot_examples: newExamples });
                            setHasChanges(true);
                          }}
                          className="min-h-[80px]"
                          disabled={isReadOnly}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                              e.stopPropagation();
                            }
                          }}
                        />
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newExamples = [...(formData.cot_examples || [])];
                              newExamples.splice(index, 1);
                              setFormData({ ...formData, cot_examples: newExamples });
                              setHasChanges(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-[200px]"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            cot_examples: [...(formData.cot_examples || []), ""]
                          });
                          setHasChanges(true);
                        }}
                      >
                        Add Example
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
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