import { useState, useEffect } from "react";
import { Transcript } from "@/lib/schemas/transcripts";
import { transcriptsService } from "@/lib/services/database-service";
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

interface TranscriptBrowserProps {
  onSelectTranscript: (transcript: Transcript) => void;
  selectedTranscript: Transcript | null;
  disabled?: boolean;
}

export default function TranscriptBrowser({
  onSelectTranscript,
  selectedTranscript,
  disabled = false,
}: TranscriptBrowserProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    transcript_type: "all",
    is_deleted: false,
    is_active: true,
  });

  useEffect(() => {
    loadTranscripts();
  }, [filters]);

  const loadTranscripts = async () => {
    try {
      let loadedTranscripts = await transcriptsService.getAllTranscripts();
      if (loadedTranscripts) {
        // Apply filters
        loadedTranscripts = loadedTranscripts.filter(transcript => {
          const matchesType = filters.transcript_type === "all" || transcript.transcript_type === filters.transcript_type;
          const matchesDeleted = transcript.is_deleted === filters.is_deleted;
          const matchesActive = transcript.is_active === filters.is_active;
          return matchesType && matchesDeleted && matchesActive;
        });
        setTranscripts(loadedTranscripts as Transcript[]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading transcripts:", error);
      setIsLoading(false);
    }
  };

  const filteredTranscripts = transcripts.filter((transcript) => {
    return (
      transcript.transcript_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transcript.topic_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcripts..."
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
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, transcript_type: "all" }))}>
              All Types
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, transcript_type: "interview" }))}>
              Interviews
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, transcript_type: "meeting" }))}>
              Meetings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, transcript_type: "article" }))}>
              Articles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, transcript_type: "petition" }))}>
              Petitions
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
        {filteredTranscripts.map((transcript) => (
          <div
            key={transcript.id}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedTranscript?.id === transcript.id
                ? "bg-secondary" : "hover:bg-muted"
            }`}
            onClick={() => onSelectTranscript(transcript)}
          >
            <div className="font-medium">{transcript.transcript_title}</div>
            <div className="text-xs opacity-80 mt-0.5">
              {transcript.topic_tags.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 