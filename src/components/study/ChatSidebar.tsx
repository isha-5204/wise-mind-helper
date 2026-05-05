import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type Conversation = { id: string; title: string; updated_at: string };

export const ChatSidebar = ({
  userId,
  activeId,
  onSelect,
  onNew,
  refreshKey,
}: {
  userId: string;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  refreshKey: number;
}) => {
  const [convs, setConvs] = useState<Conversation[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id,title,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) return toast.error(error.message);
    setConvs(data || []);
  };

  useEffect(() => {
    load();
  }, [userId, refreshKey]);

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setConvs((c) => c.filter((x) => x.id !== id));
    if (activeId === id) onNew();
  };

  return (
    <aside className="flex flex-col h-full w-full bg-card/60 backdrop-blur-sm border-r border-border">
      <div className="p-3">
        <Button onClick={onNew} variant="hero" className="w-full rounded-2xl gap-2">
          <Sparkles className="h-4 w-4" />
          New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {convs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No chats yet 🌸<br />Start a new one!
          </p>
        )}
        {convs.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "group w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all",
              activeId === c.id
                ? "bg-gradient-hero text-primary-foreground shadow-card"
                : "hover:bg-accent/60 text-foreground"
            )}
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="flex-1 truncate">{c.title}</span>
            <button
              onClick={(e) => remove(c.id, e)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20",
                activeId === c.id && "opacity-80"
              )}
              aria-label="Delete chat"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>
    </aside>
  );
};
