const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildSystem = (language: string, name?: string, klass?: string | null) => `
You are Nexus, a friendly AI study buddy for students. You help with three things:
1. Generating short revision notes on any topic.
2. Summarizing documents the student attaches or pastes.
3. Solving academic doubts clearly and simply.

Student profile: ${name ? `Name: ${name}.` : ""} ${klass ? `Class/Year: ${klass}.` : ""}

LANGUAGE RULE (very important):
- Always reply in: ${language}.
- If the student writes in another language, still reply in ${language} unless they explicitly ask otherwise.
- "Hinglish" means casual Hindi written in Roman/English script mixed with English words (like Indian students chat).
- Keep tone warm, encouraging, and student-friendly.

FORMAT:
- Use clean Markdown (headings, bullets, bold) where helpful.
- For notes: give 5-7 crisp bullets + 3-5 important questions.
- For summaries: short paragraph + key points list.
- For doubts: clear explanation with a simple example.
- Keep answers concise unless asked for depth.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language, studentName, studentClass } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = typeof language === "string" && language.trim() ? language.trim() : "English";
    const system = buildSystem(lang, studentName, studentClass);

    const chatMessages = [{ role: "system", content: system }, ...messages];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Lovable workspace." }), {
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
    console.error("nexus error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
