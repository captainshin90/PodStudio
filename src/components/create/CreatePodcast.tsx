import { useState, useEffect } from "react";
import { Podcast } from "@/lib/schemas/podcasts";
import { Transcript } from "@/lib/schemas/transcripts";
import { Prompt } from "@/lib/schemas/prompts";
import { Episode } from "@/lib/schemas/episodes";
import { Model } from "@/lib/schemas/models";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, Play, Clock } from "lucide-react";
import { io } from "socket.io-client";
import { podcastsService, transcriptsService, promptsService, episodesService, modelsService } from "@/lib/services/database-service";
import PodcastDetails from "@/components/podcasts/PodcastDetails";
import TranscriptDetails from "@/components/transcripts/TranscriptDetails";
import PromptDetails from "@/components/prompts/PromptDetails";
import EpisodeDetails from "@/components/episodes/EpisodeDetails";
import ModelDetails from "@/components/models/ModelDetails";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { Progress } from "@/components/ui/progress";
import SelectDialog from "@/components/ui/select-dialog";

//////////////////////////////////////////////////////////////////////////////
// This is a helper function to handle generating audio for an existing episode
//////////////////////////////////////////////////////////////////////////////
export const handleRegeneratePodcast = async (
  episode: Episode,
  progressCallback?: (progress: number, message: string) => void,
  toast?: any
): Promise<void> => {
  if (!episode.podcast_id || !episode.transcript_id || !episode.prompt_id || !episode.model_id) {
    if (toast) {
      toast({
        title: "Missing Information",
        description: "Episode is missing required information for audio generation",
        variant: "destructive",
      });
    }
    return;
  }

  // Load the required data
  try {
    const [podcast, transcript, prompt, model] = await Promise.all([
      podcastsService.getPodcastById(episode.podcast_id),
      transcriptsService.getTranscriptById(episode.transcript_id),
      promptsService.getPromptById(episode.prompt_id),
      modelsService.getModelById(episode.model_id)
    ]);

    if (!podcast || !transcript || !prompt || !model) {
      if (toast) {
        toast({
          title: "Error",
          description: "Failed to load required data for audio generation",
          variant: "destructive",
        });
      }
      return;
    }

    // Start the generation process
    if (progressCallback) {
      progressCallback(0, "Connecting to server...");
    }

    const socket = io({
      path: "/socket.io",
      reconnection: true,
      timeout: 10000,
    });

    const cleanup = () => {
      console.log("Cleaning up socket connection...");
      socket.disconnect();
    };

    // connected to the server, get payload and call the generate_podcast server endpoint
    socket.on("connect", () => {
      console.log("Socket connected successfully");
      if (progressCallback) {
        progressCallback(0, "Connected to server");
      }

      const payload = {
        is_from_transcript: true,
        transcript_only: false,
        text: transcript.transcript_text,
        name: podcast.podcast_title,
        tagline: podcast.podcast_tagline,
        is_long_form: prompt.is_long_form,
        word_count: prompt.word_count,
        creativity: prompt.creativity,
        conversation_style: prompt.conversation_style,
        roles_person1: prompt.roles_person1,
        roles_person2: prompt.roles_person2,
        dialogue_structure: prompt.dialogue_structure,
        engagement_techniques: prompt.engagement_techniques,
        user_instructions: prompt.prompt_text,
        ending_message: prompt.ending_message,
        tts_provider: model.model_provider,
        tts_model_name: model.model_name,
        voice_question: model.voice_question,
        voice_answer: model.voice_answer,
        voice_model: model.voice_model,
        secret_key: sessionStorage.getItem("secret_key") || "",
      };

      // call the generate_podcast server endpoint with the payload
      socket.emit("generate_podcast", payload);
    });

    // handle the progress event
    socket.on("progress", (data: { progress: number; message: string }) => {
      if (progressCallback) {
        progressCallback(data.progress, data.message);
      }
    });

    // handle the error event
    socket.on("error", (error: { message: string }) => {
      if (toast) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      cleanup();
    });

    // handle the disconnect event
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      cleanup();
    });
  
    // handle the complete event
    socket.on("complete", async (data: { audioUrl: string; transcript: string }) => {
      // Update the existing episode with the new audio URL
      const updatedEpisode = {
        ...episode,
        content_url: data.audioUrl || "",
        content_transcript: data.transcript || episode.content_transcript,
        updated_at: new Date()
      };
      
      try {
        // Save the updated episode
        await episodesService.updateEpisode(episode.id, updatedEpisode);
        
        if (toast) {
          toast({
            title: "Success",
            description: "Audio generated and episode updated successfully",
          });
        }

        // Update progress to 100%
        if (progressCallback) {
          progressCallback(100, "Completed generation...");
        }

        // Return the updated episode
        return updatedEpisode;
      } catch (error) {
        console.error("Error updating episode with new audio:", error);
        if (toast) {
          toast({
            title: "Error",
            description: "Failed to update episode with new audio",
            variant: "destructive",
          });
        }
      } finally {
        // Always clean up the socket connection
        cleanup();
      }
    });

    // Store the cleanup function for later use
    const cleanupFn = () => cleanup();
    
    // Handle component unmount
    window.addEventListener('beforeunload', cleanupFn);
    
    // Return a promise that resolves when the socket is disconnected
    return new Promise<void>((resolve) => {
      socket.on("disconnect", () => {
        window.removeEventListener('beforeunload', cleanupFn);
        resolve();
      });
    });
  } catch (error) {
    console.error("Error generating audio for episode:", error);
    if (toast) {
      toast({
        title: "Error",
        description: "Failed to generate audio for episode",
        variant: "destructive",
      });
    }
  }


};

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
  const [ttsModels, setTtsModels] = useState<Array<{ id: string; title: string }>>([]);
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedTtsModel, setSelectedTtsModel] = useState<Model | null>(null);
  const [generatedEpisode, setGeneratedEpisode] = useState<Episode | null>(null);
  const [hasGeneratedPodcast, setHasGeneratedPodcast] = useState(false);
  const [setShowDeleteDialog] = useState(false);
  const [] = useState<{
    isGenerating: boolean;
    progress: number;
    message: string;
  }>({
    isGenerating: false,
    progress: 0,
    message: "",
  });

  useEffect(() => {
    loadSelectionData();
    loadRecentEpisodes();
  }, []);

  // This is a helper function to load recent episodes
  const loadRecentEpisodes = async () => {
    try {
      const episodes = await episodesService.getRecentEpisodes(6);
      if (episodes) {
        setRecentEpisodes(episodes as Episode[]);
      }
    } catch (error) {
      console.error("Error loading recent episodes:", error);
    }
  };

  // This is a helper function to load the podcasts, transcripts, and prompts
  const loadSelectionData = async () => {
    try {
      const [loadedPodcasts, loadedTranscripts, loadedPrompts, loadedModels] = await Promise.all([
        podcastsService.getAllPodcasts(),
        transcriptsService.getAllTranscripts(),
        promptsService.getAllPrompts(),
        modelsService.getAllModels()
      ]);

      if (loadedPodcasts) {
        setPodcasts(loadedPodcasts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.id, title: p.podcast_title })));
      }
      if (loadedTranscripts) {
        setTranscripts(loadedTranscripts
          .filter(t => t.is_active && !t.is_deleted)
          .map(t => ({ id: t.id, title: t.transcript_title })));
      }
      if (loadedPrompts) {
        setPrompts(loadedPrompts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.id, title: p.prompt_name })));
      }
      if (loadedModels) {
        setTtsModels(loadedModels
          .filter(m => m.is_active && !m.is_deleted && m.model_type === 'TTS')
          .map(m => ({ id: m.id, title: m.model_name })));
      }
    } catch (error) {
      console.error("Error loading selection data:", error);
      toast({
        title: "Error",
        description: "Failed to load selection data",
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

  // Handle TTS model selection
  const handleTtsModelSelect = async (modelId: string) => {
    try {
      const model = await modelsService.getModelById(modelId);
      if (model) {
        setSelectedTtsModel(model as Model);
        setHasGeneratedPodcast(false);
      }
    } catch (error) {
      console.error("Error loading TTS model:", error);
      toast({
        title: "Error",
        description: "Failed to load selected TTS model",
        variant: "destructive",
      });
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle the podcast generation
  //////////////////////////////////////////////////////////////////////////////
  const handleGeneratePodcast = async () => {
    if (!selectedPodcast || !selectedTranscript || !selectedPrompt || !selectedTtsModel) {
      toast({
        title: "Missing Information",
        description: "Please select a podcast, transcript, prompt, and TTS model",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage("Connecting to server...");

    try {
      const socket = io({
        path: "/socket.io",
        reconnection: true,
        timeout: 10000,
      });

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
          tts_provider: selectedTtsModel.model_provider,   // e.g. "gemini"
          tts_model_name: selectedTtsModel.model_name,     // e.g. "gemini-1.5-pro-latest"  
          voice_question: selectedTtsModel.voice_question,
          voice_answer: selectedTtsModel.voice_answer,
          voice_model: selectedTtsModel.voice_model,
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
    
      // find the next available episode number
      const nextEpisodeNumber = await episodesService.getNextEpisodeNumber(selectedPodcast.id);
      // update the episode title with the podcast title and episode number
      const episodeTitle = `Episode ${nextEpisodeNumber ?? 1}: ${selectedPodcast.podcast_title}`;

      // handle the complete event      
      socket.on("complete", async (data: { audioUrl: string; transcript: string }) => {
        const newEpisode: Episode = {
          id: "epi_" + nanoid(20),  
          podcast_id: selectedPodcast.id,
          transcript_id: selectedTranscript.id,
          prompt_id: selectedPrompt.id,
          model_id: selectedTtsModel.id,
          episode_title: episodeTitle,
          episode_slug: episodeTitle.toLowerCase().replace(/\s+/g, '-'),
          episode_desc: selectedPodcast.podcast_desc,
          episode_number: nextEpisodeNumber ?? 1, // Default to 1, can be updated later
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
  // Question: There's a lot of code in the EpisodeDetails component that is
  //           similar to this. Should I refactor to put the common logic in a 
  //           helper function?
  //////////////////////////////////////////////////////////////////////////////
  const handleSaveEpisode = async (episode: Episode) => {
    try {
      await episodesService.createEpisode(episode.id, episode);
      toast({
        title: "Success",
        description: "Episode saved successfully",
      });
      setGeneratedEpisode(null);
      setSelectedPodcast(null);
      setSelectedTranscript(null);
      setSelectedPrompt(null);
      setSelectedTtsModel(null);
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

  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle the episode cancellation
  //////////////////////////////////////////////////////////////////////////////
  const handleCancel = () => {
    setGeneratedEpisode(null);
    setSelectedPodcast(null);
    setSelectedTranscript(null);
    setSelectedPrompt(null);
    setSelectedTtsModel(null);
    setHasGeneratedPodcast(false);
  };

  // This is a helper function to handle episode selection
  const handleEpisodeSelect = (episode: Episode) => {
    // Store the selected episode ID in localStorage
    localStorage.setItem('selectedEpisodeId', episode.id);
    
    // Dispatch a custom event that the App component can listen for
    const event = new CustomEvent('switchToTab', { 
      detail: { tab: 'episodes' } 
    });
    window.dispatchEvent(event);
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

          <div>
            <h3 className="text-lg font-medium mb-2 text-muted-foreground pl-3">4. Select a TTS Model</h3>
            <SelectDialog
              title="Select TTS Model"
              items={ttsModels}
              onSelect={handleTtsModelSelect}
              trigger={
                <Button variant="outline" className="w-full justify-between pl-7">
                  <span className="truncate mr-2 max-w-[calc(100%-24px)]">
                    {selectedTtsModel ? selectedTtsModel.model_name : "Select TTS Model"}
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
              disabled={!selectedPodcast || !selectedTranscript || !selectedPrompt || !selectedTtsModel || isGenerating || hasGeneratedPodcast}
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
        {recentEpisodes.length > 0 && !selectedPodcast && !selectedTranscript && !selectedPrompt && !selectedTtsModel && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-medium text-muted-foreground pl-3">
              <Clock className="h-5 w-5" />
              Recent Podcast Episodes
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recentEpisodes.map((episode) => (
                <div
                  key={episode.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleEpisodeSelect(episode)}
                >
                  <div className="font-medium truncate" title={episode.episode_title}>{episode.episode_title}</div>
                  <div className="text-sm text-muted-foreground truncate mt-1">
                    {episode.updated_at 
                    ? (episode.updated_at instanceof Date 
                        ? episode.updated_at.toLocaleString() 
                        : typeof episode.updated_at === 'object' && 'seconds' in episode.updated_at
                          ? new Date((episode.updated_at as any).seconds * 1000).toLocaleString()
                          : new Date(episode.updated_at as any).toLocaleString())
                    : ""}
                  </div>
                  {episode.topic_tags && episode.topic_tags.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {episode.topic_tags.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t-8 border-zinc-200 my-4"></div>
          </div>
        )}

        {generatedEpisode ? (
          <>
            <div className="border-t pt-4">
              <EpisodeDetails
                episode={generatedEpisode}
                onSave={handleSaveEpisode}
                onCancel={handleCancel}
                onDelete={() => setShowDeleteDialog}
                isNew={true}
              />
              <div className="border-t-8 border-zinc-200 my-4"></div>
            </div>
            <div className="border-t pt-4">
              <PodcastDetails
                podcast={selectedPodcast}
                onSave={() => { }}
                onCancel={() => { }}
                isNew={false}
                isReadOnly={true} 
              />
              <div className="border-t-8 border-zinc-200 my-4"></div>
            </div>
            <div className="border-t pt-4">
              <TranscriptDetails
                transcript={selectedTranscript}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
              <div className="border-t-8 border-zinc-200 my-4"></div>
            </div>
            <div className="border-t pt-4">
              <PromptDetails
                prompt={selectedPrompt}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
              <div className="border-t-8 border-zinc-200 my-4"></div>
            </div>
            <div className="border-t pt-4">
              <ModelDetails
                model={selectedTtsModel}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
              <div className="border-t-8 border-zinc-200 my-4"></div> 
            </div>
          </>
        ) : (
          <>
            {selectedPodcast && (
              <div className="mt-4">
                <PodcastDetails
                  podcast={selectedPodcast}
                  onSave={() => { } }
                  onCancel={() => { } }
                  isNew={false}
                  isReadOnly={true} 
                />
                <div className="border-t-8 border-zinc-200 my-4"></div>
              </div>
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
                <div className="border-t-8 border-zinc-200 my-4"></div>
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
                <div className="border-t-8 border-zinc-200 my-4"></div>
              </div>
            )}
            {selectedTtsModel && (
              <div className="mt-4">
                <ModelDetails
                  model={selectedTtsModel}
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