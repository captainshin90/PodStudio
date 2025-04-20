import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreatePodcast from "@/components/create/CreatePodcast";
import { TopicPodcast } from "@/components/create/TopicPodcast";
import EpisodesPage from "@/pages/episodes";
import DocumentsPage from "@/pages/documents";
import PromptsPage from "@/pages/prompts";
import TranscriptsPage from "@/pages/transcripts";
import PodcastsPage from "@/pages/podcasts";
import ModelsPage from "@/pages/models";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
//  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, Megaphone } from "lucide-react";
import { APIKeys } from "@/components/settings/APIKeys";
import CreateTranscript from "@/components/create/CreateTranscript";

///////////////////////////////////////////////////////////////////////////////
// App component
///////////////////////////////////////////////////////////////////////////////
export default function App() {
  const [activeMainTab, setActiveMainTab] = useState("create");
//  const [activePodcastTab, setActivePodcastTab] = useState("custom");

  // Add event listener for tab switching
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent) => {
      if (event.detail && event.detail.tab) {
        setActiveMainTab(event.detail.tab);
      }
    };

    // Add the event listener
    window.addEventListener('switchToTab', handleTabSwitch as EventListener);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('switchToTab', handleTabSwitch as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-red-700" />
            <h1 className="text-3xl font-light from-accent-foreground font-['Times']">Four Freedoms Studio</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4">
                <APIKeys />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto py-0 px-6">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="w-full border-b mb-3">
            <TabsTrigger value="create" className="text-lg font-bold data-[state=active]:text-red-700">Create</TabsTrigger>
            <div className="h-6 w-px bg-border mx-2 self-center"></div>
            <TabsTrigger value="episodes" className="text-md data-[state=active]:text-red-700">Episodes</TabsTrigger>
            <TabsTrigger value="transcripts" className="text-md data-[state=active]:text-red-700">Transcripts</TabsTrigger>
            <TabsTrigger value="podcasts" className="text-md data-[state=active]:text-red-700">Podcasts</TabsTrigger>
            <TabsTrigger value="prompts" className="text-md data-[state=active]:text-red-700">Prompts</TabsTrigger>
            <TabsTrigger value="documents" className="text-md data-[state=active]:text-red-700">Documents</TabsTrigger>
            <TabsTrigger value="models" className="text-md data-[state=active]:text-red-700">Models</TabsTrigger>
          </TabsList>

          {/* Podcasts Section */}
          <TabsContent value="create">
            {/* <Tabs value={activePodcastTab} onValueChange={setActivePodcastTab} */}
            <Tabs defaultValue="podcast" className="py-0">
            <TabsList className="mb-4">
                <TabsTrigger value="podcast" className="data-[state=active]:text-red-700">Create Podcast</TabsTrigger>
                <TabsTrigger value="transcript" className="data-[state=active]:text-red-700">Create Transcript</TabsTrigger>
                <TabsTrigger value="topic" className="data-[state=active]:text-red-700">Research Topic</TabsTrigger>
              </TabsList>
              <TabsContent value="podcast">
                <CreatePodcast />
              </TabsContent>
              <TabsContent value="transcript">
                <CreateTranscript />
              </TabsContent>
              <TabsContent value="topic">
                <TopicPodcast />
              </TabsContent>
            </Tabs>
          </TabsContent>
          {/* Podcasts Section */}
          <TabsContent value="podcasts">
            <PodcastsPage />
          </TabsContent>
          {/* Episodes Section */}
          <TabsContent value="episodes">
            <EpisodesPage />
          </TabsContent>
          {/* Transcripts Section */}
          <TabsContent value="transcripts">
            <TranscriptsPage />
          </TabsContent>
          {/* Prompts Section */}
          <TabsContent value="prompts">
            <PromptsPage />
          </TabsContent>
          {/* Documents Section */}
          <TabsContent value="documents">
            <DocumentsPage />
          </TabsContent>
          {/* Models Section */}
          <TabsContent value="models">
            <ModelsPage />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
}

