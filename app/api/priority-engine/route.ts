import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { buildPriorityEnginePrompt, type PriorityEngineOutput } from "@/lib/ai/priorityEnginePrompt";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const schema = z.object({
  rid: z.string().min(1),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rid } = schema.parse(body);

    // Récupère le diagnostic
    const result = await prisma.diagnosticResult.findUnique({
      where: { id: rid },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Diagnostic not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Vérifie si un engine output existe déjà
    const existing = await prisma.priorityEngineOutput.findUnique({
      where: { resultId: rid },
    });

    if (existing) {
      return NextResponse.json(
        { engine: existing.engineJson, cached: true },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Génère le PriorityEngine
    const diagnostic = result.diagnosticJson as Record<string, unknown>;
    const prompt = buildPriorityEnginePrompt({ diagnostic } as Parameters<typeof buildPriorityEnginePrompt>[0]);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Tu es le PriorityEngine de NeuroBreak Priority™. Tu réponds UNIQUEMENT en JSON valide.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      throw new Error(`OpenAI error: ${openaiRes.status}`);
    }

    const data = await openaiRes.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from model");

    const engineOutput = JSON.parse(content) as PriorityEngineOutput;

    // Sauvegarde en base
    await prisma.priorityEngineOutput.create({
      data: {
        resultId: rid,
        engineJson: engineOutput as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      { engine: engineOutput, cached: false },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[PriorityEngine]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.flatten() },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
