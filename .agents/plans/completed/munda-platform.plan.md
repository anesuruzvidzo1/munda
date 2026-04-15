# Plan: Munda — AI-Powered Crop Advisory Platform

## Summary

Build Munda on top of the existing Next.js/Supabase template. We add two AI-powered features —
crop diagnosis (describe a problem, get Claude-powered advice) and yield prediction (enter soil
inputs, get a yield forecast) — each as a vertical slice matching the existing `projects/` pattern
exactly. Auth stays unchanged. The dashboard is updated to show diagnosis and prediction counts.
Claude is called synchronously inside API routes (no background jobs) to keep the MVP simple.

## User Stories

**Crop Diagnosis:**
As a smallholder farmer or extension worker,
I want to describe a crop problem and get AI-powered advice,
So that I can act quickly without waiting for an in-person extension visit.

**Yield Prediction:**
As a farmer or extension worker,
I want to enter my soil data (NPK, pH) and region,
So that I can get a predicted yield range and tailored recommendations.

**Dashboard:**
As a user,
I want to see my history of diagnoses and predictions,
So that I can track patterns and revisit past advice.

## Metadata

| Field | Value |
|---|---|
| Type | NEW_CAPABILITY |
| Complexity | HIGH |
| Systems Affected | Database schema, API routes, features (2 new slices), UI pages, env config, core AI client |

---

## Patterns to Follow

### Vertical slice structure
```typescript
// SOURCE: src/features/projects/ (entire folder)
// Each feature: models.ts → schemas.ts → errors.ts → repository.ts → service.ts → index.ts → tests/
```

### Service layer logging
```typescript
// SOURCE: src/features/projects/service.ts:8,48-61
const logger = getLogger("projects.service");
logger.info({ ownerId, name: input.name }, "project.create_started");
// ...
logger.info({ projectId: project.id, slug }, "project.create_completed");
```

### Error classes with HTTP semantics
```typescript
// SOURCE: src/features/projects/errors.ts
export class ProjectNotFoundError extends ProjectError {
  constructor(id: string) {
    super(`Project not found: ${id}`, "PROJECT_NOT_FOUND", 404);
  }
}
// isHttpError() in src/core/api/errors.ts checks for .code and .statusCode
// — any class following this pattern is handled automatically
```

