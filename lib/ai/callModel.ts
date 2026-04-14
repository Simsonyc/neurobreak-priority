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
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: conversationSystemPrompt,
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

  let parsed: ConversationModelResult;

  try {
    parsed = JSON.parse(content) as ConversationModelResult;
  } catch {
    throw new Error(`Model did not return valid JSON. Raw content: ${content.slice(0, 200)}`);
  }

  // Validation minimale — évite des crashes silencieux en aval
  if (!parsed.assistant_message || typeof parsed.assistant_message !== "string") {
    throw new Error("Model response missing assistant_message field");
  }

  if (!parsed.diagnostic_state || typeof parsed.diagnostic_state !== "object") {
    throw new Error("Model response missing diagnostic_state field");
  }

  return parsed;
}
