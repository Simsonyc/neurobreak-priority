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

const ALL_DIMENSIONS = [
  "liberte_autonomie", "securite_stabilite", "croissance_progression",
  "impact_reconnaissance", "liens_humains", "famille",
  "creation_expression", "aventure_experiences", "sens_mission", "confort_materiel",
];

export async function callConversationModel({
  firstName,
  profilSelected,
  conversationHistory,
}: CallConversationModelParams): Promise<ConversationModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

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
        { role: "system", content: conversationSystemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned by model");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON from model: ${content.slice(0, 200)}`);
  }

  // Récupère le message — tolère plusieurs noms de champs
  const assistantMessage =
    parsed.assistant_message ||
    parsed.message ||
    parsed.response ||
    parsed.content ||
    "";

  if (!assistantMessage || typeof assistantMessage !== "string") {
    throw new Error("Model response missing assistant_message field");
  }

  // Reconstruit diagnostic_state avec fallbacks robustes
  const raw = parsed.diagnostic_state || parsed.state || {};

  // Calcule covered_dimensions depuis l'historique si absent
  const covered: string[] = Array.isArray(raw.covered_dimensions)
    ? raw.covered_dimensions
    : [];

  const missing = ALL_DIMENSIONS.filter((d) => !covered.includes(d));

  const score = typeof raw.completion_score === "number"
    ? raw.completion_score
    : covered.length / 10;

  const diagnosticState = {
    enough_information: raw.enough_information === true,
    completion_score: Math.min(Math.max(score, 0), 1),
    covered_dimensions: covered,
    missing_dimensions: Array.isArray(raw.missing_dimensions)
      ? raw.missing_dimensions
      : missing,
    dominant_signals: Array.isArray(raw.dominant_signals) ? raw.dominant_signals : [],
    emerging_priorities: Array.isArray(raw.emerging_priorities) ? raw.emerging_priorities : [],
    next_focus: raw.next_focus ?? "",
    reason_for_next_question: raw.reason_for_next_question ?? "",
  };

  return { assistant_message: assistantMessage, diagnostic_state: diagnosticState };
}
