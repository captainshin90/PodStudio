import { useState, useEffect } from "react";
import { Podcast } from "@/lib/schemas/podcasts";
import { podcastsService } from "@/lib/services/database-service";
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

interface PodcastBrowserProps {
  onSelectPodcast: (podcast: Podcast) => void;
  selectedPodcast: Podcast | null;
  disabled?: boolean;
}

export default function PodcastBrowser({
  onSelectPodcast,
  selectedPodcast,
  disabled = false,
}: PodcastBrowserProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    podcast_type: "all",
    is_deleted: false,
    is_active: true,
  });

  useEffect(() => {
    loadPodcasts();
  }, [filters]);

  const loadPodcasts = async () => {
    try {
      let loadedPodcasts = await podcastsService.getAllPodcasts();
      if (loadedPodcasts) {
        // Apply filters
        loadedPodcasts = loadedPodcasts.filter(podcast => {
          const matchesType = filters.podcast_type === "all" || podcast.podcast_type === filters.podcast_type;
          const matchesDeleted = podcast.is_deleted === filters.is_deleted;
          const matchesActive = podcast.is_active === filters.is_active;
          return matchesType && matchesDeleted && matchesActive;
        });
        setPodcasts(loadedPodcasts as Podcast[]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading podcasts:", error);
      setIsLoading(false);
    }
  };

  const filteredPodcasts = podcasts.filter((podcast) => {
    return (
      podcast.podcast_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.topic_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
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
            placeholder="Search podcasts..."
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
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, podcast_type: "all" }))}>
              All Types
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, podcast_type: "summary" }))}>
              Summaries
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, podcast_type: "audio_podcast" }))}>
              Audio Podcasts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, podcast_type: "video_podcast" }))}>
              Video Podcasts
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
        {filteredPodcasts.map((podcast) => (
          <div
            key={podcast.id}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedPodcast?.id === podcast.id
                ? "bg-secondary" : "hover:bg-muted"
            }`}
            onClick={() => onSelectPodcast(podcast)}
          >
            <div className="font-medium">{podcast.podcast_title}</div>
            <div className="text-xs opacity-80 mt-0.5">
              {podcast.topic_tags.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 