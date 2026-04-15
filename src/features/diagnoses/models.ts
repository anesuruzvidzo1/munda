import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { diagnoses } from "@/core/database/schema";

export type Diagnosis = InferSelectModel<typeof diagnoses>;
export type NewDiagnosis = InferInsertModel<typeof diagnoses>;