### API route pattern (auth + parse + service + handleApiError)
```typescript
// SOURCE: src/app/api/projects/route.ts:20-70
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorizedResponse();
    const body = await request.json();
    const input = CreateProjectSchema.parse(body);
    const result = await createThing(input, user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Database schema table definition
```typescript
// SOURCE: src/core/database/schema.ts:1-56
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});
```

### Env config
```typescript
// SOURCE: src/core/config/env.ts
ANTHROPIC_API_KEY: getRequiredEnv("ANTHROPIC_API_KEY"),
```

### Dashboard page (server component, Card grid)
```typescript
// SOURCE: src/app/(dashboard)/dashboard/page.tsx:1-72
// Server component, calls service functions directly, renders Card grid
```

### handleApiError — no change needed
```typescript
// SOURCE: src/core/api/errors.ts:30-40
// isHttpError() checks for .code and .statusCode properties — works with any feature error class
// that extends a base Error and sets these fields. No change needed to errors.ts.
```

---

## Files to Change

### New files — Core AI client
| File | Action | Purpose |
|---|---|---|
| `src/core/ai/client.ts` | CREATE | Anthropic SDK singleton with env key |

### New files — Diagnoses feature slice
| File | Action | Purpose |
|---|---|---|
| `src/features/diagnoses/models.ts` | CREATE | Drizzle-inferred Diagnosis types |
| `src/features/diagnoses/schemas.ts` | CREATE | Zod schemas: CreateDiagnosisSchema |
| `src/features/diagnoses/errors.ts` | CREATE | DiagnosisNotFoundError, DiagnosisAccessDeniedError |
| `src/features/diagnoses/repository.ts` | CREATE | DB queries: findById, findByUserId, create, update |
| `src/features/diagnoses/ai.ts` | CREATE | Claude prompt logic for crop diagnosis |
| `src/features/diagnoses/service.ts` | CREATE | Business logic: createDiagnosis, getDiagnosis, listDiagnoses |
| `src/features/diagnoses/index.ts` | CREATE | Public exports |
| `src/features/diagnoses/tests/service.test.ts` | CREATE | Service unit tests (mock repository + ai) |

### New files — Yield predictions feature slice
| File | Action | Purpose |
|---|---|---|
| `src/features/yield-predictions/models.ts` | CREATE | Drizzle-inferred YieldPrediction types |
| `src/features/yield-predictions/schemas.ts` | CREATE | Zod schemas: CreateYieldPredictionSchema |
| `src/features/yield-predictions/errors.ts` | CREATE | YieldPredictionNotFoundError, YieldPredictionAccessDeniedError |
| `src/features/yield-predictions/repository.ts` | CREATE | DB queries |
| `src/features/yield-predictions/ai.ts` | CREATE | Claude prompt logic for yield prediction |
| `src/features/yield-predictions/service.ts` | CREATE | Business logic |
| `src/features/yield-predictions/index.ts` | CREATE | Public exports |
| `src/features/yield-predictions/tests/service.test.ts` | CREATE | Service unit tests |

### New files — API routes
| File | Action | Purpose |
|---|---|---|
| `src/app/api/diagnoses/route.ts` | CREATE | GET list, POST create diagnosis |
| `src/app/api/diagnoses/[id]/route.ts` | CREATE | GET single diagnosis |
| `src/app/api/yield-predictions/route.ts` | CREATE | GET list, POST create prediction |
| `src/app/api/yield-predictions/[id]/route.ts` | CREATE | GET single prediction |

### New files — UI pages
| File | Action | Purpose |
|---|---|---|
| `src/app/(dashboard)/dashboard/diagnoses/page.tsx` | CREATE | Diagnosis history list |
| `src/app/(dashboard)/dashboard/diagnoses/new/page.tsx` | CREATE | New diagnosis form (client component) |
| `src/app/(dashboard)/dashboard/diagnoses/[id]/page.tsx` | CREATE | View single diagnosis result |
| `src/app/(dashboard)/dashboard/predictions/page.tsx` | CREATE | Prediction history list |
| `src/app/(dashboard)/dashboard/predictions/new/page.tsx` | CREATE | New prediction form (client component) |
| `src/app/(dashboard)/dashboard/predictions/[id]/page.tsx` | CREATE | View single prediction result |

### Modified files
| File | Action | Purpose |
|---|---|---|
| `src/core/database/schema.ts` | UPDATE | Add diagnoses and yield_predictions tables |
| `src/core/config/env.ts` | UPDATE | Add ANTHROPIC_API_KEY required env var |
| `src/app/(dashboard)/layout.tsx` | UPDATE | Add Diagnoses and Predictions nav links, rename app to Munda |
| `src/app/(dashboard)/dashboard/page.tsx` | UPDATE | Add diagnosis count + prediction count cards |

---

## Tasks

Execute in strict order. Each task is independently verifiable.

---

### Task 1: Install Anthropic SDK

- **Action**: Run `bun add @anthropic-ai/sdk`
- **Purpose**: Add Claude API client dependency
- **Validate**: `bun run build` — no missing module errors

---

### Task 2: Add ANTHROPIC_API_KEY to env config

- **File**: `src/core/config/env.ts`
- **Action**: UPDATE
- **Implement**: Add `ANTHROPIC_API_KEY: getRequiredEnv("ANTHROPIC_API_KEY")` to the `env` object
- **Mirror**: `src/core/config/env.ts:24` — follow same `getRequiredEnv` pattern
- **Validate**: `npx tsc --noEmit`

---

### Task 3: Create Anthropic AI client singleton

- **File**: `src/core/ai/client.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import Anthropic from "@anthropic-ai/sdk";
  import { env } from "@/core/config/env";

  export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  ```
- **Notes**: Single shared instance. Import `anthropic` in feature ai.ts files.
- **Validate**: `npx tsc --noEmit`

---

### Task 4: Add diagnoses and yield_predictions tables to database schema

- **File**: `src/core/database/schema.ts`
- **Action**: UPDATE
- **Implement**:

  **diagnoses table:**
  ```typescript
  export const diagnoses = pgTable("diagnoses", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    cropType: text("crop_type").notNull(),
    region: text("region").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("pending"),  // "pending" | "completed" | "failed"
    aiAdvice: text("ai_advice"),
    ...timestamps,
  });
  ```

  **yield_predictions table:**
  ```typescript
  export const yieldPredictions = pgTable("yield_predictions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    cropType: text("crop_type").notNull(),
    region: text("region").notNull(),
    nitrogen: numeric("nitrogen", { precision: 6, scale: 2 }).notNull(),
    phosphorus: numeric("phosphorus", { precision: 6, scale: 2 }).notNull(),
    potassium: numeric("potassium", { precision: 6, scale: 2 }).notNull(),
    pH: numeric("ph", { precision: 4, scale: 2 }).notNull(),
    predictedYield: numeric("predicted_yield", { precision: 6, scale: 2 }),
    yieldCategory: text("yield_category"),  // "low" | "medium" | "high"
    aiAnalysis: text("ai_analysis"),
    status: text("status").notNull().default("pending"),
    ...timestamps,
  });
  ```

- **Imports to add**: `numeric` from `drizzle-orm/pg-core`
- **Mirror**: `src/core/database/schema.ts:1-56`
- **After**: Run `bun run db:generate && bun run db:migrate`
- **Validate**: `npx tsc --noEmit`

---

### Task 5: Build diagnoses feature — models.ts

- **File**: `src/features/diagnoses/models.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
  import { diagnoses } from "@/core/database/schema";

  export type Diagnosis = InferSelectModel<typeof diagnoses>;
  export type NewDiagnosis = InferInsertModel<typeof diagnoses>;
  ```
- **Mirror**: `src/features/projects/models.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 6: Build diagnoses feature — schemas.ts

