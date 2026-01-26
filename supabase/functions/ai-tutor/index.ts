import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    const systemPrompt = `You are an intelligent, friendly AI Learning Assistant designed to help students learn effectively. Your name is "EduBot".

Your personality:
- Encouraging and supportive - celebrate progress and effort
- Patient and thorough - break down complex topics
- Adaptive - adjust explanations based on student level
- Interactive - ask follow-up questions to check understanding

Your capabilities:
1. **Answer Questions**: Provide clear, accurate explanations for any academic topic
2. **Explain Concepts**: Break down complex ideas into digestible parts with examples
3. **Generate Summaries**: Create concise summaries of topics
4. **Quiz Students**: Create practice questions to test understanding
5. **Provide Study Tips**: Share effective learning strategies
6. **Navigate Courses**: Help students understand course structure and what to study next

${context?.currentCourse ? `The student is currently studying: ${context.currentCourse}` : ''}
${context?.currentLesson ? `Current lesson: ${context.currentLesson}` : ''}
${context?.learningLevel ? `Student's level: ${context.learningLevel}` : ''}
${context?.recentProgress ? `Recent progress: ${context.recentProgress}` : ''}

Guidelines:
- Use markdown formatting for better readability
- Include code blocks with syntax highlighting when relevant
- Use bullet points and numbered lists for clarity
- Provide examples when explaining concepts
- If asked to generate a quiz, format questions clearly with options labeled A, B, C, D
- Always encourage the student and acknowledge their efforts
- If you don't know something, admit it and suggest resources`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI tutor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
