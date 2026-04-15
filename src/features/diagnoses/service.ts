import { getLogger } from "@/core/logging";

import { generateDiagnosisAdvice } from "./ai";
import { DiagnosisAccessDeniedError, DiagnosisNotFoundError } from "./errors";
import type { Diagnosis } from "./models";
import * as repository from "./repository";
import type { CreateDiagnosisInput } from "./schemas";

const logger = getLogger("diagnoses.service");

export async function createDiagnosis(
  input: CreateDiagnosisInput,
  userId: string,
): Promise<Diagnosis> {
  logger.info(
    { userId, cropType: input.cropType, region: input.region },
    "diagnosis.create_started",
  );

  const diagnosis = await repository.create({
    userId,
    cropType: input.cropType,
    region: input.region,
    description: input.description,
    status: "pending",
    aiAdvice: null,
  });

  try {
    const aiAdvice = await generateDiagnosisAdvice(input);
    const updated = await repository.update(diagnosis.id, { status: "completed", aiAdvice });
    logger.info({ diagnosisId: diagnosis.id }, "diagnosis.create_completed");
    return updated ?? diagnosis;
  } catch (error) {
    await repository.update(diagnosis.id, { status: "failed" });
    logger.error({ diagnosisId: diagnosis.id, error }, "diagnosis.create_failed");
    throw error;
  }
}

export async function getDiagnosis(id: string, userId: string): Promise<Diagnosis> {
  logger.info({ diagnosisId: id, userId }, "diagnosis.get_started");

  const diagnosis = await repository.findById(id);
  if (!diagnosis) {
    logger.warn({ diagnosisId: id }, "diagnosis.get_not_found");
    throw new DiagnosisNotFoundError(id);
  }
  if (diagnosis.userId !== userId) {
    logger.warn({ diagnosisId: id, userId }, "diagnosis.get_access_denied");
    throw new DiagnosisAccessDeniedError(id);
  }

  logger.info({ diagnosisId: id }, "diagnosis.get_completed");
  return diagnosis;
}

export async function listDiagnoses(userId: string): Promise<Diagnosis[]> {
  logger.info({ userId }, "diagnosis.list_started");
  const results = await repository.findByUserId(userId);
  logger.info({ userId, count: results.length }, "diagnosis.list_completed");
  return results;
}

export async function getDiagnosisCount(userId: string): Promise<number> {
  return repository.countByUserId(userId);
}
