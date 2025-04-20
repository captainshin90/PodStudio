import { useState, useEffect } from "react";
import { Document } from "@/lib/schemas/documents";
import { Prompt } from "@/lib/schemas/prompts";
import { Transcript } from "@/lib/schemas/transcripts";
import { Model } from "@/lib/schemas/models";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, Play, Clock } from "lucide-react";
import { io } from "socket.io-client";
import { documentsService, modelsService, promptsService, transcriptsService } from "@/lib/services/database-service";
import DocumentDetails from "@/components/documents/DocumentDetails";
import PromptDetails from "@/components/prompts/PromptDetails";
import TranscriptDetails from "@/components/transcripts/TranscriptDetails";
import ModelDetails from "@/components/models/ModelDetails";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";        
// import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SelectDialog from "@/components/ui/select-dialog";


//////////////////////////////////////////////////////////////////////////////
// This is a helper function to handle updating an existing transcript
//////////////////////////////////////////////////////////////////////////////
export const handleRegenerateTranscript = async (
  transcript: Transcript,
  progressCallback?: (progress: number, message: string) => void,
  toast?: any
): Promise<void> => {
  if (!transcript.doc_id || !transcript.prompt_id || !transcript.model_id) {
    if (toast) {
      toast({
        title: "Missing Information",
        description: "Transcript is missing required information for generation",
        variant: "destructive",
      });
    }
    return;
  }

  // Load the required data
  try {
    const [document, prompt, model] = await Promise.all([
      documentsService.getDocumentById(transcript.doc_id),
      promptsService.getPromptById(transcript.prompt_id),
      modelsService.getModelById(transcript.model_id)
    ]);

    if (!document || !prompt || !model) {
      if (toast) {
        toast({
          title: "Error",
          description: "Failed to load required data for transcript generation",
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

    // connected to the server, get payload and call the generate_transcript server endpoint
    socket.on("connect", () => {
      console.log("Socket connected successfully");
      if (progressCallback) {
        progressCallback(0, "Connected to server");
      }

      // Research shows that COT style prompts perform better than non-COT style prompts
      // so we're going to extend the prompt with the COT style, verification, instructions, and examples
      let extended_prompt = prompt.prompt_text;
      if (prompt.use_chain_of_thought) {
        extended_prompt = prompt.prompt_text + "\n\n" +
          "Chain of Thought style: " + prompt.cot_style + "\n\n" +
          "Chain of Thought verification: " + prompt.cot_verification + "\n\n" +
          "Chain of Thought instructions: " + prompt.cot_instructions + "\n\n" +
          "Chain of Thought examples: " + prompt.cot_examples;
      } 
      
      const payload = {
        transcript_only: true,
        text: document.doc_extracted_text || "", 
        urls: [],
        name: document.doc_name,
        tagline: document.doc_desc,
        is_long_form: prompt.is_long_form,
        word_count: prompt.word_count,
        conversation_style: prompt.conversation_style,
        roles_person1: prompt.roles_person1,
        roles_person2: prompt.roles_person2,
        dialogue_structure: prompt.dialogue_structure,
        engagement_techniques: prompt.engagement_techniques,
        user_instructions: extended_prompt,
        ending_message: prompt.ending_message,
        creativity: prompt.creativity,
        llm_provider: model.model_provider,
        llm_model_name: model.model_name,
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
    socket.on("complete", async (data: {transcript: string }) => {
      // Update the existing transcript with the new text
      const updatedTranscript: Transcript = {
        ...transcript,
        transcript_text: data.transcript || transcript.transcript_text,
        updated_at: new Date()
      };
      
      try {
        // Save the updated transcript
        await transcriptsService.updateTranscript(transcript.id, updatedTranscript);
        
        if (toast) {
          toast({
            title: "Success",
            description: "Transcript updated successfully",
          });
        }

        // Update progress to 100%
        if (progressCallback) {
          progressCallback(100, "Completed generation...");
        }

        // Return the updated transcript
        return updatedTranscript;
      } catch (error) {
        console.error("Error updating transcript with new text:", error);
        if (toast) {
          toast({
            title: "Error",
            description: "Failed to update transcript with new text",
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
    console.error("Error updating transcript:", error);
    if (toast) {
      toast({
        title: "Error",
        description: "Failed to update transcript",
        variant: "destructive",
      });
    }
  }
};

//////////////////////////////////////////////////////////////////////////////
// This is the main component for creating a transcript
//////////////////////////////////////////////////////////////////////////////
export default function CreateTranscript() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [documents, setDocuments] = useState<Array<{ id: string; title: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string }>>([]);
  const [models, setModels] = useState<Array<{ id: string; title: string }>>([]);
  const [recentTranscripts, setRecentTranscripts] = useState<Transcript[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [generatedTranscript, setGeneratedTranscript] = useState<Transcript | null>(null);
  const [hasGeneratedTranscript, setHasGeneratedTranscript] = useState(false);
  const [sourceType, setSourceType] = useState("text"); // 'urls' or 'text'
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
    loadRecentTranscripts();
  }, []);

  // This is a helper function to load recent transcripts
  const loadRecentTranscripts = async () => {
    try {
      const transcripts = await transcriptsService.getRecentTranscripts(5);
      if (transcripts) {       
        setRecentTranscripts(transcripts as Transcript[]);
      }
    } catch (error) {
      console.error("Error loading recent transcripts:", error);
    }
  };

  // This is a helper function to load the documents and prompts
  const loadSelectionData = async () => {
    try {
      const [loadedDocuments, loadedPrompts, loadedModels] = await Promise.all([
        documentsService.getAllDocuments(),
        promptsService.getAllPrompts(),
        modelsService.getAllModels(),
      ]);

      if (loadedDocuments) {
        setDocuments(loadedDocuments
          .filter(d => d.is_active && !d.is_deleted)
          .map(d => ({ id: d.id, title: d.doc_name })));
      }
      if (loadedPrompts) {
        setPrompts(loadedPrompts
          .filter(p => p.is_active && !p.is_deleted)
          .map(p => ({ id: p.id, title: p.prompt_name })));
      }
      if (loadedModels) {
        setModels(loadedModels
          .filter(m => m.is_active && !m.is_deleted && m.model_type === 'LLM')
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

  // This is a helper function to handle the document selection
  const handleDocumentSelect = async (docId: string) => {
    try {
      const doc = await documentsService.getDocumentById(docId);
      if (doc) {
        setSelectedDocument(doc as Document);
        setHasGeneratedTranscript(false);
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast({
        title: "Error",
        description: "Failed to load selected document",
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
        setHasGeneratedTranscript(false);
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

  // Handle model selection
  const handleModelSelect = async (modelId: string) => {
    try {
      const model = await modelsService.getModelById(modelId);
      if (model) {
        setSelectedModel(model as Model);
        setHasGeneratedTranscript(false);
      }
    } catch (error) {
      console.error("Error loading model:", error);
      toast({
        title: "Error",
        description: "Failed to load selected model",
        variant: "destructive",
      });
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle the transcript generation
  //////////////////////////////////////////////////////////////////////////////
  const handleGenerateTranscript = async () => {
    if (!selectedDocument || !selectedPrompt || !selectedModel) {
      toast({
        title: "Error",
        description: "Please select a document, prompt, and model",
        variant: "destructive",
      });
      return;
    }

    // validate either text or urls are present
    if (sourceType === 'text' && !selectedDocument.doc_extracted_text) {
      toast({
        title: "Error",
        description: "No extracted text found",
        variant: "destructive",
      });
      return;
    }
    if (sourceType === 'urls' && (!selectedDocument.doc_source_urls || selectedDocument.doc_source_urls.length === 0)) {
      toast({
        title: "Error",
        description: "No source URLs or files found",
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

        // Research shows that COT style prompts perform better than non-COT style prompts
        // so we're going to extend the prompt with the COT style, verification, instructions, and examples
        let extended_prompt = selectedPrompt.prompt_text;
        if (selectedPrompt.use_chain_of_thought) {
          extended_prompt = selectedPrompt.prompt_text + "\n\n" +
            "Chain of Thought style: " + selectedPrompt.cot_style + "\n\n" +
            "Chain of Thought verification: " + selectedPrompt.cot_verification + "\n\n" +
            "Chain of Thought instructions: " + selectedPrompt.cot_instructions + "\n\n" +
            "Chain of Thought examples: " + selectedPrompt.cot_examples;
        } 
  
        const payload = {
          transcript_only: true,
          text: sourceType === 'text' ? (selectedDocument.doc_extracted_text || "") : "", 
          urls: sourceType === 'urls' ? (selectedDocument.doc_source_urls || []) : [],
          name: selectedDocument.doc_name,
          tagline: selectedDocument.doc_desc,
          is_long_form: selectedPrompt.is_long_form,
          word_count: selectedPrompt.word_count,
          conversation_style: selectedPrompt.conversation_style,
          roles_person1: selectedPrompt.roles_person1,
          roles_person2: selectedPrompt.roles_person2,
          dialogue_structure: selectedPrompt.dialogue_structure,
          engagement_techniques: selectedPrompt.engagement_techniques,
          user_instructions: extended_prompt,
          ending_message: selectedPrompt.ending_message,
          creativity: selectedPrompt.creativity,
          llm_provider: selectedModel.model_provider,  // Podcastfy doesn't have llm_provider
          llm_model_name: selectedModel.model_name, // specific model version
          secret_key: sessionStorage.getItem("secret_key") || "",
        };

        // call the generate_podcast server endpoint with the payload
        socket.emit("generate_podcast", payload);
      });

      // handle the progress event
      socket.on("progress", (data: { progress: number; message: string }) => {
        setProgress(data.progress);
        setStatusMessage("Generating transcript content...");
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
      socket.on("complete", async (data: {transcript: string }) => {
        const newTranscript: Transcript = {
          id: "transcript_" + nanoid(20),  
          doc_id: selectedDocument.id,
          prompt_id: selectedPrompt.id,
          model_id: selectedModel.id,
          transcript_title: `${selectedDocument.doc_name} - ${selectedPrompt.prompt_name}`,
          transcript_type: "interview",
          topic_tags: selectedDocument.topic_tags,
          // transcript_model: selectedModel.model_name,
          // transcript_model_name: selectedModel.model_name,
          transcript_text: data.transcript,
          is_active: true,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
        };
        console.log("Transcript generation complete");        
        setGeneratedTranscript(newTranscript);
        setHasGeneratedTranscript(true);
        cleanup();
      });

      // Handle component unmount
      return () => cleanup();
    } catch (error) {
      console.error("Error generating transcript:", error);
      toast({
        title: "Error",
        description: "Failed to generate transcript",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  }; // handleGenerateTranscript

  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle the transcript saving
  //////////////////////////////////////////////////////////////////////////////
  const handleSaveTranscript = async (transcript: Transcript) => {
    try {
      await transcriptsService.createTranscript(transcript.id, transcript);
      toast({
        title: "Success",
        description: "Transcript saved successfully",
      });
      setGeneratedTranscript(null);
      setSelectedDocument(null);
      setSelectedPrompt(null);
      setSelectedModel(null);
      setHasGeneratedTranscript(false);
    } catch (error) {
      console.error("Error saving transcript:", error);
      toast({
        title: "Error",
        description: "Failed to save transcript",
        variant: "destructive",
      });
    }
  };

  // This is a helper function to handle the transcript cancellation
  const handleCancel = () => {
    setGeneratedTranscript(null);
    setSelectedDocument(null);
    setSelectedPrompt(null);
    setSelectedModel(null);
    setHasGeneratedTranscript(false);
  };

  // This is a helper function to handle transcript selection
  const handleTranscriptSelect = (transcript: Transcript) => {
    // Store the selected transcript ID in localStorage
    localStorage.setItem('selectedTranscriptId', transcript.id);
    
    // Dispatch a custom event that the App component can listen for
    const event = new CustomEvent('switchToTab', { 
      detail: { tab: 'transcripts' } 
    });
    window.dispatchEvent(event);
  };

  //////////////////////////////////////////////////////////////////////////////
  // This is the main component for creating a transcript
  //////////////////////////////////////////////////////////////////////////////
  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-1/3 p-4 border-r space-y-4">
        <div className="space-y-6">
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2 text-muted-foreground pl-3">1. Select a Document</h3>
            <div className="space-y-2">
              <SelectDialog
                title="Select Document"
                items={documents}
                onSelect={handleDocumentSelect}
                trigger={
                  <Button variant="outline" className="w-full justify-between pl-7">
                    <span className="truncate mr-2 max-w-[calc(100%-24px)]">
                      {selectedDocument ? selectedDocument.doc_name : "Select Document"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </Button>
                }
              />
              <div className="pl-7 pr-4">
                <div className="text-md font-medium text-muted-foreground mb-1">Use:</div>
                <Tabs defaultValue="text" value={sourceType} onValueChange={setSourceType} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="text" className="flex-1">Extracted Text</TabsTrigger>
                    <TabsTrigger value="urls" className="flex-1">Source URLs</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-muted-foreground pl-3">2. Select a Prompt</h3>
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
            <h3 className="text-lg font-medium mb-2 text-muted-foreground pl-3">3. Select a LLM Model</h3>
            <SelectDialog
              title="Select LLM Model"
              items={models}
              onSelect={handleModelSelect}
              trigger={
                <Button variant="outline" className="w-full justify-between pl-7">
                  <span className="truncate mr-2 max-w-[calc(100%-24px)]">
                    {selectedModel ? selectedModel.model_name : "Select LLM Model"}
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
                {statusMessage || `Generating transcript... ${progress}%`}
                </p>
              </div>
            )}
            <Button
              className="w-full text-lg"
              onClick={handleGenerateTranscript}
              disabled={!selectedDocument || !selectedPrompt || !selectedModel || isGenerating || hasGeneratedTranscript}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating transcript...
                </>
              ) : (
                <div className="flex items-center"> 
                  <Play className="mr-2 h-4 w-4" />
                  Generate Transcript
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-2/3 p-4 space-y-4 overflow-y-auto">
        {recentTranscripts.length > 0 && !selectedDocument && !selectedPrompt && !selectedModel && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-medium text-muted-foreground pl-3">
              <Clock className="h-5 w-5" />
              Recent Transcripts
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recentTranscripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleTranscriptSelect(transcript)}
                >
                  <div className="font-medium truncate">{transcript.transcript_title}</div>
                  <div className="flex items-center text-sm gap-2 text-muted-foreground truncate mt-1">
                    <span className="whitespace-nowrap">
                      {transcript.updated_at 
                        ? (transcript.updated_at instanceof Date 
                            ? transcript.updated_at.toLocaleString() 
                            : typeof transcript.updated_at === 'object' && 'seconds' in transcript.updated_at
                              ? new Date((transcript.updated_at as any).seconds * 1000).toLocaleString()
                              : new Date(transcript.updated_at as any).toLocaleString())
                        : ""}
                    </span>
                    <span className="truncate">{transcript.transcript_type}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {transcript.topic_tags?.join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t-8 border-zinc-200 my-4"></div>
          </div>
        )}

        {generatedTranscript ? (
          <>
            <div className="mt-4">
              <TranscriptDetails
                transcript={generatedTranscript}
                onSave={handleSaveTranscript}
                onCancel={handleCancel}
                isNew={true}
                isReadOnly={false}
              />
              <div className="border-t-8 border-zinc-200 my-4"></div>
            </div>
            <div className="border-t pt-4">
              <DocumentDetails
                document={selectedDocument}
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
                model={selectedModel}
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
            {selectedDocument && (
              <div className="mt-4">
                <DocumentDetails
                  document={selectedDocument}
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
            {selectedModel && (
              <div className="mt-4">
                <ModelDetails
                  model={selectedModel}
                  onSave={() => {}}
                  onCancel={() => {}}
                  isNew={false}
                  isReadOnly={true}
                />
                <div className="border-t-8 border-zinc-200 my-4"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 