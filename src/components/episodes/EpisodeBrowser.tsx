import { useState, useEffect, useRef } from "react";
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
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { databaseService } from "@/lib/services/database-service";

interface EpisodeBrowserProps {
  onSelectEpisode: (episode: Episode) => void;
  selectedEpisode: Episode | null;
  disabled?: boolean;
}

interface EpisodeWithPodcast extends Episode {
  podcast_title?: string;
}

interface PodcastData {
  podcast_title: string;
}

///////////////////////////////////////////////////////////////////////////////
// EpisodeBrowser component
///////////////////////////////////////////////////////////////////////////////

export default function EpisodeBrowser({
  onSelectEpisode,
  selectedEpisode,
  disabled = false,
}: EpisodeBrowserProps) {
  const [episodes, setEpisodes] = useState<EpisodeWithPodcast[]>([]);
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
    let q = query(collection(databaseService.db, 'episodes'));

    // Apply filters
    q = query(q, where('is_deleted', '==', filters.is_deleted));
    q = query(q, where('is_active', '==', filters.is_active));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const updatedEpisodes: EpisodeWithPodcast[] = [];
      
      // Process each episode and fetch its podcast title
      for (const episodeDoc of snapshot.docs) {
        const episodeData = { id: episodeDoc.id, ...episodeDoc.data() } as Episode;
        const episodeWithPodcast: EpisodeWithPodcast = { ...episodeData };
        
        // Fetch podcast title if podcast_id exists
        if (episodeData.podcast_id && databaseService.db) {
          try {
            const podcastDoc = await getDoc(doc(databaseService.db, 'podcasts', episodeData.podcast_id));
            if (podcastDoc.exists()) {
              const podcastData = podcastDoc.data() as PodcastData;
              episodeWithPodcast.podcast_title = podcastData.podcast_title;
            }
          } catch (error) {
            console.error("Error fetching podcast title:", error);
          }
        }
        
        updatedEpisodes.push(episodeWithPodcast);
      }
      
      setEpisodes(updatedEpisodes);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to episodes:", error);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filters, selectedEpisode, onSelectEpisode]);

  ///////////////////////////////////////////////////////////////////////////////
  // filter the episodes
  ///////////////////////////////////////////////////////////////////////////////

  const filteredEpisodes = episodes.filter((episode) => {
    return (
      episode.episode_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.podcast_title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  ///////////////////////////////////////////////////////////////////////////////
  // update itemRefs when filteredEpisodes changes
  ///////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredEpisodes.length);
  }, [filteredEpisodes]);

  ///////////////////////////////////////////////////////////////////////////////
  // Handle keyboard navigation 
  ///////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev < filteredEpisodes.length - 1 ? prev + 1 : prev;
          if (nextIndex !== prev) {
            onSelectEpisode(filteredEpisodes[nextIndex]);
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
            onSelectEpisode(filteredEpisodes[nextIndex]);
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
  }, [filteredEpisodes, onSelectEpisode, disabled]);

  ///////////////////////////////////////////////////////////////////////////////
  // reset focused index when search query or filters change
  ///////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery, filters]);

  ///////////////////////////////////////////////////////////////////////////////
  // return the loading component
  ///////////////////////////////////////////////////////////////////////////////

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  ///////////////////////////////////////////////////////////////////////////////
  // return the episode browser component
  ///////////////////////////////////////////////////////////////////////////////

  return (
    <div className={`flex flex-col h-[calc(80vh-3rem)] ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex gap-2 mb-4">
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

      <div className="space-y-1 overflow-y-auto flex-1 pr-2 pl-2 pb-2" ref={listRef}>
        {filteredEpisodes.map((episode, index) => (
          <div
            key={episode.id}
            ref={el => itemRefs.current[index] = el}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedEpisode?.id === episode.id
                ? "bg-secondary" 
                : "hover:bg-muted"
              } focus:outline focus:outline-2 focus:outline-primary/30 focus:outline-offset-0`}
            onClick={() => {
              onSelectEpisode(episode);
              setFocusedIndex(index);
              // Ensure the element gets focus when clicked
              itemRefs.current[index]?.focus();
            }}
            tabIndex={0}
            role="option"
            aria-selected={selectedEpisode?.id === episode.id}
            onFocus={() => setFocusedIndex(index)}
          >
            <div className="font-medium">{episode.episode_title}</div>
            <div className="text-xs opacity-80 mt-0.5">
              {episode.podcast_title || "No podcast selected"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 