import { boolean, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Base timestamp columns for all tables.
 * Usage: ...timestamps
 */
export const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

/**
 * Users table - syncs with Supabase Auth via database trigger.
 *
 * To set up the trigger in Supabase SQL Editor:
 *
 * ```sql
 * -- Function to sync auth.users to public.users
 * CREATE OR REPLACE FUNCTION public.handle_new_user()
 * RETURNS trigger AS $$
 * BEGIN
 *   INSERT INTO public.users (id, email)
 *   VALUES (NEW.id, NEW.email);
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 * -- Trigger on auth.users insert
 * CREATE OR REPLACE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 * ```
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // References auth.users(id)
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

/**
 * Projects table - stores project information with ownership.
 */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});

/**
 * Diagnoses table - stores crop problem descriptions and AI-generated advice.
 */
export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cropType: text("crop_type").notNull(),
  region: text("region").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "completed" | "failed"
  aiAdvice: text("ai_advice"),
  ...timestamps,
});

/**
 * Yield predictions table - stores soil inputs and AI-generated yield forecasts.
 */
export const yieldPredictions = pgTable("yield_predictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cropType: text("crop_type").notNull(),
  region: text("region").notNull(),
  nitrogen: numeric("nitrogen", { precision: 6, scale: 2 }).notNull(),
  phosphorus: numeric("phosphorus", { precision: 6, scale: 2 }).notNull(),
  potassium: numeric("potassium", { precision: 6, scale: 2 }).notNull(),
  pH: numeric("ph", { precision: 4, scale: 2 }).notNull(),
  predictedYield: numeric("predicted_yield", { precision: 6, scale: 2 }),
  yieldCategory: text("yield_category"), // "low" | "medium" | "high"
  aiAnalysis: text("ai_analysis"),
  status: text("status").notNull().default("pending"), // "pending" | "completed" | "failed"
  ...timestamps,
});
