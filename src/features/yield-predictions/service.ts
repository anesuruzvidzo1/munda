import { getLogger } from "@/core/logging";

import { generateYieldPrediction } from "./ai";
import { YieldPredictionAccessDeniedError, YieldPredictionNotFoundError } from "./errors";
import type { YieldPrediction } from "./models";
import * as repository from "./repository";
import type { CreateYieldPredictionInput } from "./schemas";

const logger = getLogger("yield-predictions.service");

export async function createYieldPrediction(
  input: CreateYieldPredictionInput,
  userId: string,
): Promise<YieldPrediction> {
  logger.info(
    { userId, cropType: input.cropType, region: input.region },
    "yield_prediction.create_started",
  );

  const prediction = await repository.create({
    userId,
    cropType: input.cropType,
    region: input.region,
    nitrogen: String(input.nitrogen),
    phosphorus: String(input.phosphorus),
    potassium: String(input.potassium),
    pH: String(input.pH),
    status: "pending",
    predictedYield: null,
    yieldCategory: null,
    aiAnalysis: null,
  });

  try {
    const result = await generateYieldPrediction(input);
    const updated = await repository.update(prediction.id, {
      status: "completed",
      predictedYield: String(result.predictedYield),
      yieldCategory: result.yieldCategory,
      aiAnalysis: result.analysis,
    });
    logger.info({ predictionId: prediction.id }, "yield_prediction.create_completed");
    return updated ?? prediction;
  } catch (error) {
    await repository.update(prediction.id, { status: "failed" });
    logger.error({ predictionId: prediction.id, error }, "yield_prediction.create_failed");
    throw error;
  }
}

export async function getYieldPrediction(id: string, userId: string): Promise<YieldPrediction> {
  logger.info({ predictionId: id, userId }, "yield_prediction.get_started");

  const prediction = await repository.findById(id);
  if (!prediction) {
    logger.warn({ predictionId: id }, "yield_prediction.get_not_found");
    throw new YieldPredictionNotFoundError(id);
  }
  if (prediction.userId !== userId) {
    logger.warn({ predictionId: id, userId }, "yield_prediction.get_access_denied");
    throw new YieldPredictionAccessDeniedError(id);
  }

  logger.info({ predictionId: id }, "yield_prediction.get_completed");
  return prediction;
}

export async function listYieldPredictions(userId: string): Promise<YieldPrediction[]> {
  logger.info({ userId }, "yield_prediction.list_started");
  const results = await repository.findByUserId(userId);
  logger.info({ userId, count: results.length }, "yield_prediction.list_completed");
  return results;
}

export async function getYieldPredictionCount(userId: string): Promise<number> {
  return repository.countByUserId(userId);
}
