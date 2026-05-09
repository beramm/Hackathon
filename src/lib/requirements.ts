import { finalizedRequirementSchema, type FinalizedRequirement } from "@/lib/schemas";

const REQUIRED_LOGO_FIELDS = [
  "logoType",
  "logoPosition",
  "logoColors",
  "logoFileFormat",
] as const;
const REQUIRED_PACKING_FIELDS = [
  "innerPacking",
  "outerPacking",
  "labelRequirements",
] as const;

export function extractFinalizedRequirement(content: string): FinalizedRequirement | null {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return finalizedRequirementSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function getMissingSections(candidate: Partial<FinalizedRequirement>) {
  const missing: string[] = [];

  if (!candidate.characteristics?.items?.length) {
    missing.push("characteristics.items");
  }

  for (const field of REQUIRED_LOGO_FIELDS) {
    const value = candidate.logoSpecifications?.[field];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missing.push(`logoSpecifications.${field}`);
    }
  }

  for (const field of REQUIRED_PACKING_FIELDS) {
    const value = candidate.packingSpecifications?.[field];
    if (!value) {
      missing.push(`packingSpecifications.${field}`);
    }
  }

  return missing;
}
