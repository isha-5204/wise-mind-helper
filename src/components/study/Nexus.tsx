import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User, Paperclip, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Profile } from "@/hooks/useAuth";

type Msg = { role: "user" | "assistant"; content: string };

const LANGUAGES = ["English", "Hindi", "Hinglish", "Telugu", "Marathi", "Punjabi", "Tamil", "Bengali"];

export const Nexus = ({
  profile,
  userId,
  conversationId,
  onConversationCreated,
  onConversationUpdated,
}: {
  profile: Profile | null;
  userId: string;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  onConversationUpdated: () => void;
}) => {
  const [language, setLanguage] = useState(profile?.preferred_language || "English");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attached, setAttached] = useState<{ name: string; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.preferred_language) setLanguage(profile.preferred_language);
  }, [profile]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load messages when conversation switches
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    supabase
      .from("messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) return toast.error(error.message);
        setMessages((data || []) as Msg[]);
      });
  }, [conversationId]);

  const onFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".txt")) return toast.error("Only .txt files supported 💗");
    if (f.size > 1024 * 200) return toast.error("File too large (max 200KB)");
    const text = await f.text();
    setAttached({ name: f.name, text });
    toast.success(`Attached ${f.name} ✨`);
  };

  const send = async () => {
    const q = input.trim();
    if (!q && !attached) return;
    const userContent = attached
      ? `${q || "Please summarize this document."}\n\n[Attached file: ${attached.name}]\n${attached.text}`
      : q;
    if (userContent.length > 25000) return toast.error("Message too long");

    const visibleUser = attached ? `${q || "Summarize this document"} 📎 ${attached.name}` : q;
    const next: Msg[] = [...messages, { role: "user", content: visibleUser }];
    setMessages(next);
    setInput("");
    setAttached(null);
    setLoading(true);

    try {
      // Ensure conversation exists
      let convId = conversationId;
      if (!convId) {
        const title = (q || attached?.name || "New chat").slice(0, 60);
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: userId, title })
          .select("id")
          .single();
        if (error) throw error;
        convId = data.id;
        onConversationCreated(convId);
      }

      // Persist user message
      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: userId,
        role: "user",
        content: visibleUser,
      });

      const apiMessages = [...messages, { role: "user", content: userContent }];
      const { data, error } = await supabase.functions.invoke("study-assistant", {
        body: {
          mode: "chat",
          messages: apiMessages,
          language,
          studentName: profile?.full_name,
          studentClass: profile?.class,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages([...next, { role: "assistant", content: data.content }]);

      await supabase.from("messages").insert({
        conversation_id: convId,
        user_id: userId,
        role: "assistant",
        content: data.content,
      });
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      onConversationUpdated();
    } catch (e: any) {
      toast.error(e.message || "Nexus couldn't respond");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full min-h-[28rem] shadow-card overflow-hidden rounded-3xl border-2">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card/80 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-elegant">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold flex items-center gap-1">Nexus <span className="text-xs">😊</span></p>
            <p className="text-xs text-muted-foreground">Your cuddly study buddy</p>
          </div>
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-32 h-8 text-xs rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-subtle">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm pt-12 space-y-3">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-hero flex items-center justify-center shadow-elegant animate-pulse">
              <Bot className="h-8 w-8 text-primary-foreground" />
            </div>
            <p className="font-semibold text-foreground text-base">
              Hi {profile?.full_name?.split(" ")[0] || "friend"}! 🌸
            </p>
            <p>Ask me to make notes, summarize a doc, or solve any doubt~</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["Newton's laws notes ✨", "Explain photosynthesis 🌱", "Summarize my notes 📎"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s.replace(/[✨🌱📎]/g, "").trim())}
                  className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-2xl bg-gradient-hero flex items-center justify-center shrink-0 shadow-card">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-3xl px-4 py-2.5 ${
                m.role === "user"
                  ? "bg-gradient-hero text-primary-foreground rounded-br-md shadow-card"
                  : "bg-card border border-border rounded-bl-md"
              }`}
            >
              {m.role === "assistant" ? <MarkdownView content={m.content} /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
            </div>
            {m.role === "user" && (
              <div className="h-8 w-8 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-card">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-3xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {attached && (
        <div className="px-4 py-2 border-t border-border bg-card flex items-center gap-2 text-xs">
          <Paperclip className="h-3 w-3" />
          <span className="truncate flex-1">{attached.name}</span>
          <button onClick={() => setAttached(null)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
        </div>
      )}

      <div className="border-t border-border p-3 flex gap-2 bg-card/80 backdrop-blur">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={loading} aria-label="Attach file" className="rounded-full">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder="Ask Nexus anything… 💭"
          value={input}
          maxLength={2000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          disabled={loading}
          className="rounded-full"
        />
        <Button onClick={send} disabled={loading || (!input.trim() && !attached)} variant="hero" size="icon" className="rounded-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
};
