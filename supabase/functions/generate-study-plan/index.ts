import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goals, availableHoursPerWeek, preferredDays, subjects, learningLevel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const daysOfWeek = preferredDays.length > 0 ? preferredDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const hoursPerDay = Math.round((availableHoursPerWeek / daysOfWeek.length) * 10) / 10;

    const prompt = `You are an expert educational planner. Create a detailed weekly study plan based on:

Goals: ${goals.join(', ')}
Available hours per week: ${availableHoursPerWeek}
Preferred study days: ${daysOfWeek.join(', ')}
Subjects of interest: ${subjects?.join(', ') || 'General'}
Learning level: ${learningLevel || 'intermediate'}
Hours per study day: approximately ${hoursPerDay}

Create a structured weekly schedule with specific time blocks for each day. For each study session include:
- Subject/topic
- Duration in minutes
- Specific activity (e.g., "Watch video lecture", "Practice exercises", "Review notes")
- Brief tips for the session

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "Personalized Study Plan",
  "weeklySchedule": {
    "Monday": [
      {"time": "09:00", "duration": 60, "subject": "Subject Name", "activity": "Activity description", "tip": "Helpful tip"}
    ],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": [],
    "Saturday": [],
    "Sunday": []
  },
  "weeklyGoals": ["Goal 1", "Goal 2", "Goal 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert educational planner. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response
    let studyPlan;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      studyPlan = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to generate valid study plan");
    }

    return new Response(JSON.stringify(studyPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Study plan generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
