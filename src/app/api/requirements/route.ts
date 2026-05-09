import { NextResponse } from "next/server";

import { ALLOWED_PRODUCT_KEYS } from "@/config/products";
import { prisma } from "@/lib/db";
import { getMissingSections } from "@/lib/requirements";
import {
  finalizedRequirementSchema,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = finalizedRequirementSchema.parse(payload);
    const missingSections = getMissingSections(parsed);
    if (missingSections.length > 0) {
      return NextResponse.json(
        { error: "Requirement is incomplete.", missingSections },
        { status: 400 },
      );
    }

    if (!ALLOWED_PRODUCT_KEYS.has(parsed.productKey)) {
      return NextResponse.json(
        { error: "Product key is not in the allowed product list." },
        { status: 400 },
      );
    }

    const record = await prisma.productRequirement.create({
      data: {
        productName: parsed.productKey,
        requirementsJson: parsed,
      },
    });

    return NextResponse.json({
      success: true,
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      storage: "database",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Requirement payload is invalid." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const items = await prisma.productRequirement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    storage: "database",
    count: items.length,
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
