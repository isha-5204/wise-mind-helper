import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";

type Msg = { role: "user" | "assistant"; content: string };

export const Chatbot = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    if (q.length > 1000) return toast.error("Question too long (max 1000 chars)");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("study-assistant", {
        body: { mode: "chat", messages: next },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch (e: any) {
      toast.error(e.message || "Failed to get answer");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[28rem] shadow-card overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-subtle">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm pt-16">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Ask any academic question to get started
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
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}
            >
              {m.role === "assistant" ? <MarkdownView content={m.content} /> : <p className="text-sm">{m.content}</p>}
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
      <div className="border-t border-border p-3 flex gap-2 bg-card">
        <Input
          placeholder="Ask a doubt…"
          value={input}
          maxLength={1000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()} variant="hero" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
