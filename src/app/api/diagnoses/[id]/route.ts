import { NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { getDiagnosis } from "@/features/diagnoses";

const logger = getLogger("api.diagnoses");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/diagnoses/[id]
 * Get a single diagnosis by ID.
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

    logger.info({ userId: user.id, diagnosisId: id }, "diagnoses.get_started");
    const diagnosis = await getDiagnosis(id, user.id);
    logger.info({ userId: user.id, diagnosisId: id }, "diagnoses.get_completed");

    return NextResponse.json(diagnosis);
  } catch (error) {
    return handleApiError(error);
  }
}
