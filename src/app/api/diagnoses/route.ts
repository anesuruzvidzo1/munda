import { type NextRequest, NextResponse } from "next/server";

import { handleApiError, unauthorizedResponse } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import { createClient } from "@/core/supabase/server";
import { CreateDiagnosisSchema, createDiagnosis, listDiagnoses } from "@/features/diagnoses";

const logger = getLogger("api.diagnoses");

/**
 * GET /api/diagnoses
 * List all diagnoses for the authenticated user.
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

    logger.info({ userId: user.id }, "diagnoses.list_started");
    const diagnoses = await listDiagnoses(user.id);
    logger.info({ userId: user.id, count: diagnoses.length }, "diagnoses.list_completed");

    return NextResponse.json(diagnoses);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/diagnoses
 * Submit a new crop diagnosis request.
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
    const input = CreateDiagnosisSchema.parse(body);

    logger.info({ userId: user.id, cropType: input.cropType }, "diagnoses.create_started");

    const diagnosis = await createDiagnosis(input, user.id);

    logger.info({ userId: user.id, diagnosisId: diagnosis.id }, "diagnoses.create_completed");

    return NextResponse.json(diagnosis, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
