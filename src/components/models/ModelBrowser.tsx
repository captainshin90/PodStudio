import { useState, useEffect, useRef } from "react";
import { Model } from "@/lib/schemas/models";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { databaseService } from "@/lib/services/database-service";

interface ModelBrowserProps {
  onSelectModel: (model: Model) => void;
  selectedModel: Model | null;
  disabled?: boolean;
}

export default function ModelBrowser({
  onSelectModel,
  selectedModel,
  disabled = false,
}: ModelBrowserProps) {
  const [models, setModels] = useState<Model[]>([]);
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
    let q = query(collection(databaseService.db, 'models'));

    // Apply filters
    q = query(q, where('is_active', '==', filters.is_active));
    q = query(q, where('is_deleted', '==', filters.is_deleted));
    // Add orderBy for updated_at in descending order
    q = query(q, orderBy('updated_at', 'desc'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedModels: Model[] = [];
      snapshot.forEach((doc) => {
        updatedModels.push({ id: doc.id, ...doc.data() } as Model);
      });
      setModels(updatedModels);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to models:", error);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filters]);

  const filteredModels = models.filter((model) => {
    return (
      model.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.model_desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Update itemRefs when filteredModels changes
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredModels.length);
  }, [filteredModels]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev < filteredModels.length - 1 ? prev + 1 : prev;
          if (nextIndex !== prev) {
            onSelectModel(filteredModels[nextIndex]);
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
            onSelectModel(filteredModels[nextIndex]);
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
  }, [filteredModels, onSelectModel, disabled]);

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

  // return the model browser component
  return (
    <div className={`flex flex-col h-[calc(80vh-3rem)] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
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

      <div className="space-y-1 overflow-y-auto flex-1 pr-2 pl-2 pb-2 pt-1" ref={listRef}>
        {filteredModels.map((model, index) => (
          <div
            key={model.id}
            ref={el => itemRefs.current[index] = el}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedModel?.id === model.id
                ? "bg-secondary" 
                : "hover:bg-muted"
            } focus:outline focus:outline-2 focus:outline-primary/30 focus:outline-offset-0`}
            onClick={() => {
              onSelectModel(model);
              setFocusedIndex(index);
              // Ensure the element gets focus when clicked
              itemRefs.current[index]?.focus();
            }}
            tabIndex={0}
            role="option"
            aria-selected={selectedModel?.id === model.id}
            onFocus={() => setFocusedIndex(index)}
          >
            <div className="font-medium truncate">{model.model_name}</div>
            <div className="text-xs opacity-80 mt-0.5 truncate">
              {model.model_type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 