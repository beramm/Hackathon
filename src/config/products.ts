export type ProductDefinition = {
  key: string;
  name: string;
  description: string;
  characteristicPrompts: string[];
};

export const PRODUCT_DEFINITIONS: ProductDefinition[] = [
  {
    key: "water-bottle",
    name: "Water Bottle",
    description: "Reusable drink bottle for general retail or corporate gifting.",
    characteristicPrompts: [
      "Bottle material (stainless steel, tritan, aluminum, etc.)",
      "Capacity (in ml/oz)",
      "Color and finishing (matte, glossy, powder-coated)",
      "Lid type (screw, flip, straw, leak-proof)",
      "Temperature requirements (insulated single/double wall)",
    ],
  },
  {
    key: "t-shirt",
    name: "T-Shirt",
    description: "Custom apparel for events, campaigns, or merchandise sales.",
    characteristicPrompts: [
      "Fabric type and GSM",
      "Size range and fit preference",
      "Base shirt colors",
      "Sleeve and neck style",
      "Quantity per size",
    ],
  },
  {
    key: "phone-case",
    name: "Phone Case",
    description: "Custom protective case for smartphone models.",
    characteristicPrompts: [
      "Phone models supported",
      "Material preference (TPU, PC, hybrid)",
      "Finish and texture",
      "Protection requirements (drop protection level)",
      "Extra features (magnetic ring, stand, card holder)",
    ],
  },
];

export const ALLOWED_PRODUCT_KEYS = new Set(
  PRODUCT_DEFINITIONS.map((product) => product.key),
);

export function getProductByKey(productKey: string) {
  return PRODUCT_DEFINITIONS.find((product) => product.key === productKey);
}

export const PRODUCTS_SYSTEM_CONTEXT = `
You are a marketplace sourcing assistant for Chinese manufacturers.
You must help the user collect complete product requirements in 3 sections:
1) characteristics
2) logoSpecifications
3) packingSpecifications

Allowed products are limited to:
${PRODUCT_DEFINITIONS.map((product) => `- ${product.key}: ${product.name}`).join("\n")}

If the user asks for a product outside the list, politely ask them to choose one allowed product.
Keep questions practical and short. Ask only for missing details.
When all details are complete, output a single JSON block with this exact shape:
{
  "productKey": "string",
  "characteristics": { "items": ["..."] },
  "logoSpecifications": {
    "logoType": "string",
    "logoPosition": "string",
    "logoColors": ["..."],
    "logoFileFormat": "string"
  },
  "packingSpecifications": {
    "innerPacking": "string",
    "outerPacking": "string",
    "labelRequirements": "string"
  },
  "notes": "string"
}
Only output JSON when the user has confirmed all requirements are complete.
`.trim();
