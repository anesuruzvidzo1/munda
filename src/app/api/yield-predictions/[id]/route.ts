import { NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getYieldPrediction } from "@/features/yield-predictions";

const logger = getLogger("api.yield-predictions");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/yield-predictions/[id]
 * Get a single yield prediction by ID.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    logger.info({ userId: user.id, predictionId: id }, "yield_predictions.get_started");
    const prediction = await getYieldPrediction(id, user.id);
    logger.info({ userId: user.id, predictionId: id }, "yield_predictions.get_completed");

    return NextResponse.json(prediction);
  } catch (error) {
    return handleApiError(error);
  }
}
