import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { callConversationModel } from "@/lib/ai/callModel";
import { shouldFinalize, getFinalizeReasonLabel } from "@/lib/utils/shouldFinalize";
import { z } from "zod";

const chatSchema = z.object({
  session_id: z.string().min(1),
  user_message: z.string().min(1),
});

type StoredMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
};

function makeMessage(
  role: "assistant" | "user",
  content: string
): StoredMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = chatSchema.parse(body);

    const session = await prisma.diagnosticSession.findUnique({
      where: { id: parsed.session_id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const existingMessages = Array.isArray(session.messages)
      ? (session.messages as unknown as StoredMessage[])
      : [];

    const userMessage = makeMessage("user", parsed.user_message);
    const updatedMessagesAfterUser = [...existingMessages, userMessage];

    const conversationHistory = updatedMessagesAfterUser.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const modelResult = await callConversationModel({
      firstName: session.firstName,
      profilSelected: session.profilSelected,
      conversationHistory,
    });

    const assistantMessage = makeMessage(
      "assistant",
      modelResult.assistant_message
    );
    const finalMessages = [...updatedMessagesAfterUser, assistantMessage];

    const userMessageCount = finalMessages.filter(
      (m) => m.role === "user"
    ).length;

    const finalizeInput = {
      userMessageCount,
      completionScore: modelResult.diagnostic_state.completion_score,
      coveredDimensionsCount:
        modelResult.diagnostic_state.covered_dimensions.length,
      enoughInformation: modelResult.diagnostic_state.enough_information,
    };

    const finalizeNow = shouldFinalize(finalizeInput);

    console.log("[shouldFinalize]", getFinalizeReasonLabel(finalizeInput));
    console.log("[covered]", modelResult.diagnostic_state.covered_dimensions);
    console.log("[score]", modelResult.diagnostic_state.completion_score);

    await prisma.diagnosticSession.update({
      where: { id: session.id },
      data: {
        status: finalizeNow ? "ready_to_finalize" : "in_progress",
        messages: finalMessages,
        lastDiagnosticState: modelResult.diagnostic_state,
      },
    });

    return NextResponse.json({
      assistant_message: modelResult.assistant_message,
      diagnostic_state: modelResult.diagnostic_state,
      should_finalize: finalizeNow,
    });
  } catch (error: unknown) {
    console.error("Chat route error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server error during chat processing" },
      { status: 500 }
    );
  }
}
