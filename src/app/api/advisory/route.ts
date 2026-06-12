import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createClient } from "@/core/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body: { crop: string; location: string; season: string; problem: string } =
    await request.json();

  const { crop, location, season, problem } = body;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are Munda, an AI-powered crop advisory assistant for African and developing-world farmers.
You help with crop management, disease identification, soil health, pest control, irrigation, fertilization,
harvest timing, and sustainable agriculture practices. Be practical, specific, and actionable.
Format your response with clear sections using plain text headers (no markdown symbols).
Keep responses focused and under 400 words.`,
    prompt: `Crop: ${crop}
Location / Region: ${location}
Growing Season: ${season}
Problem or Question: ${problem}

Provide specific, actionable advice for this farmer.`,
  });

  return result.toTextStreamResponse();
}
