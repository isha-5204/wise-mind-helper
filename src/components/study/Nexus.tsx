import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Profile } from "@/hooks/useAuth";

type Msg = { role: "user" | "assistant"; content: string };

const LANGUAGES = ["English", "Hindi", "Hinglish", "Telugu", "Marathi", "Punjabi", "Tamil", "Bengali"];

export const Nexus = ({ profile }: { profile: Profile | null }) => {
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

  const onFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".txt")) return toast.error("Only .txt files supported");
    if (f.size > 1024 * 200) return toast.error("File too large (max 200KB)");
    const text = await f.text();
    setAttached({ name: f.name, text });
    toast.success(`Attached ${f.name}`);
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
      const apiMessages = [...messages, { role: "user", content: userContent }];
      const { data, error } = await supabase.functions.invoke("study-assistant", {
        body: { mode: "chat", messages: apiMessages, language, studentName: profile?.full_name, studentClass: profile?.class },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch (e: any) {
      toast.error(e.message || "Nexus couldn't respond");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[28rem] shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-hero flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Nexus</p>
            <p className="text-xs text-muted-foreground">Notes · Summaries · Doubts</p>
          </div>
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-subtle">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm pt-12 space-y-2">
            <Bot className="h-10 w-10 mx-auto opacity-50" />
            <p className="font-medium text-foreground">Hi {profile?.full_name?.split(" ")[0] || "there"}! I'm Nexus 👋</p>
            <p>Ask me to make notes, summarize a document, or solve any doubt.</p>
            <p className="text-xs">Try: "Newton's laws ke notes Hindi mein" or attach a .txt file</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-gradient-hero flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
              }`}
            >
              {m.role === "assistant" ? <MarkdownView content={m.content} /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
            </div>
            {m.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-hero flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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

      <div className="border-t border-border p-3 flex gap-2 bg-card">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={loading} aria-label="Attach file">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder="Ask Nexus anything…"
          value={input}
          maxLength={2000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || (!input.trim() && !attached)} variant="hero" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
