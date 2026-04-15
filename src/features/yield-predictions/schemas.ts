import { z } from "zod/v4";

export { CROP_TYPES, ZIMBABWE_REGIONS } from "@/features/diagnoses/schemas";

export const CreateYieldPredictionSchema = z.object({
  cropType: z.enum([
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
  ]),
  region: z.enum([
    "Region I (Eastern Highlands)",
    "Region II (Highveld - intensive farming)",
    "Region III (Middleveld - semi-intensive)",
    "Region IV (Lowveld - semi-arid)",
    "Region V (Lowveld - arid)",
  ]),
  nitrogen: z.number().min(0).max(500),
  phosphorus: z.number().min(0).max(300),
  potassium: z.number().min(0).max(300),
  pH: z.number().min(3).max(10),
});

export type CreateYieldPredictionInput = z.infer<typeof CreateYieldPredictionSchema>;
