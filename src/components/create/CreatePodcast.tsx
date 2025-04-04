import { useState, useEffect } from "react";
import { Podcast } from "@/lib/schemas/podcasts";
import { Transcript } from "@/lib/schemas/transcripts";
import { Prompt } from "@/lib/schemas/prompts";
import { Episode } from "@/lib/schemas/episodes";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, Play } from "lucide-react";
import { io } from "socket.io-client";
import { podcastsService, transcriptsService, promptsService, episodesService } from "@/lib/services/database-service";
import PodcastDetails from "@/components/podcasts/PodcastDetails";
import TranscriptDetails from "@/components/transcripts/TranscriptDetails";
import PromptDetails from "@/components/prompts/PromptDetails";
import EpisodeDetails from "@/components/episodes/EpisodeDetails";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface SelectDialogProps {
  title: string;
  items: Array<{ id: string; title: string }>;
  onSelect: (id: string) => void;
  trigger: React.ReactNode;
}

//////////////////////////////////////////////////////////////////////
// Select Dialog
//////////////////////////////////////////////////////////////////////
function SelectDialog({ title, items, onSelect, trigger }: SelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.id}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

//////////////////////////////////////////////////////////////////////////////
// This is the main component for creating a podcast
//////////////////////////////////////////////////////////////////////////////
export default function CreatePodcast() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [podcasts, setPodcasts] = useState<Array<{ id: string; title: string }>>([]);
  const [transcripts, setTranscripts] = useState<Array<{ id: string; title: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [generatedEpisode, setGeneratedEpisode] = useState<Episode | null>(null);
  const [hasGeneratedPodcast, setHasGeneratedPodcast] = useState(false);

  useEffect(() => {
    loadSelectionData();
  }, []);

  // This is a helper function to load the podcasts, transcripts, and prompts
  const loadSelectionData = async () => {
    try {
      const [loadedPodcasts, loadedTranscripts, loadedPrompts] = await Promise.all([
        podcastsService.getAllPodcasts(),
        transcriptsService.getAllTranscripts(),
        promptsService.getAllPrompts()
      ]);

      if (loadedPodcasts) {
        setPodcasts(loadedPodcasts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.podcast_id, title: p.podcast_title })));
      }
      if (loadedTranscripts) {
        setTranscripts(loadedTranscripts
          .filter(t => t.is_active && !t.is_deleted)
          .map(t => ({ id: t.transcript_id, title: t.transcript_title })));
      }
      if (loadedPrompts) {
        setPrompts(loadedPrompts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.prompt_id, title: p.prompt_name })));
      }
    } catch (error) {
      console.error("Error loading selection data:", error);
      toast({
        title: "Error",
        description: "Failed to load podcasts, transcripts, and prompts",
        variant: "destructive",
      });
    }
  };

  // This is a helper function to handle the podcast selection
  const handlePodcastSelect = async (podcastId: string) => {
    try {
      const podcast = await podcastsService.getPodcastById(podcastId);
      if (podcast) {
        setSelectedPodcast(podcast as Podcast);
        setHasGeneratedPodcast(false);
      }
    } catch (error) {
      console.error("Error loading podcast:", error);
      toast({
        title: "Error",
        description: "Failed to load selected podcast",
        variant: "destructive",
      });
    }
  };

  // This is a helper function to handle the transcript selection
  const handleTranscriptSelect = async (transcriptId: string) => {
    try {
      const transcript = await transcriptsService.getTranscriptById(transcriptId);
      if (transcript) {
        setSelectedTranscript(transcript as Transcript);
        setHasGeneratedPodcast(false);
      }
    } catch (error) {
      console.error("Error loading transcript:", error);
      toast({
        title: "Error",
        description: "Failed to load selected transcript",
        variant: "destructive",
      });
    }
  };

  // This is a helper function to handle the prompt selection
  const handlePromptSelect = async (promptId: string) => {
    try {
      const prompt = await promptsService.getPromptById(promptId);
      if (prompt) {
        setSelectedPrompt(prompt as Prompt);
        setHasGeneratedPodcast(false);
      }
    } catch (error) {
      console.error("Error loading prompt:", error);
      toast({
        title: "Error",
        description: "Failed to load selected prompt",
        variant: "destructive",
      });
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle the podcast generation
  //////////////////////////////////////////////////////////////////////////////
  const handleGeneratePodcast = async () => {
    // validate that we have a podcast, transcript, and prompt
    if (!selectedPodcast || !selectedTranscript || !selectedPrompt) {
      toast({
        title: "Missing Information",
        description: "Please select a podcast, transcript, and prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage("Connecting to server...");

    try {
      const episodeId = crypto.randomUUID();
      const socket = io({
        path: "/socket.io",
        reconnection: true,
        timeout: 10000,
      });

      // handle cleanup
      const cleanup = () => {
        console.log("Cleaning up socket connection...");
        socket.disconnect();
        setIsGenerating(false);
      };

      // connected to the server, get payload and call the generate_podcast server endpoint
      socket.on("connect", () => {
        console.log("Socket connected successfully");
        setStatusMessage("Connected to server");

        const payload = {
          is_from_transcript: true,
          transcript_only: false,
          text: selectedTranscript.transcript_text,
          name: selectedPodcast.podcast_title,
          tagline: selectedPodcast.podcast_tagline,
          is_long_form: selectedPrompt.is_long_form,
          word_count: selectedPrompt.word_count,
          creativity: selectedPrompt.creativity,
          conversation_style: selectedPrompt.conversation_style,
          roles_person1: selectedPrompt.roles_person1,
          roles_person2: selectedPrompt.roles_person2,
          dialogue_structure: selectedPrompt.dialogue_structure,
          engagement_techniques: selectedPrompt.engagement_techniques,
          user_instructions: selectedPrompt.prompt_text,
          ending_message: selectedPrompt.ending_message,
          tts_model: selectedPrompt.tts_model,
          voice_question: selectedPrompt.voice_question,
          voice_answer: selectedPrompt.voice_answer,
          voice_model: selectedPrompt.voice_model,
          secret_key: sessionStorage.getItem("secret_key") || "",
        };

        // call the generate_podcast server endpoint with the payload
        socket.emit("generate_podcast", payload);
      });

      // handle the progress event
      socket.on("progress", (data: { progress: number; message: string }) => {
        setProgress(data.progress);
        setStatusMessage(data.message);
      });

      // handle the error event
      socket.on("error", (error: { message: string }) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        cleanup();
      });

      // handle the disconnect event
      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        cleanup();
      });
    
      // handle the complete event
      socket.on("complete", async (data: { audioUrl: string; transcript: string }) => {
        const newEpisode: Episode = {
          id: episodeId,  // set by the database service
          episode_id: episodeId,
          podcast_id: selectedPodcast.podcast_id,
          transcript_id: selectedTranscript.transcript_id,
          prompt_id: selectedPrompt.prompt_id,
          episode_title: `${selectedPodcast.podcast_title} - ${selectedTranscript.transcript_title}`,
          episode_slug: `${selectedPodcast.podcast_slug}-${selectedTranscript.transcript_title.toLowerCase().replace(/\s+/g, '-')}`,
          episode_desc: selectedPodcast.podcast_desc,
          episode_number: 1, // Default to 1, can be updated later
          episode_summary: selectedTranscript.transcript_text.substring(0, 200) + "...",
          content_duration: 0, // Will be updated when audio is processed
          content_transcript: data.transcript || selectedTranscript.transcript_text,
          content_url: data.audioUrl || "",
          content_image: selectedPodcast.podcast_image,
          topic_tags: [...selectedPodcast.topic_tags, ...selectedTranscript.topic_tags],
          views: 0,
          likes: 0,
          dislikes: 0,
          created_by: "system", // Default to system
          publish_date: new Date(), // Default to now
          expire_date: undefined, // No expiration by default
          linklist: [],
          is_active: true,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        console.log("Podcast generation complete");
        setGeneratedEpisode(newEpisode);
        setHasGeneratedPodcast(true);
        cleanup();
      });

      // Handle component unmount
      return () => cleanup();
    } catch (error) {
      console.error("Error generating podcast:", error);
      toast({
        title: "Error",
        description: "Failed to generate podcast",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  }; // handleGeneratePodcast

  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle the episode saving
  //////////////////////////////////////////////////////////////////////////////
  const handleSaveEpisode = async (episode: Episode) => {
    try {
      await episodesService.createEpisode(episode);
      toast({
        title: "Success",
        description: "Episode saved successfully",
      });
      setGeneratedEpisode(null);
      setSelectedPodcast(null);
      setSelectedTranscript(null);
      setSelectedPrompt(null);
      setHasGeneratedPodcast(false);
    } catch (error) {
      console.error("Error saving episode:", error);
      toast({
        title: "Error",
        description: "Failed to save episode",
        variant: "destructive",
      });
    }
  };

  // This is a helper function to handle the episode cancellation
  const handleCancel = () => {
    setGeneratedEpisode(null);
    setSelectedPodcast(null);
    setSelectedTranscript(null);
    setSelectedPrompt(null);
    setHasGeneratedPodcast(false);
  };

  //////////////////////////////////////////////////////////////////////////////
  // This is the main component for creating a podcast
  //////////////////////////////////////////////////////////////////////////////
  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-1/3 p-4 border-r space-y-4">
        <div className="space-y-6">
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2 text-muted-foreground pl-3">1. Select a Podcast</h3>
            <SelectDialog
              title="Select Podcast"
              items={podcasts}
              onSelect={handlePodcastSelect}
              trigger={
                <Button variant="outline" className="w-full justify-between pl-7">
                  <span className="truncate mr-2 max-w-[calc(100%-24px)]">
                    {selectedPodcast ? selectedPodcast.podcast_title : "Select Podcast"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              }
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-muted-foreground pl-3">2. Select a Transcript</h3>
            <SelectDialog
              title="Select Transcript"
              items={transcripts}
              onSelect={handleTranscriptSelect}
              trigger={
                <Button variant="outline" className="w-full justify-between pl-7">
                  <span className="truncate mr-2 max-w-[calc(100%-24px)]">
                    {selectedTranscript ? selectedTranscript.transcript_title : "Select Transcript"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              }
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-muted-foreground pl-3">3. Select a Prompt</h3>
            <SelectDialog
              title="Select Prompt"
              items={prompts}
              onSelect={handlePromptSelect}
              trigger={
                <Button variant="outline" className="w-full justify-between pl-7">
                  <span className="truncate mr-2 max-w-[calc(100%-24px)]">
                    {selectedPrompt ? selectedPrompt.prompt_name : "Select Prompt"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              }
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                {statusMessage || `Generating podcast... ${progress}%`}
                </p>
              </div>
            )}
            <Button
              className="w-full text-lg"
              onClick={handleGeneratePodcast}
              disabled={!selectedPodcast || !selectedTranscript || !selectedPrompt || isGenerating || hasGeneratedPodcast}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating podcast...
                </>
              ) : (
                <div className="flex items-center"> 
                  <Play className="mr-2 h-4 w-4" />
                  Generate Podcast
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-2/3 p-4 space-y-4 overflow-y-auto">
        {generatedEpisode ? (
          <>
            <EpisodeDetails
              episode={generatedEpisode}
              onSave={handleSaveEpisode}
              onCancel={handleCancel}
              isNew={true}
              isReadOnly={false}
            />
            <div className="border-t pt-4">
              <PodcastDetails
                podcast={selectedPodcast}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
            </div>
            <div className="border-t pt-4">
              <TranscriptDetails
                transcript={selectedTranscript}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
            </div>
            <div className="border-t pt-4">
              <PromptDetails
                prompt={selectedPrompt}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
            </div>
          </>
        ) : (
          <>
            {selectedPodcast && (
              <PodcastDetails
                podcast={selectedPodcast}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
            )}
            {selectedTranscript && (
              <div className="mt-4">
                <TranscriptDetails
                  transcript={selectedTranscript}
                  onSave={() => {}}
                  onCancel={() => {}}
                  isNew={false}
                  isReadOnly={true}
                />
              </div>
            )}
            {selectedPrompt && (
              <div className="mt-4">
                <PromptDetails
                  prompt={selectedPrompt}
                  onSave={() => {}}
                  onCancel={() => {}}
                  isNew={false}
                  isReadOnly={true}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 