import { useState, useEffect, useRef } from "react";
import { Document } from "@/lib/schemas/documents";
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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { databaseService } from "@/lib/services/database-service";

interface DocumentBrowserProps {
  onSelectDocument: (document: Document) => void;
  selectedDocument: Document | null;
  disabled?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// DocumentBrowser component
///////////////////////////////////////////////////////////////////////////////

export default function DocumentBrowser({
  onSelectDocument,
  selectedDocument,
  disabled = false,
}: DocumentBrowserProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setIsLoading] = useState(true);
  const [_, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [filters, setFilters] = useState({
    doc_type: "all",
    is_deleted: false,
    is_active: true,
  });

  useEffect(() => {
    if (!databaseService.db) return;

    // Create the base query
    let q = query(collection(databaseService.db, 'documents'));

    // Apply filters
    if (filters.doc_type !== "all") {
      q = query(q, where('doc_type', '==', filters.doc_type));
    }
    q = query(q, where('is_deleted', '==', filters.is_deleted));
    q = query(q, where('is_active', '==', filters.is_active));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedDocuments: Document[] = [];
      snapshot.forEach((doc) => {
        updatedDocuments.push({ id: doc.id, ...doc.data() } as Document);
      });
      setDocuments(updatedDocuments);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to documents:", error);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filters]);

  // filter the documents
  const filteredDocuments = documents.filter((document) => {
    return (
      document.doc_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.topic_tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Update itemRefs when filteredDocuments changes
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredDocuments.length);
  }, [filteredDocuments]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev < filteredDocuments.length - 1 ? prev + 1 : prev;
          if (nextIndex !== prev) {
            onSelectDocument(filteredDocuments[nextIndex]);
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
            onSelectDocument(filteredDocuments[nextIndex]);
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
  }, [filteredDocuments, onSelectDocument, disabled]);

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

  //////////////////////////////////////////////////////////////////////////////
  // This is the main component for the document browser
  //////////////////////////////////////////////////////////////////////////////
  // return the document browser component
  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
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
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "all" }))}>
              All Types
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "article" }))}>
              Articles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "podcast" }))}>
              Podcasts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "transcript" }))}>
              Transcripts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "question" }))}>
              Questions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "answer" }))}>
              Answers
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "summary" }))}>
              Summaries
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, doc_type: "chat" }))}>
              Chats
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

      <div className="space-y-1" ref={listRef}>
        {filteredDocuments.map((document, index) => (
          <div
            key={document.id}
            ref={el => itemRefs.current[index] = el}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedDocument?.id === document.id
                ? "bg-secondary" 
                : "hover:bg-muted"
            } focus:outline focus:outline-2 focus:outline-primary/30 focus:outline-offset-2`}
            onClick={() => {
              onSelectDocument(document);
              setFocusedIndex(index);
              // Ensure the element gets focus when clicked
              itemRefs.current[index]?.focus();
            }}
            tabIndex={0}
            role="option"
            aria-selected={selectedDocument?.id === document.id}
            onFocus={() => setFocusedIndex(index)}
          >
            <div className="font-medium">{document.doc_name}</div>
            <div className="text-xs opacity-80 mt-0.5">
             { document.topic_tags?.join(", ") }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 