- **File**: `src/features/diagnoses/schemas.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import { z } from "zod/v4";

  export const ZIMBABWE_REGIONS = [
    "Region I (Eastern Highlands)",
    "Region II (Highveld - intensive farming)",
    "Region III (Middleveld - semi-intensive)",
    "Region IV (Lowveld - semi-arid)",
    "Region V (Lowveld - arid)",
  ] as const;

  export const CROP_TYPES = [
    "Maize",
    "Tobacco",
    "Cotton",
    "Sorghum",
    "Pearl Millet",
    "Finger Millet",
    "Groundnuts",
    "Sunflower",
    "Soybeans",
    "Sweet Potato",
    "Cassava",
    "Vegetables",
    "Other",
  ] as const;

  export const CreateDiagnosisSchema = z.object({
    cropType: z.enum(CROP_TYPES),
    region: z.enum(ZIMBABWE_REGIONS),
    description: z.string().min(10, "Please describe the problem in at least 10 characters").max(2000),
  });

  export type CreateDiagnosisInput = z.infer<typeof CreateDiagnosisSchema>;
  ```
- **Mirror**: `src/features/projects/schemas.ts`
- **Note**: Import from `zod/v4` not `zod`. Export `ZIMBABWE_REGIONS` and `CROP_TYPES` — reused in UI forms.
- **Validate**: `npx tsc --noEmit`

---

### Task 7: Build diagnoses feature — errors.ts

