import { useState, useEffect, useRef } from "react";
import { Prompt } from "@/lib/schemas/prompts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
//  DropdownMenuItem,
  DropdownMenuTrigger,
//  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { databaseService } from "@/lib/services/database-service";

interface PromptBrowserProps {
  onSelectPrompt: (prompt: Prompt) => void;
  selectedPrompt: Prompt | null;
  disabled?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// PromptBrowser component
///////////////////////////////////////////////////////////////////////////////

export default function PromptBrowser({
  onSelectPrompt,
  selectedPrompt,
  disabled = false,
}: PromptBrowserProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setIsLoading] = useState(true);
  const [_, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [filters, setFilters] = useState({
    is_deleted: false,
    is_active: true,
  });

  useEffect(() => {
    if (!databaseService.db) return;

    // Create the base query
    let q = query(collection(databaseService.db, 'prompts'));

    // Apply filters
    q = query(q, where('is_deleted', '==', filters.is_deleted));
    q = query(q, where('is_active', '==', filters.is_active));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedPrompts: Prompt[] = [];
      snapshot.forEach((doc) => {
        updatedPrompts.push({ id: doc.id, ...doc.data() } as Prompt);
      });
      setPrompts(updatedPrompts);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to prompts:", error);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filters]);

  const filteredPrompts = prompts.filter((prompt) => {
    return (
      prompt.prompt_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt_desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Update itemRefs when filteredPrompts changes
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredPrompts.length);
  }, [filteredPrompts]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev < filteredPrompts.length - 1 ? prev + 1 : prev;
          if (nextIndex !== prev) {
            onSelectPrompt(filteredPrompts[nextIndex]);
            // Focus the element
            setTimeout(() => {
              itemRefs.current[nextIndex]?.focus();
            }, 0);
          }
          return nextIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev > 0 ? prev - 1 : 0;
          if (nextIndex !== prev) {
            onSelectPrompt(filteredPrompts[nextIndex]);
            // Focus the element
            setTimeout(() => {
              itemRefs.current[nextIndex]?.focus();
            }, 0);
          }
          return nextIndex;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPrompts, onSelectPrompt, disabled]);

  // Reset focused index when search query or filters change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // return the prompt browser component
  return (
    <div className={`flex flex-col h-[calc(80vh-3rem)] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-2 mb-4">
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

      <div className="space-y-1 overflow-y-auto flex-1 pr-2 pl-2 pb-2" ref={listRef}>
        {filteredPrompts.map((prompt, index) => (
          <div
            key={prompt.id}
            ref={el => itemRefs.current[index] = el}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedPrompt?.id === prompt.id
                ? "bg-secondary" 
                : "hover:bg-muted"
            } focus:outline focus:outline-2 focus:outline-primary/30 focus:outline-offset-0`}
            onClick={() => {
              onSelectPrompt(prompt);
              setFocusedIndex(index);
              // Ensure the element gets focus when clicked
              itemRefs.current[index]?.focus();
            }}
            tabIndex={0}
            role="option"
            aria-selected={selectedPrompt?.id === prompt.id}
            onFocus={() => setFocusedIndex(index)}
          >
            <div className="font-medium">{prompt.prompt_name}</div>
            <div className="text-xs opacity-80 mt-0.5">
              {prompt.prompt_desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 