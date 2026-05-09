import { z } from "zod";

export const finalizedRequirementSchema = z.object({
  productKey: z.string().min(1),
  characteristics: z.object({
    items: z.array(z.string().min(1)).min(1),
  }),
  logoSpecifications: z.object({
    logoType: z.string().min(1),
    logoPosition: z.string().min(1),
    logoColors: z.array(z.string().min(1)).min(1),
    logoFileFormat: z.string().min(1),
  }),
  packingSpecifications: z.object({
    innerPacking: z.string().min(1),
    outerPacking: z.string().min(1),
    labelRequirements: z.string().min(1),
  }),
  notes: z.string().optional().default(""),
});

export type FinalizedRequirement = z.infer<typeof finalizedRequirementSchema>;
