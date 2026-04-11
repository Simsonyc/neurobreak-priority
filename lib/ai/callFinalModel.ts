type FinalDiagnostic = {
  meta: {
    version: string;
    profil_selected: string;
    profil_label: string;
    created_at: string;
    language: string;
    confidence_score: number;
  };
  user: {
    first_name: string;
    email: string;
  };
  global_summary: {
    headline: string;
    summary: string;
    core_driver: string;
    core_fear: string;
    hidden_pattern: string;
  };
  priorities: Array<{
    id: string;
    rank: number;
    title: string;
    short: string;
    description: string;
    impact_level: "high" | "medium" | "low";
    impact_score: number;
    influences: string[];
    positive_effects: string[];
    negative_patterns: string[];
    recommendation: string;
  }>;
  tensions: Array<{
    title: string;
    description: string;
    impact_on_life: string;
    impact_on_business: string;
    how_to_balance: string;
  }>;
  blocks: Array<{
    title: string;
    description: string;
    example: string;
    root_cause: string;
    impact_level: "high" | "medium" | "low";
  }>;
  actions: {
    immediate: Array<{
      title: string;
      description: string;
    }>;
    habits_to_change: string[];
    main_lever: {
      title: string;
      description: string;
    };
  };
  projection: {
    aligned_future: string;
    what_changes: string[];
    emotional_shift: string;
  };
  cta: {
    headline: string;
    subtext: string;
    button_label: string;
    redirect: string;
  };
};

export async function callFinalModel(prompt: string): Promise<FinalDiagnostic> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Tu réponds uniquement en JSON valide.",
        },
        {
          role: "user",
          content: prompt,
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
    throw new Error("No content returned by final model");
  }

  try {
    return JSON.parse(content) as FinalDiagnostic;
  } catch {
    throw new Error("Final model did not return valid JSON");
  }
}