import type { HttpStatusCode } from "@/core/api/errors";

export class DiagnosisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: HttpStatusCode,
  ) {
    super(message);
    this.name = "DiagnosisError";
  }
}

export class DiagnosisNotFoundError extends DiagnosisError {
  constructor(id: string) {
    super(`Diagnosis not found: ${id}`, "DIAGNOSIS_NOT_FOUND", 404);
  }
}

export class DiagnosisAccessDeniedError extends DiagnosisError {
  constructor(id: string) {
    super(`Access denied to diagnosis: ${id}`, "DIAGNOSIS_ACCESS_DENIED", 403);
  }
}
