import {
  conversationSystemPrompt,
  buildConversationUserPrompt,
} from "@/lib/ai/conversationPrompt";

type ConversationModelResult = {
  assistant_message: string;
  diagnostic_state: {
    enough_information: boolean;
    completion_score: number;
    covered_dimensions: string[];
    missing_dimensions: string[];
    dominant_signals: string[];
    emerging_priorities: string[];
    next_focus: string;
    reason_for_next_question: string;
  };
};

type CallConversationModelParams = {
  firstName: string;
  profilSelected: "entrepreneur" | "salarie" | "independant" | "createur";
  conversationHistory: Array<{
    role: "assistant" | "user";
    content: string;
  }>;
};

export async function callConversationModel({
  firstName,
  profilSelected,
  conversationHistory,
}: CallConversationModelParams): Promise<ConversationModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const userPrompt = buildConversationUserPrompt({
    firstName,
    profilSelected,
    conversationHistory,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.55, // 🔥 plus bas = trop structuré
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: conversationSystemPrompt,
        },

        // 🔥 AJOUT CRITIQUE
        {
          role: "system",
          content: `
Tu es dans une conversation en cours.

Tu ne redémarres JAMAIS de zéro.
Tu continues un diagnostic déjà entamé.

Ton rôle n’est pas d’analyser globalement.
Ton rôle est de faire avancer le diagnostic étape par étape.

Tu dois :
- reprendre le dernier point implicite
- faire progresser la réflexion
- poser UNE question utile
- éviter les grandes questions ouvertes
- forcer la clarification ou l’arbitrage

Tu ne dois jamais :
- repartir sur une question générique
- reformuler toute la situation
- faire du coaching large

Tu es un moteur de progression, pas un observateur.
          `.trim(),
        },

        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned by model");
  }

  try {
    return JSON.parse(content) as ConversationModelResult;
  } catch {
    throw new Error("Model did not return valid JSON");
  }
}