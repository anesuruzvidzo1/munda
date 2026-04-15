import { desc, eq } from "drizzle-orm";

import { db } from "@/core/database/client";
import { diagnoses } from "@/core/database/schema";

import type { Diagnosis, NewDiagnosis } from "./models";

export async function findById(id: string): Promise<Diagnosis | undefined> {
  const results = await db.select().from(diagnoses).where(eq(diagnoses.id, id)).limit(1);
  return results[0];
}

export async function findByUserId(userId: string): Promise<Diagnosis[]> {
  return db
    .select()
    .from(diagnoses)
    .where(eq(diagnoses.userId, userId))
    .orderBy(desc(diagnoses.createdAt));
}

export async function create(data: NewDiagnosis): Promise<Diagnosis> {
  const results = await db.insert(diagnoses).values(data).returning();
  const diagnosis = results[0];
  if (!diagnosis) {
    throw new Error("Failed to create diagnosis");
  }
  return diagnosis;
}

export async function update(id: string, data: Partial<Diagnosis>): Promise<Diagnosis | undefined> {
  const results = await db.update(diagnoses).set(data).where(eq(diagnoses.id, id)).returning();
  return results[0];
}

export async function countByUserId(userId: string): Promise<number> {
  const results = await db.select().from(diagnoses).where(eq(diagnoses.userId, userId));
  return results.length;
}
