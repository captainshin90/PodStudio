import { useState, useEffect } from "react";
import { Document } from "@/lib/schemas/documents";
import { documentsService } from "@/lib/services/database-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface DocumentBrowserProps {
  onSelectDocument: (doc: Document) => void;
  selectedDocument: Document | null;
  disabled?: boolean;
}

export default function DocumentBrowser({ 
    onSelectDocument, 
    selectedDocument, 
    disabled = false, 
}: DocumentBrowserProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    document_type: "all",
    is_deleted: false,
    is_active: true,
  });

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    try {
      let loadedDocuments = await documentsService.getAllDocuments();
      if (loadedDocuments) {
        // Apply filters
        loadedDocuments = loadedDocuments.filter(document => {
          const matchesType = filters.document_type === "all" || document.doc_type === filters.document_type;
          const matchesDeleted = document.is_deleted === filters.is_deleted;
          const matchesActive = document.is_active === filters.is_active;
          return matchesType && matchesDeleted && matchesActive;
        });
        setDocuments(loadedDocuments as Document[]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading documents:", error);
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter((document) => {
    return (
      document.doc_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.topic_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Add click handler to debug selection
  const handleDocumentClick = (doc: Document) => {
    console.log("Document clicked:", doc);
    onSelectDocument(doc);
  };

  if (loading) {
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
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, document_type: "all" }))}>
              All Types
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, document_type: "pdf" }))}>
              PDFs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, document_type: "doc" }))}>
              Word Documents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, document_type: "txt" }))}>
              Text Files
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

      {/* Document List */}
      <div className="space-y-1">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className={`p-2 rounded-lg cursor-pointer hover:bg-secondary/50 ${
              selectedDocument?.id === doc.id 
              ? "bg-secondary" : "hover:bg-muted"
            }`}
            onClick={() => handleDocumentClick(doc)}
          >
            <h3 className="font-medium">{doc.doc_name}</h3>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {doc.topic_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 