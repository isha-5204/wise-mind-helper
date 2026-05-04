import ReactMarkdown from "react-markdown";

export const MarkdownView = ({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90 prose-headings:font-semibold">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
);
