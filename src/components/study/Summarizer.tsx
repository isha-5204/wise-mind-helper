import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarkdownView } from "@/components/MarkdownView";
import { Textarea } from "@/components/ui/textarea";

export const Summarizer = () => {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".txt")) return toast.error("Please upload a .txt file");
    if (f.size > 1024 * 200) return toast.error("File too large (max 200KB)");
    const t = await f.text();
    setText(t);
    setFileName(f.name);
  };

  const summarize = async () => {
    const t = text.trim();
    if (!t) return toast.error("Please upload a file or paste some text");
    if (t.length > 20000) return toast.error("Text too long (max 20,000 chars)");
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("study-assistant", {
        body: { mode: "summarize", input: t },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data.content);
    } catch (e: any) {
      toast.error(e.message || "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()} className="flex-1">
          <Upload className="h-4 w-4" />
          {fileName ? fileName : "Upload .txt file"}
        </Button>
        <Button onClick={summarize} disabled={loading} variant="hero">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Summarize
        </Button>
      </div>
      <Textarea
        placeholder="…or paste your text here"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFileName("");
        }}
        rows={6}
      />
      {output && (
        <Card className="p-6 shadow-card animate-in fade-in-50">
          <MarkdownView content={output} />
        </Card>
      )}
    </div>
  );
};
