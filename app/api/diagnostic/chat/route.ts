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

// Marqueur unique pour identifier le message de boucle forcée.
// Permet de ne pas le confondre avec un vrai message de l'IA lors de la
// détection au tour suivant.
const LOOP_BREAK_MARKER = "__loop_break__";

// Détecte une vraie boucle conversationnelle en excluant les messages de
// boucle forcée déjà injectés — pour éviter que la sortie de boucle ne
// déclenche elle-même la boucle au tour suivant.
function isRepeatingPattern(messages: StoredMessage[]): boolean {
  if (messages.length < 6) return false;

  // On ignore les messages de boucle forcée déjà envoyés
  const realAssistantMessages = messages
    .filter(
      (m) =>
        m.role === "assistant" && !m.content.includes(LOOP_BREAK_MARKER)
    )
    .slice(-3)
    .map((m) => m.content.toLowerCase());

  if (realAssistantMessages.length < 3) return false;

  // Détecte si les 3 derniers vrais messages de l'IA tournent autour des
  // mêmes thèmes — signal que le modèle est bloqué
  const loopSignals = ["tu bloques", "même point", "contrôle", "déléguer", "confiance"];
  const matchCount = realAssistantMessages.filter((msg) =>
    loopSignals.some((signal) => msg.includes(signal))
  ).length;

  return matchCount >= 2;
}

const LOOP_BREAK_MESSAGE = `${LOOP_BREAK_MARKER}
On tourne autour du même point. Je vais forcer une clarification.

👉 Si tu dois choisir ce qui te bloque le plus aujourd'hui :

A) peur de revivre un échec
B) besoin de contrôle total
C) difficulté à faire confiance
D) manque de méthode pour déléguer
E) autre chose (précise)

Choisis UNE seule option. Pas deux.`.trim();

// Texte affiché à l'utilisateur — sans le marqueur technique
const LOOP_BREAK_DISPLAY = LOOP_BREAK_MESSAGE.replace(
  LOOP_BREAK_MARKER + "\n",
  ""
);

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

    const isLooping = isRepeatingPattern(updatedMessagesAfterUser);

    const conversationHistory = updatedMessagesAfterUser.map((message) => ({
      role: message.role,
      // On nettoie le marqueur avant d'envoyer l'historique à l'IA
      content: message.content.replace(LOOP_BREAK_MARKER + "\n", ""),
    }));

    const modelResult = await callConversationModel({
      firstName: session.firstName,
      profilSelected: session.profilSelected,
      conversationHistory,
    });

    // Si boucle détectée : on remplace le message affiché mais on stocke
    // le marqueur pour que la détection future fonctionne correctement
    const assistantStoredText = isLooping
      ? LOOP_BREAK_MESSAGE
      : modelResult.assistant_message;

    const assistantDisplayText = isLooping
      ? LOOP_BREAK_DISPLAY
      : modelResult.assistant_message;

    const assistantMessage = makeMessage("assistant", assistantStoredText);
    const finalMessages = [...updatedMessagesAfterUser, assistantMessage];

    const userMessageCount = finalMessages.filter(
      (message) => message.role === "user"
    ).length;

    const finalizeInput = {
      userMessageCount,
      completionScore: modelResult.diagnostic_state.completion_score,
      coveredDimensionsCount:
        modelResult.diagnostic_state.covered_dimensions.length,
      enoughInformation: modelResult.diagnostic_state.enough_information,
    };

    const finalizeNow = shouldFinalize(finalizeInput);

    // Log de debugging — utile pour calibrer les seuils
    console.log("[shouldFinalize]", getFinalizeReasonLabel(finalizeInput));
    if (isLooping) {
      console.log("[chat] Loop detected — injecting break message");
    }

    await prisma.diagnosticSession.update({
      where: { id: session.id },
      data: {
        status: finalizeNow ? "ready_to_finalize" : "in_progress",
        messages: finalMessages,
        lastDiagnosticState: modelResult.diagnostic_state,
      },
    });

    return NextResponse.json({
      assistant_message: assistantDisplayText,
      diagnostic_state: modelResult.diagnostic_state,
      should_finalize: finalizeNow,
    });
  } catch (error: unknown) {
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
