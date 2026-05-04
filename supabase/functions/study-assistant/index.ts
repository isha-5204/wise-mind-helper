const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  notes: `You are a study notes generator for undergraduate students. Given a topic, return concise, exam-ready study material in clean Markdown with EXACTLY this structure:

## 📘 Short Notes
- 5 to 6 crisp bullet points (each 1-2 lines, factually accurate)

## ❓ Important Questions
1. Five important exam-style questions (numbered list)

Keep language simple, clear, and student-friendly.`,
  summarize: `You are a document summarizer for students. Given the raw text of a document, produce clean Markdown with EXACTLY:

## 📝 Summary
A concise paragraph (4-6 sentences) capturing the main idea.

## 🔑 Key Points
- 5 to 7 bullet points listing the most important takeaways.`,
  chat: `You are a helpful study tutor for undergraduate students. Answer the user's academic doubt clearly and concisely (3-6 sentences). Use simple language, give examples when useful, and format with Markdown if helpful. If the question is unclear, ask one short clarifying question.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, input, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = SYSTEM_PROMPTS[mode];
    if (!system) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let chatMessages: Array<{ role: string; content: string }>;
    if (mode === "chat" && Array.isArray(messages)) {
      chatMessages = [{ role: "system", content: system }, ...messages];
    } else {
      const userContent =
        mode === "notes"
          ? `Topic: ${input}`
          : mode === "summarize"
          ? `Document content:\n\n${input}`
          : String(input ?? "");
      chatMessages = [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ];
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to your Lovable workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("study-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
