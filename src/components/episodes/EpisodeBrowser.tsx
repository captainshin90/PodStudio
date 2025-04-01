import { useState, useEffect } from "react";
import { Episode } from "@/lib/schemas/episodes";
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

interface EpisodeBrowserProps {
  onSelectEpisode: (episode: Episode) => void;
  selectedEpisode: Episode | null;
  disabled?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// EpisodeBrowser component
///////////////////////////////////////////////////////////////////////////////

export default function EpisodeBrowser({
  onSelectEpisode,
  selectedEpisode,
  disabled = false,
}: EpisodeBrowserProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    is_deleted: false,
    is_active: true,
  });

  useEffect(() => {
    if (!databaseService.db) return;

    // Create the base query
    let q = query(collection(databaseService.db, 'episodes'));

    // Apply filters
    q = query(q, where('is_deleted', '==', filters.is_deleted));
    q = query(q, where('is_active', '==', filters.is_active));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedEpisodes: Episode[] = [];
      snapshot.forEach((doc) => {
        updatedEpisodes.push({ id: doc.id, ...doc.data() } as Episode);
      });
      setEpisodes(updatedEpisodes);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to episodes:", error);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filters]);

  // filter the episodes
  const filteredEpisodes = episodes.filter((episode) => {
    return (
      episode.episode_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.episode_slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // return the loading component
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // return the episode browser component
  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search episodes..."
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

      <div className="space-y-1">
        {filteredEpisodes.map((episode) => (
          <div
            key={episode.id}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedEpisode?.id === episode.id
                ? "bg-secondary" : "hover:bg-muted"
            }`}
            onClick={() => onSelectEpisode(episode)}
          >
            <div className="font-medium">{episode.episode_title}</div>
            <div className="text-xs opacity-80 mt-0.5">
              {episode.episode_slug}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 