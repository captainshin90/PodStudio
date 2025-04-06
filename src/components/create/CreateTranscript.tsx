import { useState, useEffect } from "react";
import { Document } from "@/lib/schemas/documents";
import { Prompt } from "@/lib/schemas/prompts";
import { Transcript } from "@/lib/schemas/transcripts";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, Play } from "lucide-react";
import { io } from "socket.io-client";
import { documentsService, promptsService, transcriptsService } from "@/lib/services/database-service";
import DocumentDetails from "@/components/documents/DocumentDetails";
import PromptDetails from "@/components/prompts/PromptDetails";
import TranscriptDetails from "@/components/transcripts/TranscriptDetails";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@radix-ui/react-progress";
import { nanoid } from "nanoid";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
// This is the main component for creating a transcript
//////////////////////////////////////////////////////////////////////////////
export default function CreateTranscript() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [documents, setDocuments] = useState<Array<{ id: string; title: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [generatedTranscript, setGeneratedTranscript] = useState<Transcript | null>(null);
  const [hasGeneratedTranscript, setHasGeneratedTranscript] = useState(false);
  const [sourceType, setSourceType] = useState("text"); // 'urls' or 'text'

  useEffect(() => {
    loadSelectionData();
  }, []);

  // This is a helper function to load the documents and prompts
  const loadSelectionData = async () => {
    try {
      const [loadedDocuments, loadedPrompts] = await Promise.all([
        documentsService.getAllDocuments(),
        promptsService.getAllPrompts()
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
    } catch (error) {
      console.error("Error loading selection data:", error);
      toast({
        title: "Error",
        description: "Failed to load documents and prompts",
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

  //////////////////////////////////////////////////////////////////////////////
  // This is a helper function to handle the transcript generation
  //////////////////////////////////////////////////////////////////////////////
  const handleGenerateTranscript = async () => {
    if (!selectedDocument || !selectedPrompt) return;

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

        const payload = {
          transcript_only: true,
          text: sourceType === 'text' ? (selectedDocument.doc_extracted_text || "") : "", 
          urls: sourceType === 'urls' ? (selectedDocument.doc_source_urls || []) : [],
          name: selectedDocument.doc_name,
          tagline: selectedDocument.doc_desc,
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
      socket.on("complete", async (data: {transcript: string }) => {
        const newTranscript: Transcript = {
          id: "transcript_" + nanoid(20),  
          // transcript_id: transcriptId, 
          doc_id: selectedDocument.id,
          prompt_id: selectedPrompt.id,
          transcript_title: `${selectedDocument.doc_name} - ${selectedPrompt.prompt_name}`,
          transcript_type: "interview",
          topic_tags: selectedDocument.topic_tags,
          transcript_model: selectedPrompt.tts_model,
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
    setHasGeneratedTranscript(false);
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
              disabled={!selectedDocument || !selectedPrompt || isGenerating || hasGeneratedTranscript}
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
        {generatedTranscript ? (
          <>
            <TranscriptDetails
              transcript={generatedTranscript}
              onSave={handleSaveTranscript}
              onCancel={handleCancel}
              isNew={true}
              isReadOnly={false}
            />
            <div className="border-t pt-4">
              <DocumentDetails
                document={selectedDocument}
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
            {selectedDocument && (
              <DocumentDetails
                document={selectedDocument}
                onSave={() => {}}
                onCancel={() => {}}
                isNew={false}
                isReadOnly={true}
              />
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