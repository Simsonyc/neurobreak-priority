export const conversationSystemPrompt = `
Tu es NeuroBreak Priority™, agent de diagnostic psychologique.

MISSION : identifier 10 dimensions par un dialogue structuré.
STRUCTURE : pour chaque dimension, 3 échanges exacts :
1. Question fermée (7 options A→G)
2. Question ouverte n°1
3. Question ouverte n°2
Puis dimension suivante.

DIMENSIONS (ordre strict) :
1. liberte_autonomie
2. securite_stabilite
3. croissance_progression
4. impact_reconnaissance
5. liens_humains
6. famille
7. creation_expression
8. aventure_experiences
9. sens_mission
10. confort_materiel

FORMAT QUESTION FERMÉE :
[N/10] — [Dimension]
[Question courte]
A) [5 mots max]
B) [5 mots max]
C) [5 mots max]
D) [5 mots max]
E) [5 mots max]
F) [5 mots max]
G) Pas ma priorité
→ Choisis A à G.

FORMAT QUESTION OUVERTE :
[Question directe, max 30 mots]
Ex: [exemple de réponse courte]

RÈGLES :
- Options courtes — 5 mots max chacune
- Aucun commentaire sur les réponses précédentes
- Pas de blabla, pas d'introduction
- Style direct, sobre, NeuroBreak™
- A = intensité maximale, G = pas ma priorité
- Adapte le vocabulaire au profil utilisateur

TAXONOMIE diagnostic_state (valeurs exactes uniquement) :
liberte_autonomie, securite_stabilite, croissance_progression,
impact_reconnaissance, liens_humains, famille, creation_expression,
aventure_experiences, sens_mission, confort_materiel

FORMAT SORTIE OBLIGATOIRE — JSON uniquement :
{
  "assistant_message": "...",
  "diagnostic_state": {
    "enough_information": false,
    "completion_score": 0.0,
    "covered_dimensions": [],
    "missing_dimensions": [],
    "dominant_signals": [],
    "emerging_priorities": [],
    "next_focus": "",
    "reason_for_next_question": ""
  }
}

completion_score = dimensions complétées / 10
covered_dimensions = dimensions avec 3 échanges terminés
enough_information = true quand 10 dimensions couvertes
`.trim();

const DIMENSION_ORDER = [
  "liberte_autonomie",
  "securite_stabilite",
  "croissance_progression",
  "impact_reconnaissance",
  "liens_humains",
  "famille",
  "creation_expression",
  "aventure_experiences",
  "sens_mission",
  "confort_materiel",
];

type BuildConversationUserPromptParams = {
  firstName: string;
  profilSelected: "entrepreneur" | "salarie" | "independant" | "createur";
  conversationHistory: Array<{
    role: "assistant" | "user";
    content: string;
  }>;
};

export function buildConversationUserPrompt({
  firstName,
  profilSelected,
  conversationHistory,
}: BuildConversationUserPromptParams) {
  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map((m, i) => `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")
      : "Aucun échange.";

  const userMessages = conversationHistory.filter((m) => m.role === "user");
  const assistantMessages = conversationHistory.filter((m) => m.role === "assistant");
  const isFirstTurn = userMessages.length === 0;

  const closedCount = assistantMessages.filter((m) =>
    /\[\d+\/10\]/.test(m.content)
  ).length;

  const completedDimensions = Math.floor(userMessages.length / 3);
  const exchangeInDimension = userMessages.length % 3;
  const currentDimensionIndex = Math.min(completedDimensions, 9);
  const currentDimension = DIMENSION_ORDER[currentDimensionIndex];
  const allDone = completedDimensions >= 10;

  let instruction = "";

  if (isFirstTurn) {
    instruction = `Premier tour. 1 phrase d'accueil max, puis pose immédiatement [1/10] liberte_autonomie avec 7 options courtes (5 mots max chacune).`;
  } else if (allDone) {
    instruction = `Toutes les dimensions sont couvertes. Une phrase de conclusion courte. Passe enough_information à true.`;
  } else if (exchangeInDimension === 0) {
    instruction = `Pose la question fermée [${closedCount + 1}/10] pour "${currentDimension}". 7 options A→G, 5 mots max par option. Aucun commentaire sur la réponse précédente.`;
  } else if (exchangeInDimension === 1) {
    instruction = `Pose la 1ère question ouverte sur "${currentDimension}". Max 30 mots + "Ex: [exemple court]". Basée sur la réponse fermée.`;
  } else {
    instruction = `Pose la 2ème question ouverte sur "${currentDimension}". Max 30 mots + "Ex: [exemple court]". Creuse une tension ou nuance.`;
  }

  return `
Prénom: ${firstName} | Profil: ${profilSelected}
Dimensions complétées: ${completedDimensions}/10
Échange en cours: ${allDone ? "TERMINÉ" : `${currentDimension} — échange ${exchangeInDimension + 1}/3`}

HISTORIQUE:
${historyText}

INSTRUCTION: ${instruction}
`.trim();
}
