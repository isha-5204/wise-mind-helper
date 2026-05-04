import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";

export const NotesGenerator = () => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  const generate = async () => {
    const t = topic.trim();
    if (!t) return toast.error("Please enter a topic");
    if (t.length > 200) return toast.error("Topic too long (max 200 chars)");
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("study-assistant", {
        body: { mode: "notes", input: t },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.content);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="e.g. Newton's Laws of Motion"
          value={topic}
          maxLength={200}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          className="flex-1"
        />
        <Button onClick={generate} disabled={loading} variant="hero">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate
        </Button>
      </div>
      {output && (
        <Card className="p-6 shadow-card animate-in fade-in-50">
          <MarkdownView content={output} />
        </Card>
      )}
    </div>
  );
};