- **File**: `src/features/diagnoses/errors.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import type { HttpStatusCode } from "@/core/api/errors";

  export class DiagnosisError extends Error {
    constructor(
      message: string,
      public readonly code: string,
      public readonly statusCode: HttpStatusCode,
    ) {
      super(message);
      this.name = "DiagnosisError";
    }
  }

  export class DiagnosisNotFoundError extends DiagnosisError {
    constructor(id: string) {
      super(`Diagnosis not found: ${id}`, "DIAGNOSIS_NOT_FOUND", 404);
    }
  }

  export class DiagnosisAccessDeniedError extends DiagnosisError {
    constructor(id: string) {
      super(`Access denied to diagnosis: ${id}`, "DIAGNOSIS_ACCESS_DENIED", 403);
    }
  }
  ```
- **Mirror**: `src/features/projects/errors.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 8: Build diagnoses feature — repository.ts

- **File**: `src/features/diagnoses/repository.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import { desc, eq } from "drizzle-orm";
  import { db } from "@/core/database/client";
  import { diagnoses } from "@/core/database/schema";
  import type { Diagnosis, NewDiagnosis } from "./models";

  export async function findById(id: string): Promise<Diagnosis | undefined> {
    const results = await db.select().from(diagnoses).where(eq(diagnoses.id, id)).limit(1);
    return results[0];
  }

  export async function findByUserId(userId: string): Promise<Diagnosis[]> {
    return db.select().from(diagnoses)
      .where(eq(diagnoses.userId, userId))
      .orderBy(desc(diagnoses.createdAt));
  }

  export async function create(data: NewDiagnosis): Promise<Diagnosis> {
    const results = await db.insert(diagnoses).values(data).returning();
    return results[0]!;
  }

  export async function update(id: string, data: Partial<Diagnosis>): Promise<Diagnosis | undefined> {
    const results = await db.update(diagnoses).set(data).where(eq(diagnoses.id, id)).returning();
    return results[0];
  }

  export async function countByUserId(userId: string): Promise<number> {
    const results = await db.select().from(diagnoses).where(eq(diagnoses.userId, userId));
    return results.length;
  }
  ```
- **Mirror**: `src/features/projects/repository.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 9: Build diagnoses feature — ai.ts

- **File**: `src/features/diagnoses/ai.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import { anthropic } from "@/core/ai/client";
  import type { CreateDiagnosisInput } from "./schemas";

  export async function generateDiagnosisAdvice(input: CreateDiagnosisInput): Promise<string> {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are an expert agricultural extension officer specialising in Zimbabwean smallholder
  farming. You provide practical, actionable advice tailored to the resources available to smallholder
  farmers. Consider local conditions, available inputs, and cost-effectiveness. Respond in clear,
  simple English. Structure your response with: (1) Likely Cause, (2) Immediate Actions,
  (3) Preventive Measures, (4) When to Seek Further Help.`,
      messages: [
        {
          role: "user",
          content: `Crop: ${input.cropType}
  Region: ${input.region}
  Problem description: ${input.description}

  Please diagnose this crop problem and provide practical advice for a Zimbabwean smallholder farmer.`,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response format from AI");
    }
    return content.text;
  }
  ```
- **Notes**: Uses `claude-sonnet-4-6` per the system prompt guidance. Structured system prompt with Zimbabwe-specific context. No prompt caching needed for this call pattern (short system prompt, unique user messages).
- **Validate**: `npx tsc --noEmit`

---

### Task 10: Build diagnoses feature — service.ts

- **File**: `src/features/diagnoses/service.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import { getLogger } from "@/core/logging";
  import { generateDiagnosisAdvice } from "./ai";
  import { DiagnosisAccessDeniedError, DiagnosisNotFoundError } from "./errors";
  import type { Diagnosis } from "./models";
  import * as repository from "./repository";
  import type { CreateDiagnosisInput } from "./schemas";

  const logger = getLogger("diagnoses.service");

  export async function createDiagnosis(input: CreateDiagnosisInput, userId: string): Promise<Diagnosis> {
    logger.info({ userId, cropType: input.cropType, region: input.region }, "diagnosis.create_started");

    // Create with pending status first
    const diagnosis = await repository.create({
      userId,
      cropType: input.cropType,
      region: input.region,
      description: input.description,
      status: "pending",
      aiAdvice: null,
    });

    try {
      const aiAdvice = await generateDiagnosisAdvice(input);
      const updated = await repository.update(diagnosis.id, { status: "completed", aiAdvice });
      logger.info({ diagnosisId: diagnosis.id }, "diagnosis.create_completed");
      return updated ?? diagnosis;
    } catch (error) {
      await repository.update(diagnosis.id, { status: "failed" });
      logger.error({ diagnosisId: diagnosis.id, error }, "diagnosis.create_failed");
      throw error;
    }
  }

  export async function getDiagnosis(id: string, userId: string): Promise<Diagnosis> {
    logger.info({ diagnosisId: id, userId }, "diagnosis.get_started");
    const diagnosis = await repository.findById(id);
    if (!diagnosis) {
      logger.warn({ diagnosisId: id }, "diagnosis.get_not_found");
      throw new DiagnosisNotFoundError(id);
    }
    if (diagnosis.userId !== userId) {
      logger.warn({ diagnosisId: id, userId }, "diagnosis.get_access_denied");
      throw new DiagnosisAccessDeniedError(id);
    }
    logger.info({ diagnosisId: id }, "diagnosis.get_completed");
    return diagnosis;
  }

  export async function listDiagnoses(userId: string): Promise<Diagnosis[]> {
    logger.info({ userId }, "diagnosis.list_started");
    const results = await repository.findByUserId(userId);
    logger.info({ userId, count: results.length }, "diagnosis.list_completed");
    return results;
  }

  export async function getDiagnosisCount(userId: string): Promise<number> {
    return repository.countByUserId(userId);
  }
  ```
- **Mirror**: `src/features/projects/service.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 11: Build diagnoses feature — index.ts

