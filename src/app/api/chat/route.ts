import OpenAI from "openai";
import { NextResponse } from "next/server";

import {
  ALLOWED_PRODUCT_KEYS,
  getProductByKey,
  PRODUCTS_SYSTEM_CONTEXT,
} from "@/config/products";
import { prisma } from "@/lib/db";
import { extractFinalizedRequirement } from "@/lib/requirements";

export const runtime = "nodejs";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  productKey: string;
  messages: ChatMessage[];
};

const FINAL_REQUIREMENTS_SAVED_MARKER = "[[FINAL_REQUIREMENTS_SAVED]]";
const FINAL_REQUIREMENTS_READY_MESSAGE =
  "Requirements have been collected and will be waiting for the next step (factory and product result).";

function sanitizeUserFacingResponse(content: string) {
  return content.replace(/\bjson\b/gi, "structured data");
}

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.productKey || !ALLOWED_PRODUCT_KEYS.has(body.productKey)) {
    return NextResponse.json(
      { error: "Unsupported product. Please choose an allowed product." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Messages are required." }, { status: 400 });
  }

  const product = getProductByKey(body.productKey);
  if (!product) {
    return NextResponse.json({ error: "Product config not found." }, { status: 400 });
  }

  const openai = createOpenAIClient();
  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content: `${PRODUCTS_SYSTEM_CONTEXT}

Current product selected:
- productKey: ${product.key}
- productName: ${product.name}
- description: ${product.description}
- requiredCharacteristics:
${product.characteristicPrompts.map((item) => `  - ${item}`).join("\n")}

Response rules for users:
- Never mention JSON in the response.
- If requirements are complete, reply in plain language only.`,
      },
      ...body.messages,
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullOutput = "";
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullOutput += content;
          }
        }

        const finalizedRequirement = extractFinalizedRequirement(fullOutput);
        if (finalizedRequirement) {
          try {
            await prisma.productRequirement.create({
              data: {
                productName: body.productKey,
                requirementsJson: finalizedRequirement,
              },
            });
          } catch (saveError) {
            console.error("Failed to persist finalized requirements.", saveError);
          }

          controller.enqueue(
            encoder.encode(
              `${FINAL_REQUIREMENTS_SAVED_MARKER}${FINAL_REQUIREMENTS_READY_MESSAGE}`,
            ),
          );
        } else {
          controller.enqueue(encoder.encode(sanitizeUserFacingResponse(fullOutput)));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected chat streaming error.";
        controller.enqueue(encoder.encode(`\n[error] ${message}\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
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
