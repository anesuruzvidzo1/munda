import type { HttpStatusCode } from "@/core/api/errors";

export class YieldPredictionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: HttpStatusCode,
  ) {
    super(message);
    this.name = "YieldPredictionError";
  }
}

export class YieldPredictionNotFoundError extends YieldPredictionError {
  constructor(id: string) {
    super(`Yield prediction not found: ${id}`, "YIELD_PREDICTION_NOT_FOUND", 404);
  }
}

export class YieldPredictionAccessDeniedError extends YieldPredictionError {
  constructor(id: string) {
    super(`Access denied to yield prediction: ${id}`, "YIELD_PREDICTION_ACCESS_DENIED", 403);
  }
}
