import { anthropic } from "@/core/ai/client";

import type { CreateYieldPredictionInput } from "./schemas";

export interface YieldPredictionResult {
  predictedYield: number;
  yieldCategory: "low" | "medium" | "high";
  analysis: string;
}

export async function generateYieldPrediction(
  input: CreateYieldPredictionInput,
): Promise<YieldPredictionResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are an agronomist specialising in Zimbabwean smallholder farming. Given soil nutrient
data and growing conditions, predict crop yields and provide actionable recommendations.
Always respond with a valid JSON object with exactly these keys:
- predictedYield: a number representing expected yield in tonnes per hectare
- yieldCategory: one of "low", "medium", or "high"
- analysis: a string with practical recommendations for improving yield

Respond with raw JSON only. No markdown, no explanation outside the JSON.`,
    messages: [
      {
        role: "user",
        content: `Crop: ${input.cropType}
Region: ${input.region}
Nitrogen (N): ${input.nitrogen} kg/ha
Phosphorus (P): ${input.phosphorus} kg/ha
Potassium (K): ${input.potassium} kg/ha
Soil pH: ${input.pH}

Predict the expected yield and provide recommendations for a Zimbabwean smallholder farmer.`,
      },
    ],
  });

  const content = message.content[0];
  if (!content || content.type !== "text") {
    throw new Error("Unexpected AI response format");
  }

  const parsed = JSON.parse(content.text) as {
    predictedYield: number;
    yieldCategory: "low" | "medium" | "high";
    analysis: string;
  };

  return {
    predictedYield: parsed.predictedYield,
    yieldCategory: parsed.yieldCategory,
    analysis: parsed.analysis,
  };
}
