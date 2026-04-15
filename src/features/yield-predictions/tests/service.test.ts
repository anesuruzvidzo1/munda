import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { YieldPrediction } from "../models";

const mockPrediction: YieldPrediction = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  cropType: "Maize",
  region: "Region II (Highveld - intensive farming)",
  nitrogen: "120.00",
  phosphorus: "40.00",
  potassium: "60.00",
  pH: "6.50",
  predictedYield: "4.20",
  yieldCategory: "medium",
  aiAnalysis: "Good conditions for maize. Consider adding more nitrogen.",
  status: "completed",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const userId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";

const mockRepository = {
  findById: mock<(id: string) => Promise<YieldPrediction | undefined>>(() =>
    Promise.resolve(undefined),
  ),
  findByUserId: mock<(userId: string) => Promise<YieldPrediction[]>>(() => Promise.resolve([])),
  create: mock<(data: unknown) => Promise<YieldPrediction>>(() => Promise.resolve(mockPrediction)),
  update: mock<(id: string, data: unknown) => Promise<YieldPrediction | undefined>>(() =>
    Promise.resolve(mockPrediction),
  ),
  countByUserId: mock<(userId: string) => Promise<number>>(() => Promise.resolve(0)),
};

const mockAi = {
  generateYieldPrediction: mock<
    (input: unknown) => Promise<{
      predictedYield: number;
      yieldCategory: "low" | "medium" | "high";
      analysis: string;
    }>
  >(() =>
    Promise.resolve({
      predictedYield: 4.2,
      yieldCategory: "medium" as const,
      analysis: "Good conditions for maize. Consider adding more nitrogen.",
    }),
  ),
};

mock.module("../repository", () => mockRepository);
mock.module("../ai", () => mockAi);

const { createYieldPrediction, getYieldPrediction, listYieldPredictions, getYieldPredictionCount } =
  await import("../service");

const validInput = {
  cropType: "Maize" as const,
  region: "Region II (Highveld - intensive farming)" as const,
  nitrogen: 120,
  phosphorus: 40,
  potassium: 60,
  pH: 6.5,
};

describe("createYieldPrediction", () => {
  beforeEach(() => {
    mockRepository.create.mockReset();
    mockRepository.update.mockReset();
    mockAi.generateYieldPrediction.mockReset();
  });

  it("creates a prediction and stores AI results", async () => {
    const pendingPrediction = { ...mockPrediction, status: "pending", predictedYield: null };
    mockRepository.create.mockResolvedValue(pendingPrediction);
    mockAi.generateYieldPrediction.mockResolvedValue({
      predictedYield: 4.2,
      yieldCategory: "medium" as const,
      analysis: "Good analysis.",
    });
    mockRepository.update.mockResolvedValue({ ...mockPrediction, status: "completed" });

    const result = await createYieldPrediction(validInput, userId);

    expect(mockRepository.create).toHaveBeenCalledTimes(1);
    expect(mockAi.generateYieldPrediction).toHaveBeenCalledTimes(1);
    expect(mockRepository.update).toHaveBeenCalledWith(pendingPrediction.id, {
      status: "completed",
      predictedYield: "4.2",
      yieldCategory: "medium",
      aiAnalysis: "Good analysis.",
    });
    expect(result.status).toBe("completed");
  });

  it("marks prediction as failed and rethrows when AI call fails", async () => {
    const pendingPrediction = { ...mockPrediction, status: "pending", predictedYield: null };
    mockRepository.create.mockResolvedValue(pendingPrediction);
    mockAi.generateYieldPrediction.mockRejectedValue(new Error("AI service error"));
    mockRepository.update.mockResolvedValue({ ...mockPrediction, status: "failed" });

    await expect(createYieldPrediction(validInput, userId)).rejects.toThrow("AI service error");

    expect(mockRepository.update).toHaveBeenCalledWith(pendingPrediction.id, { status: "failed" });
  });
});

describe("getYieldPrediction", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("returns prediction for the owner", async () => {
    mockRepository.findById.mockResolvedValue(mockPrediction);

    const result = await getYieldPrediction(mockPrediction.id, userId);

    expect(result).toEqual(mockPrediction);
  });

  it("throws YieldPredictionNotFoundError when prediction does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(getYieldPrediction("non-existent-id", userId)).rejects.toThrow(
      "Yield prediction not found",
    );
  });

  it("throws YieldPredictionAccessDeniedError when user is not the owner", async () => {
    mockRepository.findById.mockResolvedValue(mockPrediction);

    await expect(getYieldPrediction(mockPrediction.id, otherUserId)).rejects.toThrow(
      "Access denied to yield prediction",
    );
  });
});

describe("listYieldPredictions", () => {
  beforeEach(() => {
    mockRepository.findByUserId.mockReset();
  });

  it("returns all predictions for the user", async () => {
    mockRepository.findByUserId.mockResolvedValue([mockPrediction]);

    const result = await listYieldPredictions(userId);

    expect(result).toEqual([mockPrediction]);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
  });

  it("returns empty array when user has no predictions", async () => {
    mockRepository.findByUserId.mockResolvedValue([]);

    const result = await listYieldPredictions(userId);

    expect(result).toEqual([]);
  });
});

describe("getYieldPredictionCount", () => {
  beforeEach(() => {
    mockRepository.countByUserId.mockReset();
  });

  it("returns count from repository", async () => {
    mockRepository.countByUserId.mockResolvedValue(7);

    const result = await getYieldPredictionCount(userId);

    expect(result).toBe(7);
    expect(mockRepository.countByUserId).toHaveBeenCalledWith(userId);
  });

  it("returns 0 when user has no predictions", async () => {
    mockRepository.countByUserId.mockResolvedValue(0);

    const result = await getYieldPredictionCount(userId);

    expect(result).toBe(0);
  });
});
