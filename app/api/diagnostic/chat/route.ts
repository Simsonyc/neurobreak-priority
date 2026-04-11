import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { callConversationModel } from "@/lib/ai/callModel";
import { shouldFinalize } from "@/lib/utils/shouldFinalize";
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

// 🔥 NOUVEAU : détecte répétition
function isRepeatingPattern(messages: StoredMessage[]) {
  if (messages.length < 6) return false;

  const lastAssistantMessages = messages
    .filter((m) => m.role === "assistant")
    .slice(-3)
    .map((m) => m.content.toLowerCase());

  return (
    lastAssistantMessages[0] &&
    lastAssistantMessages.every((msg) =>
      msg.includes("choisir") ||
      msg.includes("tension") ||
      msg.includes("déléguer")
    )
  );
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

    // 🔥 NOUVEAU : détection boucle
    const isLooping = isRepeatingPattern(updatedMessagesAfterUser);

    const conversationHistory = updatedMessagesAfterUser.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const modelResult = await callConversationModel({
      firstName: session.firstName,
      profilSelected: session.profilSelected,
      conversationHistory,
    });

    let assistantText = modelResult.assistant_message;

    // 🔥 NOUVEAU : casser la boucle
    if (isLooping) {
      assistantText = `
On tourne autour du même point.

Je vais forcer une clarification.

👉 Si tu dois choisir ce qui te bloque le plus aujourd’hui :

A) peur de revivre un échec
B) besoin de contrôle total
C) difficulté à faire confiance
D) manque de méthode pour déléguer
E) autre chose (précise)

Choisis UNE seule option.
Pas deux.
      `.trim();
    }

    const assistantMessage = makeMessage("assistant", assistantText);

    const finalMessages = [...updatedMessagesAfterUser, assistantMessage];

    const userMessageCount = finalMessages.filter(
      (message) => message.role === "user"
    ).length;

    const finalizeNow = shouldFinalize({
      userMessageCount,
      completionScore: modelResult.diagnostic_state.completion_score,
      coveredDimensionsCount:
        modelResult.diagnostic_state.covered_dimensions.length,
      enoughInformation: modelResult.diagnostic_state.enough_information,
    });

    await prisma.diagnosticSession.update({
      where: { id: session.id },
      data: {
        status: finalizeNow ? "ready_to_finalize" : "in_progress",
        messages: finalMessages,
        lastDiagnosticState: modelResult.diagnostic_state,
      },
    });

    return NextResponse.json({
      assistant_message: assistantText,
      diagnostic_state: modelResult.diagnostic_state,
      should_finalize: finalizeNow,
    });
  } catch (error) {
    console.error("Chat route error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server error during chat processing" },
      { status: 500 }
    );
  }
}