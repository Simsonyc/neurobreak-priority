type BuildFinalizationPromptParams = {
  firstName: string;
  email: string;
  profilSelected: "entrepreneur" | "salarie" | "independant" | "createur";
  conversationHistory: Array<{
    role: "assistant" | "user";
    content: string;
  }>;
};

export function buildFinalizationPrompt({
  firstName,
  email,
  profilSelected,
  conversationHistory,
}: BuildFinalizationPromptParams) {
  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map((message, index) => {
            return `${index + 1}. ${message.role.toUpperCase()}: ${message.content}`;
          })
          .join("\n")
      : "Aucun échange précédent.";

  const profileLabelMap = {
    entrepreneur: "Entrepreneur",
    salarie: "Salarié",
    independant: "Indépendant",
    createur: "Créateur",
  } as const;

  const redirectMap = {
    entrepreneur: "/offre/entrepreneur",
    salarie: "/offre/salarie",
    independant: "/offre/independant",
    createur: "/offre/createur",
  } as const;

  return `
Tu es NeuroBreak Priority™, moteur de finalisation.

Ta tâche est de transformer l'intégralité de la conversation en un diagnostic structuré.

Tu reçois :
- le profil utilisateur
- l'historique complet des échanges

Tu dois produire un JSON final strictement conforme au schéma fourni.

CONTRAINTES CRITIQUES
- Réponds UNIQUEMENT en JSON valide
- Aucun texte avant ou après
- Aucune clé hors schéma
- Respect strict des types

RÈGLES MÉTIER
- Génère entre 8 et 10 priorités
- rank unique, séquentiel, commençant à 1
- impact_score entre 0 et 100
- impact_level dérivé de impact_score :
  - >= 75 → "high"
  - >= 45 → "medium"
  - < 45 → "low"
- priorities triées par rank croissant
- le redirect CTA doit être exactement : ${redirectMap[profilSelected]}
- le profil_label doit être exactement : ${profileLabelMap[profilSelected]}
- language doit être "fr"
- version doit être "1.0"

UTILISATEUR
- first_name: ${firstName}
- email: ${email}
- profil_selected: ${profilSelected}

HISTORIQUE
${historyText}

FORMAT À RESPECTER EXACTEMENT
{
  "meta": {
    "version": "1.0",
    "profil_selected": "${profilSelected}",
    "profil_label": "${profileLabelMap[profilSelected]}",
    "created_at": "2026-04-10T18:20:00Z",
    "language": "fr",
    "confidence_score": 0.87
  },
  "user": {
    "first_name": "${firstName}",
    "email": "${email}"
  },
  "global_summary": {
    "headline": "",
    "summary": "",
    "core_driver": "",
    "core_fear": "",
    "hidden_pattern": ""
  },
  "priorities": [
    {
      "id": "P1",
      "rank": 1,
      "title": "",
      "short": "",
      "description": "",
      "impact_level": "high",
      "impact_score": 92,
      "influences": [],
      "positive_effects": [],
      "negative_patterns": [],
      "recommendation": ""
    }
  ],
  "tensions": [
    {
      "title": "",
      "description": "",
      "impact_on_life": "",
      "impact_on_business": "",
      "how_to_balance": ""
    }
  ],
  "blocks": [
    {
      "title": "",
      "description": "",
      "example": "",
      "root_cause": "",
      "impact_level": "high"
    }
  ],
  "actions": {
    "immediate": [
      {
        "title": "",
        "description": ""
      }
    ],
    "habits_to_change": [],
    "main_lever": {
      "title": "",
      "description": ""
    }
  },
  "projection": {
    "aligned_future": "",
    "what_changes": [],
    "emotional_shift": ""
  },
  "cta": {
    "headline": "Prêt à aligner ton business sur ce que tu es vraiment ?",
    "subtext": "Ce diagnostic n’est que la première étape.",
    "button_label": "Accéder à mon plan d’action personnalisé",
    "redirect": "${redirectMap[profilSelected]}"
  }
}

CONTRAINTES FINALES
- 8 à 10 priorités obligatoires
- tous les champs requis doivent être remplis
- aucun texte hors JSON
`.trim();
}