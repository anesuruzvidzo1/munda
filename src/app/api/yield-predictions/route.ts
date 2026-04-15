import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import {
  CreateYieldPredictionSchema,
  createYieldPrediction,
  listYieldPredictions,
} from "@/features/yield-predictions";

const logger = getLogger("api.yield-predictions");

/**
 * GET /api/yield-predictions
 * List all yield predictions for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    logger.info({ userId: user.id }, "yield_predictions.list_started");
    const predictions = await listYieldPredictions(user.id);
    logger.info({ userId: user.id, count: predictions.length }, "yield_predictions.list_completed");

    return NextResponse.json(predictions);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/yield-predictions
 * Submit a new yield prediction request.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const input = CreateYieldPredictionSchema.parse(body);

    logger.info({ userId: user.id, cropType: input.cropType }, "yield_predictions.create_started");

    const prediction = await createYieldPrediction(input, user.id);

    logger.info(
      { userId: user.id, predictionId: prediction.id },
      "yield_predictions.create_completed",
    );

    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
