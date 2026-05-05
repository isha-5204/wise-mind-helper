import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, Loader2, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Nexus } from "@/components/study/Nexus";
import { ChatSidebar } from "@/components/study/ChatSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const nav = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/auth", { replace: true });
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-subtle overflow-hidden">
      <header className="border-b border-border bg-card/60 backdrop-blur-md z-20">
        <div className="flex items-center justify-between gap-3 py-2.5 px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="h-9 w-9 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-elegant">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Nexus</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {profile ? `Hi ${profile.full_name?.split(" ")[0]} 🌸` : "Your AI study buddy"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - desktop */}
        <div className="hidden md:block w-64 shrink-0">
          <ChatSidebar
            userId={user.id}
            activeId={activeConv}
            onSelect={(id) => setActiveConv(id)}
            onNew={() => setActiveConv(null)}
            refreshKey={refreshKey}
          />
        </div>

        {/* Sidebar - mobile drawer */}
        {sidebarOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-30"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="md:hidden fixed left-0 top-[57px] bottom-0 w-72 z-40 animate-in slide-in-from-left">
              <ChatSidebar
                userId={user.id}
                activeId={activeConv}
                onSelect={(id) => {
                  setActiveConv(id);
                  setSidebarOpen(false);
                }}
                onNew={() => {
                  setActiveConv(null);
                  setSidebarOpen(false);
                }}
                refreshKey={refreshKey}
              />
            </div>
          </>
        )}

        <main className="flex-1 p-2 sm:p-4 overflow-hidden">
          <Nexus
            profile={profile}
            userId={user.id}
            conversationId={activeConv}
            onConversationCreated={(id) => {
              setActiveConv(id);
              setRefreshKey((k) => k + 1);
            }}
            onConversationUpdated={() => setRefreshKey((k) => k + 1)}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