- **File**: `src/features/diagnoses/index.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  export type { Diagnosis, NewDiagnosis } from "./models";
  export { CreateDiagnosisSchema, CROP_TYPES, ZIMBABWE_REGIONS } from "./schemas";
  export type { CreateDiagnosisInput } from "./schemas";
  export { DiagnosisNotFoundError, DiagnosisAccessDeniedError } from "./errors";
  export { createDiagnosis, getDiagnosis, listDiagnoses, getDiagnosisCount } from "./service";
  ```
- **Mirror**: `src/features/projects/index.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 12: Build diagnoses feature — tests

- **File**: `src/features/diagnoses/tests/service.test.ts`
- **Action**: CREATE
- **Implement**: Tests for `createDiagnosis`, `getDiagnosis`, access denied case, not found case.
  Mock `../repository` and `../ai` using `mock.module`.
- **Mirror**: `src/features/projects/tests/service.test.ts` — same mock.module + describe/it structure
- **Validate**: `bun test src/features/diagnoses`

---

### Task 13: Build yield-predictions feature — schemas.ts

- **File**: `src/features/yield-predictions/schemas.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import { z } from "zod/v4";
  import { CROP_TYPES, ZIMBABWE_REGIONS } from "@/features/diagnoses/schemas";

  // Re-export constants so UI only needs one import
  export { CROP_TYPES, ZIMBABWE_REGIONS };

  export const CreateYieldPredictionSchema = z.object({
    cropType: z.enum(CROP_TYPES),
    region: z.enum(ZIMBABWE_REGIONS),
    nitrogen: z.number().min(0).max(500).describe("Nitrogen (kg/ha)"),
    phosphorus: z.number().min(0).max(300).describe("Phosphorus (kg/ha)"),
    potassium: z.number().min(0).max(300).describe("Potassium (kg/ha)"),
    pH: z.number().min(3).max(10).describe("Soil pH"),
  });

  export type CreateYieldPredictionInput = z.infer<typeof CreateYieldPredictionSchema>;
  ```
- **Validate**: `npx tsc --noEmit`

---

### Task 14: Build yield-predictions feature — models.ts, errors.ts, repository.ts

- **File**: `src/features/yield-predictions/models.ts`
  ```typescript
  import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
  import { yieldPredictions } from "@/core/database/schema";
  export type YieldPrediction = InferSelectModel<typeof yieldPredictions>;
  export type NewYieldPrediction = InferInsertModel<typeof yieldPredictions>;
  ```

- **File**: `src/features/yield-predictions/errors.ts`
  Same pattern as diagnoses errors.ts — `YieldPredictionError` base, `YieldPredictionNotFoundError` (404), `YieldPredictionAccessDeniedError` (403).

- **File**: `src/features/yield-predictions/repository.ts`
  Same pattern as diagnoses repository.ts — `findById`, `findByUserId`, `create`, `update`, `countByUserId`.
  Table: `yieldPredictions` from schema.

- **Mirror**: `src/features/diagnoses/` files just created
- **Validate**: `npx tsc --noEmit`

---

### Task 15: Build yield-predictions feature — ai.ts

- **File**: `src/features/yield-predictions/ai.ts`
- **Action**: CREATE
- **Implement**:
  ```typescript
  import { anthropic } from "@/core/ai/client";
  import type { CreateYieldPredictionInput } from "./schemas";

  export interface YieldPredictionResult {
    predictedYield: number;   // tonnes/ha
    yieldCategory: "low" | "medium" | "high";
    analysis: string;
  }

  export async function generateYieldPrediction(
    input: CreateYieldPredictionInput,
  ): Promise<YieldPredictionResult> {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are an agronomist specialising in Zimbabwean smallholder farming. Given soil nutrient
  data and growing conditions, predict crop yields and provide actionable recommendations. Always
  respond with a valid JSON object with keys: predictedYield (number, tonnes/ha), yieldCategory
  ("low"|"medium"|"high"), analysis (string with recommendations). No markdown, just raw JSON.`,
      messages: [
        {
          role: "user",
          content: `Crop: ${input.cropType}
  Region: ${input.region}
  Nitrogen (N): ${input.nitrogen} kg/ha
  Phosphorus (P): ${input.phosphorus} kg/ha
  Potassium (K): ${input.potassium} kg/ha
  Soil pH: ${input.pH}

  Predict the expected yield and provide recommendations for a Zimbabwean smallholder farmer.
  Respond with JSON only.`,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected AI response format");
    }

    const parsed = JSON.parse(content.text) as {
      predictedYield: number;
      yieldCategory: "low" | "medium" | "high";
      analysis: string;
    };
    return parsed;
  }
  ```
- **Notes**: JSON mode via system prompt instruction. Parse response and return typed result.
- **Validate**: `npx tsc --noEmit`

---

### Task 16: Build yield-predictions feature — service.ts and index.ts

- **File**: `src/features/yield-predictions/service.ts`
- **Implement**:
  - `createYieldPrediction(input, userId)`: create pending record → call `generateYieldPrediction` → update with results (predictedYield, yieldCategory, aiAnalysis, status: "completed") → return updated. On AI error: update status to "failed", re-throw.
  - `getYieldPrediction(id, userId)`: findById → check userId ownership → return or throw
  - `listYieldPredictions(userId)`: findByUserId → return
  - `getYieldPredictionCount(userId)`: countByUserId

- **File**: `src/features/yield-predictions/index.ts`
  Export: types, schema, errors, service functions (not repository)

- **Mirror**: `src/features/diagnoses/service.ts` and `index.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 17: Build yield-predictions feature — tests

- **File**: `src/features/yield-predictions/tests/service.test.ts`
- Mock `../repository` and `../ai`
- Test: creates prediction, stores AI result, throws on not found, throws on wrong user
- **Mirror**: `src/features/diagnoses/tests/service.test.ts`
- **Validate**: `bun test src/features/yield-predictions`

---

### Task 18: Create API route — POST/GET /api/diagnoses

- **File**: `src/app/api/diagnoses/route.ts`
- **Action**: CREATE
- **Implement**:
  - `GET`: auth check → `listDiagnoses(user.id)` → return JSON array
  - `POST`: auth check → `CreateDiagnosisSchema.parse(body)` → `createDiagnosis(input, user.id)` → return 201
- **Mirror**: `src/app/api/projects/route.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 19: Create API route — GET /api/diagnoses/[id]

- **File**: `src/app/api/diagnoses/[id]/route.ts`
- **Action**: CREATE
- **Implement**: auth check → `getDiagnosis(params.id, user.id)` → return JSON
- **Mirror**: `src/app/api/projects/[id]/route.ts`
- **Validate**: `npx tsc --noEmit`

---

### Task 20: Create API routes — yield-predictions

- **Files**: `src/app/api/yield-predictions/route.ts` and `src/app/api/yield-predictions/[id]/route.ts`
- Same structure as Tasks 18–19 but for yield predictions
- `POST` body parsed with `CreateYieldPredictionSchema`
- **Validate**: `npx tsc --noEmit`

---

### Task 21: Update dashboard layout — nav links + app name

- **File**: `src/app/(dashboard)/layout.tsx`
- **Action**: UPDATE
- **Changes**:
  1. Change the brand text from `"Dashboard"` to `"Munda"` (the `<a href="/dashboard">` link)
  2. Replace the `<a href="/dashboard/projects">Projects</a>` link with:
     ```tsx
     <a href="/dashboard/diagnoses" className="text-muted-foreground hover:text-foreground">
       Diagnoses
     </a>
     <a href="/dashboard/predictions" className="text-muted-foreground hover:text-foreground">
       Yield Predictions
     </a>
     ```
- **Mirror**: `src/app/(dashboard)/layout.tsx:29-36`
- **Validate**: `npx tsc --noEmit`

---

### Task 22: Update dashboard home page — add Munda feature cards

- **File**: `src/app/(dashboard)/dashboard/page.tsx`
- **Action**: UPDATE
- **Changes**:
  1. Import `getDiagnosisCount` from `@/features/diagnoses`
  2. Import `getYieldPredictionCount` from `@/features/yield-predictions`
  3. Fetch counts alongside projectCount: `const [diagnosisCount, predictionCount] = await Promise.all([...])`
  4. Replace the Projects card with two new cards:
     - **Crop Diagnoses card**: shows count, description "AI-powered crop problem diagnoses", link to `/dashboard/diagnoses`, "New Diagnosis" button
     - **Yield Predictions card**: shows count, description "Soil-based yield forecasts", link to `/dashboard/predictions`, "New Prediction" button
  5. Update h1 to say "Munda" and subtitle to "Your crop advisory dashboard"
  6. Remove the old Projects card (or keep as third card if desired)
- **Mirror**: `src/app/(dashboard)/dashboard/page.tsx:1-72`
- **Validate**: `npx tsc --noEmit`

---

### Task 23: Create diagnoses list page

- **File**: `src/app/(dashboard)/dashboard/diagnoses/page.tsx`
- **Action**: CREATE
- **Implement**: Server component. Auth → `listDiagnoses(user.id)` → render list of cards showing
  cropType, region, status badge (pending/completed/failed), truncated description, date, link to `[id]`.
  Empty state: "No diagnoses yet. Start your first diagnosis."
  CTA button: `<a href="/dashboard/diagnoses/new">New Diagnosis</a>`
- **Mirror**: `src/app/(dashboard)/dashboard/page.tsx` structure

---

### Task 24: Create new diagnosis page (form + result)

- **File**: `src/app/(dashboard)/dashboard/diagnoses/new/page.tsx`
- **Action**: CREATE
- **Implement**: Client component with a form:
  - Select: Crop Type (CROP_TYPES enum)
  - Select: Region (ZIMBABWE_REGIONS enum)
  - Textarea: Describe the problem (min 10 chars)
  - Submit button with loading state ("Analysing..." while pending)
  - On submit: `fetch("POST /api/diagnoses", body)` → on success redirect to `/dashboard/diagnoses/[id]`
  - Show inline error if API returns error
- **Notes**: Use `useState` + `fetch` pattern (not useActionState since we need the returned ID to redirect). Import `CROP_TYPES` and `ZIMBABWE_REGIONS` from `@/features/diagnoses`.

---

### Task 25: Create single diagnosis view page

- **File**: `src/app/(dashboard)/dashboard/diagnoses/[id]/page.tsx`
- **Action**: CREATE
- **Implement**: Server component. Auth → `getDiagnosis(params.id, user.id)` → render full card with:
  - Crop type, region, status badge
  - Full description
  - AI Advice section (rendered as pre-formatted text or markdown-like paragraphs)
  - Created date
  - "Back to Diagnoses" link
- **Handle**: If status is "failed", show error message. If "pending", show loading indicator.

---

### Task 26: Create yield predictions list page

- **File**: `src/app/(dashboard)/dashboard/predictions/page.tsx`
- **Action**: CREATE
- Same pattern as Task 23 but for yield predictions.
- Show: cropType, region, NPK values, pH, yieldCategory badge, predictedYield (t/ha), date.
- CTA: `<a href="/dashboard/predictions/new">New Prediction</a>`

---

### Task 27: Create new yield prediction page (form)

- **File**: `src/app/(dashboard)/dashboard/predictions/new/page.tsx`
- **Action**: CREATE
- **Implement**: Client component form:
  - Select: Crop Type
  - Select: Region
  - Number input: Nitrogen (kg/ha), range 0–500
  - Number input: Phosphorus (kg/ha), range 0–300
  - Number input: Potassium (kg/ha), range 0–300
  - Number input: Soil pH, range 3–10, step 0.1
  - Submit button with loading state ("Predicting...")
  - On success: redirect to `/dashboard/predictions/[id]`
- **Mirror**: Task 24 (new diagnosis page)

---

### Task 28: Create single yield prediction view page

- **File**: `src/app/(dashboard)/dashboard/predictions/[id]/page.tsx`
- **Action**: CREATE
- **Implement**: Server component. Auth → `getYieldPrediction(params.id, user.id)` → render:
  - Input summary card: crop, region, NPK values, pH
  - Results card: predicted yield (t/ha), yield category badge (low/medium/high with colour)
  - AI Analysis section with full text
  - "Back to Predictions" link

---

## Validation

```bash
# After all tasks:
bun run lint
npx tsc --noEmit
bun test
```

---

## Acceptance Criteria

- [ ] `bun run lint` passes with no errors
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `bun test` passes (all feature tests green)
- [ ] Diagnosis form submits and returns AI advice
- [ ] Yield prediction form submits and returns predicted yield + analysis
- [ ] Dashboard shows diagnosis and prediction counts
- [ ] History pages list past records
- [ ] Access control: users cannot see other users' records (403)
- [ ] Error states handled (failed AI call shows meaningful message)
- [ ] Nav updated to Munda branding with Diagnoses + Yield Predictions links

---

## Notes & Risks

| Risk | Mitigation |
|---|---|
| AI response latency (Claude can take 5–15s) | Show loading spinner; POST returns 201 only after AI completes |
| Yield prediction JSON parsing failure | Wrap `JSON.parse` in try/catch in `ai.ts`; throw with a clear error message |
| `numeric` Drizzle type returns string from PG | Cast to `parseFloat()` before storing/displaying if needed |
| `noUncheckedIndexedAccess` on `results[0]` | Use `results[0]!` when `.returning()` guarantees a row, or check undefined |
| `exactOptionalPropertyTypes` on update data | Build update object with explicit conditionals (see service.ts:144–154 for pattern) |
| Missing `.env.local` key | `ANTHROPIC_API_KEY` throws at startup via `getRequiredEnv` — clear error message |
