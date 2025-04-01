import { useState, useEffect } from "react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

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

      <div className="space-y-1">
        {filteredDocuments.map((document) => (
          <div
            key={document.id}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedDocument?.id === document.id
                ? "bg-secondary" : "hover:bg-muted"
            }`}
            onClick={() => onSelectDocument(document)}
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