import { useState, useEffect } from "react";
import { Prompt } from "@/lib/schemas/prompts";
import { promptsService } from "@/lib/services/database-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface PromptBrowserProps {
  onSelectPrompt: (prompt: Prompt) => void;
  selectedPrompt: Prompt | null;
  disabled?: boolean;
}

export default function PromptBrowser({
  onSelectPrompt,
  selectedPrompt,
  disabled = false,
}: PromptBrowserProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    prompt_type: "all",
    is_deleted: false,
    is_active: true,
  });

  useEffect(() => {
    loadPrompts();
  }, [filters]);

  const loadPrompts = async () => {
    try {
      let loadedPrompts = await promptsService.getAllPrompts();
      if (loadedPrompts) {
        // Apply filters
        loadedPrompts = loadedPrompts.filter(prompt => {
          const matchesType = filters.prompt_type === "all" || prompt.prompt_type === filters.prompt_type;
          const matchesDeleted = prompt.is_deleted === filters.is_deleted;
          const matchesActive = prompt.is_active === filters.is_active;
          return matchesType && matchesDeleted && matchesActive;
        });
        setPrompts(loadedPrompts as Prompt[]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading prompts:", error);
      setIsLoading(false);
    }
  };

  const filteredPrompts = prompts.filter((prompt) => {
    return (
      prompt.prompt_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt_desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, prompt_type: "all" }))}>
              All Types
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, prompt_type: "system" }))}>
              System Prompts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, prompt_type: "user" }))}>
              User Prompts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, prompt_type: "assistant" }))}>
              Assistant Prompts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.is_active}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, is_active: checked }))}
            >
              Active Only
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.is_deleted}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, is_deleted: checked }))}
            >
              Deleted Only
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Prompt List */}
      <div className="space-y-1">
        {isLoading ? (
          <div>Loading prompts...</div>
        ) : (
          filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                selectedPrompt?.id === prompt.id
                  ? "bg-secondary"
                  : "hover:bg-muted"
              }`}
              onClick={() => onSelectPrompt(prompt)}
            >
              <div className="font-medium">{prompt.prompt_name}</div>
              <div className="text-xs opacity-80 mt-0.5">
                {prompt.prompt_desc}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 