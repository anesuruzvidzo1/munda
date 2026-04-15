import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { yieldPredictions } from "@/core/database/schema";

export type YieldPrediction = InferSelectModel<typeof yieldPredictions>;
export type NewYieldPrediction = InferInsertModel<typeof yieldPredictions>;
