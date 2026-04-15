import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { Diagnosis } from "../models";

const mockDiagnosis: Diagnosis = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "550e8400-e29b-41d4-a716-446655440001",
  cropType: "Maize",
  region: "Region II (Highveld - intensive farming)",
  description: "Leaves are turning yellow from the bottom up.",
  status: "completed",
  aiAdvice: "This looks like nitrogen deficiency. Apply urea at 150 kg/ha.",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const userId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";

// Mock repository
const mockRepository = {
  findById: mock<(id: string) => Promise<Diagnosis | undefined>>(() => Promise.resolve(undefined)),
  findByUserId: mock<(userId: string) => Promise<Diagnosis[]>>(() => Promise.resolve([])),
  create: mock<(data: unknown) => Promise<Diagnosis>>(() => Promise.resolve(mockDiagnosis)),
  update: mock<(id: string, data: unknown) => Promise<Diagnosis | undefined>>(() =>
    Promise.resolve(mockDiagnosis),
  ),
  countByUserId: mock<(userId: string) => Promise<number>>(() => Promise.resolve(0)),
};

// Mock AI module
const mockAi = {
  generateDiagnosisAdvice: mock<(input: unknown) => Promise<string>>(() =>
    Promise.resolve("This looks like nitrogen deficiency. Apply urea at 150 kg/ha."),
  ),
};

mock.module("../repository", () => mockRepository);
mock.module("../ai", () => mockAi);

const { createDiagnosis, getDiagnosis, listDiagnoses, getDiagnosisCount } = await import(
  "../service"
);

describe("createDiagnosis", () => {
  beforeEach(() => {
    mockRepository.create.mockReset();
    mockRepository.update.mockReset();
    mockAi.generateDiagnosisAdvice.mockReset();
  });

  it("creates diagnosis and returns completed record with AI advice", async () => {
    const pendingDiagnosis = { ...mockDiagnosis, status: "pending", aiAdvice: null };
    mockRepository.create.mockResolvedValue(pendingDiagnosis);
    mockAi.generateDiagnosisAdvice.mockResolvedValue("AI advice text");
    mockRepository.update.mockResolvedValue({ ...mockDiagnosis, status: "completed" });

    const result = await createDiagnosis(
      {
        cropType: "Maize",
        region: "Region II (Highveld - intensive farming)",
        description: "Leaves are turning yellow from the bottom up.",
      },
      userId,
    );

    expect(mockRepository.create).toHaveBeenCalledTimes(1);
    expect(mockAi.generateDiagnosisAdvice).toHaveBeenCalledTimes(1);
    expect(mockRepository.update).toHaveBeenCalledWith(pendingDiagnosis.id, {
      status: "completed",
      aiAdvice: "AI advice text",
    });
    expect(result.status).toBe("completed");
  });

  it("marks diagnosis as failed and rethrows when AI call fails", async () => {
    const pendingDiagnosis = { ...mockDiagnosis, status: "pending", aiAdvice: null };
    mockRepository.create.mockResolvedValue(pendingDiagnosis);
    mockAi.generateDiagnosisAdvice.mockRejectedValue(new Error("AI unavailable"));
    mockRepository.update.mockResolvedValue({ ...mockDiagnosis, status: "failed" });

    await expect(
      createDiagnosis(
        {
          cropType: "Maize",
          region: "Region II (Highveld - intensive farming)",
          description: "Leaves are turning yellow from the bottom up.",
        },
        userId,
      ),
    ).rejects.toThrow("AI unavailable");

    expect(mockRepository.update).toHaveBeenCalledWith(pendingDiagnosis.id, { status: "failed" });
  });
});

describe("getDiagnosis", () => {
  beforeEach(() => {
    mockRepository.findById.mockReset();
  });

  it("returns diagnosis for the owner", async () => {
    mockRepository.findById.mockResolvedValue(mockDiagnosis);

    const result = await getDiagnosis(mockDiagnosis.id, userId);

    expect(result).toEqual(mockDiagnosis);
  });

  it("throws DiagnosisNotFoundError when diagnosis does not exist", async () => {
    mockRepository.findById.mockResolvedValue(undefined);

    await expect(getDiagnosis("non-existent-id", userId)).rejects.toThrow("Diagnosis not found");
  });

  it("throws DiagnosisAccessDeniedError when user is not the owner", async () => {
    mockRepository.findById.mockResolvedValue(mockDiagnosis);

    await expect(getDiagnosis(mockDiagnosis.id, otherUserId)).rejects.toThrow(
      "Access denied to diagnosis",
    );
  });
});

describe("listDiagnoses", () => {
  beforeEach(() => {
    mockRepository.findByUserId.mockReset();
  });

  it("returns all diagnoses for the user", async () => {
    mockRepository.findByUserId.mockResolvedValue([mockDiagnosis]);

    const result = await listDiagnoses(userId);

    expect(result).toEqual([mockDiagnosis]);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
  });

  it("returns empty array when user has no diagnoses", async () => {
    mockRepository.findByUserId.mockResolvedValue([]);

    const result = await listDiagnoses(userId);

    expect(result).toEqual([]);
  });
});

describe("getDiagnosisCount", () => {
  beforeEach(() => {
    mockRepository.countByUserId.mockReset();
  });

  it("returns the count from the repository", async () => {
    mockRepository.countByUserId.mockResolvedValue(3);

    const result = await getDiagnosisCount(userId);

    expect(result).toBe(3);
    expect(mockRepository.countByUserId).toHaveBeenCalledWith(userId);
  });

  it("returns 0 when user has no diagnoses", async () => {
    mockRepository.countByUserId.mockResolvedValue(0);

    const result = await getDiagnosisCount(userId);

    expect(result).toBe(0);
  });
});
