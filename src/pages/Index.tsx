import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, BookOpen, FileText, MessageCircle } from "lucide-react";
import { NotesGenerator } from "@/components/study/NotesGenerator";
import { Summarizer } from "@/components/study/Summarizer";
import { Chatbot } from "@/components/study/Chatbot";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl flex items-center gap-3 py-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-elegant">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Study Assistant+</h1>
            <p className="text-xs text-muted-foreground">Notes · Summaries · Doubts — powered by AI</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-10">
        <section className="text-center mb-10 animate-in fade-in-50 slide-in-from-bottom-3">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 bg-gradient-hero bg-clip-text text-transparent">
            Study smarter, not harder
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Generate revision notes, summarize documents, and clear academic doubts — all in one place.
          </p>
        </section>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="notes" className="gap-2">
              <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Summarize</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">Doubts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <NotesGenerator />
          </TabsContent>
          <TabsContent value="summary">
            <Summarizer />
          </TabsContent>
          <TabsContent value="chat">
            <Chatbot />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-6">
        Built for students · MVP prototype
      </footer>
    </div>
  );
};

export default Index;
