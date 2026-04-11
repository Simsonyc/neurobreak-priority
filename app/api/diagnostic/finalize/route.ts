import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { buildFinalizationPrompt } from "@/lib/ai/finalizationPrompt";
import { callFinalModel } from "@/lib/ai/callFinalModel";
import {
  finalDiagnosticSchema,
  type FinalDiagnostic,
} from "@/lib/validation/finalDiagnostic.schema";

const finalizeSchema = z.object({
  session_id: z.string().min(1),
});

type StoredMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
};

function normalizeImpactLevel(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function normalizeDiagnostic(data: FinalDiagnostic): FinalDiagnostic {
  return {
    ...data,
    priorities: data.priorities
      .map((priority) => ({
        ...priority,
        impact_level: normalizeImpactLevel(priority.impact_score),
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}

async function generateValidatedDiagnostic(prompt: string): Promise<FinalDiagnostic> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await callFinalModel(prompt);
      const normalized = normalizeDiagnostic(raw);
      return finalDiagnosticSchema.parse(normalized);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = finalizeSchema.parse(body);

    const session = await prisma.diagnosticSession.findUnique({
      where: { id: parsed.session_id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const existingResult = await prisma.diagnosticResult.findUnique({
      where: { sessionId: session.id },
    });

    if (existingResult) {
      return NextResponse.json(
        {
          result_id: existingResult.id,
          already_finalized: true,
        },
        { status: 200 }
      );
    }

    const messages = Array.isArray(session.messages)
      ? (session.messages as unknown as StoredMessage[])
      : [];

    const conversationHistory = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    await prisma.diagnosticSession.update({
      where: { id: session.id },
      data: { status: "finalizing" },
    });

    const prompt = buildFinalizationPrompt({
      firstName: session.firstName,
      email: session.email,
      profilSelected: session.profilSelected,
      conversationHistory,
    });

    const diagnostic = await generateValidatedDiagnostic(prompt);

    const result = await prisma.diagnosticResult.create({
      data: {
        sessionId: session.id,
        firstName: session.firstName,
        email: session.email,
        profilSelected: session.profilSelected,
        diagnosticJson: diagnostic,
      },
    });

    await prisma.diagnosticSession.update({
      where: { id: session.id },
      data: {
        status: "completed",
        resultId: result.id,
      },
    });

    return NextResponse.json(
      {
        result_id: result.id,
        diagnostic,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Finalize route error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid payload or diagnostic schema error",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server error during finalization" },
      { status: 500 }
    );
  }
}