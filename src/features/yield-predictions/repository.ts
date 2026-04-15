import { desc, eq } from "drizzle-orm";

import { db } from "@/core/database/client";
import { yieldPredictions } from "@/core/database/schema";

import type { NewYieldPrediction, YieldPrediction } from "./models";

export async function findById(id: string): Promise<YieldPrediction | undefined> {
  const results = await db
    .select()
    .from(yieldPredictions)
    .where(eq(yieldPredictions.id, id))
    .limit(1);
  return results[0];
}

export async function findByUserId(userId: string): Promise<YieldPrediction[]> {
  return db
    .select()
    .from(yieldPredictions)
    .where(eq(yieldPredictions.userId, userId))
    .orderBy(desc(yieldPredictions.createdAt));
}

export async function create(data: NewYieldPrediction): Promise<YieldPrediction> {
  const results = await db.insert(yieldPredictions).values(data).returning();
  const prediction = results[0];
  if (!prediction) {
    throw new Error("Failed to create yield prediction");
  }
  return prediction;
}

export async function update(
  id: string,
  data: Partial<YieldPrediction>,
): Promise<YieldPrediction | undefined> {
  const results = await db
    .update(yieldPredictions)
    .set(data)
    .where(eq(yieldPredictions.id, id))
    .returning();
  return results[0];
}

export async function countByUserId(userId: string): Promise<number> {
  const results = await db
    .select()
    .from(yieldPredictions)
    .where(eq(yieldPredictions.userId, userId));
  return results.length;
}
