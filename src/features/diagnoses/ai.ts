import { anthropic } from "@/core/ai/client";

import type { CreateDiagnosisInput } from "./schemas";

export async function generateDiagnosisAdvice(input: CreateDiagnosisInput): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are an expert agricultural extension officer specialising in Zimbabwean smallholder
farming. You provide practical, actionable advice tailored to the resources available to smallholder
farmers. Consider local conditions, available inputs, and cost-effectiveness. Respond in clear,
simple English. Structure your response with these four sections:
1. Likely Cause
2. Immediate Actions
3. Preventive Measures
4. When to Seek Further Help`,
    messages: [
      {
        role: "user",
        content: `Crop: ${input.cropType}
Region: ${input.region}
Problem description: ${input.description}

Please diagnose this crop problem and provide practical advice for a Zimbabwean smallholder farmer.`,
      },
    ],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Unexpected response format from AI");
  }
  return content.text;
}
