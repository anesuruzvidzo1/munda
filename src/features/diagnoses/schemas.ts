import { z } from "zod/v4";

export { CROP_TYPES, ZIMBABWE_REGIONS } from "./constants";

import { CROP_TYPES, ZIMBABWE_REGIONS } from "./constants";

export const CreateDiagnosisSchema = z.object({
  cropType: z.enum(CROP_TYPES),
  region: z.enum(ZIMBABWE_REGIONS),
  description: z
    .string()
    .min(10, "Please describe the problem in at least 10 characters")
    .max(2000),
});

export type CreateDiagnosisInput = z.infer<typeof CreateDiagnosisSchema>;
