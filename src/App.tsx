import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomPodcast } from "@/components/CustomPodcast";
import { TopicPodcast } from "@/components/TopicPodcast";
import EpisodesPage from "@/pages/episodes";
import DocumentsPage from "@/pages/documents";
import PromptsPage from "@/pages/prompts";
import TranscriptsPage from "@/pages/transcripts";
import PodcastsPage from "@/pages/podcasts";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
//  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { APIKeys } from "@/components/APIKeys";

///////////////////////////////////////////////////////////////////////////////
// App component
///////////////////////////////////////////////////////////////////////////////
export default function App() {
  const [activeMainTab, setActiveMainTab] = useState("create");
//  const [activePodcastTab, setActivePodcastTab] = useState("custom");

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Four Freedoms Studio</h1>
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

      <main className="container mx-auto py-0 px-4">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="w-full border-b mb-6">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Podcasts Section */}
          <TabsContent value="create">
            {/* <Tabs value={activePodcastTab} onValueChange={setActivePodcastTab} */}
            <Tabs>
            <TabsList className="mb-4">
                <TabsTrigger value="custom">Custom Podcast</TabsTrigger>
                <TabsTrigger value="topic">Topic Research</TabsTrigger>
              </TabsList>
              <TabsContent value="custom">
                <CustomPodcast />
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

          {/* Documents Section */}
          <TabsContent value="documents">
            <DocumentsPage />
          </TabsContent>

          {/* Transcripts Section */}
          <TabsContent value="transcripts">
            <TranscriptsPage />
          </TabsContent>

          {/* Prompts Section */}
          <TabsContent value="prompts">
            <PromptsPage />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
}

