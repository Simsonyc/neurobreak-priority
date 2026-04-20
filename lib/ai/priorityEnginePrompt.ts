// ── Types ─────────────────────────────────────────────────────────────────────

export type PriorityEngineInput = {
  diagnostic: {
    user: { first_name: string; email: string };
    meta: { profil_selected: string; profil_label: string };
    global_summary: {
      headline: string;
      core_driver: string;
      core_fear: string;
      hidden_pattern: string;
    };
    profil_summary?: string;
    model_recommande?: string;
    priorities: Array<{
      id: string;
      rank: number;
      title: string;
      description: string;
      impact_score: number;
      negative_patterns: string[];
      recommendation: string;
    }>;
    dimension_scores?: Record<string, number>;
    tensions?: Array<{
      title: string;
      description: string;
      how_to_balance: string;
    }>;
    business_blueprint?: {
      business_model: {
        type: string;
        why_aligned: string;
        core_requirements: string[];
      };
      architecture_required: Array<{
        name: string;
        role: string;
        complexity: string;
      }>;
      priority_conflicts: Array<{
        conflict: string;
        resolution_direction: string;
      }>;
    };
    projection?: {
      aligned_future: string;
      emotional_shift: string;
    };
  };
};

export type PriorityEngineOutput = {
  // Règles business déduites des priorités
  business_rules: {
    must_have: string[];       // ce que le modèle DOIT avoir
    must_avoid: string[];      // ce que le modèle DOIT éviter
    success_signals: string[]; // comment savoir que ça marche
  };

  // Contraintes psychologiques
  psychological_constraints: {
    energy_drains: string[];   // ce qui va épuiser cette personne
    motivation_triggers: string[]; // ce qui va la faire avancer
    sabotage_patterns: string[];   // comment elle va se saboter
  };

  // Paramètres pour chaque module
  module_parameters: {
    clarity: {
      positioning_angle: string;    // angle de positionnement recommandé
      client_profile_hint: string;  // type de client qui correspondrait
      tone_of_voice: string;        // comment cette personne doit communiquer
      key_differentiator: string;   // ce qui rend son offre unique
    };
    architecture: {
      recommended_model: string;    // type de modèle (MRR, one-shot, hybride...)
      entry_price_logic: string;    // logique de prix d'entrée
      ladder_depth: "simple" | "medium" | "complex"; // complexité du funnel
      free_vs_paid_logic: string;   // quoi donner gratuit vs payant
    };
    system: {
      complexity_tolerance: "minimal" | "structured" | "automated";
      priority_capabilities: string[]; // capacités à mettre en place en premier
      anti_patterns: string[];         // configurations à éviter
    };
    launch: {
      recommended_speed: "slow" | "medium" | "fast";
      first_90_days_focus: string;
      quick_win_type: string;
      risk_tolerance: "low" | "medium" | "high";
    };
    growth: {
      scaling_readiness: "not_ready" | "almost" | "ready";
      delegation_priority: string;
      kpi_focus: string[];
    };
  };

  // Anti-patterns globaux
  anti_patterns: string[];

  // Score de cohérence global
  alignment_score: number; // 0-100
};

// ── Prompt ────────────────────────────────────────────────────────────────────

export function buildPriorityEnginePrompt(input: PriorityEngineInput): string {
  const { diagnostic } = input;
  const top3 = diagnostic.priorities.slice(0, 3).map(p => `#${p.rank} ${p.title}`).join(", ");
  const tensions = diagnostic.tensions?.map(t => t.title).join(", ") || "aucune";
  const blueprint = diagnostic.business_blueprint?.business_model.type || "non défini";
  const scores = diagnostic.dimension_scores
    ? Object.entries(diagnostic.dimension_scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}/10`)
        .join(", ")
    : "non disponible";

  return `
Tu es le PriorityEngine de NeuroBreak Priority™.

Ta mission : transformer un diagnostic psychologique en règles business exploitables.

Tu ne génères PAS de contenu marketing.
Tu ne génères PAS de texte motivationnel.
Tu génères des PARAMÈTRES STRATÉGIQUES précis qui alimenteront 5 modules business.

DIAGNOSTIC REÇU
- Prénom : ${diagnostic.user.first_name}
- Profil : ${diagnostic.meta.profil_label}
- Modèle recommandé : ${blueprint}
- Top 3 priorités : ${top3}
- Tensions identifiées : ${tensions}
- Dimensions dominantes : ${scores}
- Moteur principal : ${diagnostic.global_summary.core_driver}
- Peur principale : ${diagnostic.global_summary.core_fear}
- Schéma caché : ${diagnostic.global_summary.hidden_pattern}
${diagnostic.projection ? `- Futur aligné : ${diagnostic.projection.aligned_future}` : ""}

RÈGLES DE GÉNÉRATION

1. BUSINESS_RULES
Déduis des priorités ce que le modèle business DOIT avoir (must_have) et DOIT éviter (must_avoid).
Exemple : si securite_stabilite est dominante → must_have "revenus récurrents prévisibles", must_avoid "modèle 100% projet"
Génère 4-6 must_have, 4-6 must_avoid, 3-4 success_signals.

2. PSYCHOLOGICAL_CONSTRAINTS
Déduis des tensions et du schéma caché ce qui va épuiser cette personne, la motiver, et comment elle va se saboter.
Génère 3-4 éléments par sous-catégorie.

3. MODULE_PARAMETERS.CLARITY
Déduis l'angle de positionnement, le profil client, le ton de voix et le différenciateur.
Basé sur les priorités dominantes et le profil sélectionné.

4. MODULE_PARAMETERS.ARCHITECTURE
Déduis le modèle économique recommandé, la logique de prix, la profondeur du funnel et la logique gratuit/payant.
Basé sur le modèle recommandé du diagnostic et les contraintes psychologiques.

5. MODULE_PARAMETERS.SYSTEM
Déduis la tolérance à la complexité technique, les capacités prioritaires et les anti-patterns.
Utilise UNIQUEMENT ces capacités autorisées :
- Acquisition : lead_capture_forms, segmentation_funnel, landing_pages
- Conversion : autoresponder, conversation_bot, appointment_booking
- Nurturing : email_sequences, lead_scoring
- Delivery : membership_area, onboarding_automation
- Monétisation : payment, subscription, upsell
- Pilotage : analytics, tracking

6. MODULE_PARAMETERS.LAUNCH
Déduis la vitesse recommandée, le focus des 90 premiers jours, le type de quick win et la tolérance au risque.

7. MODULE_PARAMETERS.GROWTH
Déduis la maturité au scaling, la priorité de délégation et les KPIs à suivre.

8. ANTI_PATTERNS
Liste 4-6 erreurs spécifiques que cette personne va probablement faire avec son business.
Basées sur le schéma caché et les tensions.

9. ALIGNMENT_SCORE
Score de 0 à 100 représentant la cohérence entre les priorités et le modèle business recommandé.

CONTRAINTES CRITIQUES
- Réponds UNIQUEMENT en JSON valide
- Aucun texte avant ou après le JSON
- Sois PRÉCIS et SPÉCIFIQUE — pas de généralités
- Chaque paramètre doit être directement utilisable par un module
- Adapte chaque paramètre au profil "${diagnostic.meta.profil_selected}"

FORMAT DE SORTIE EXACT
{
  "business_rules": {
    "must_have": [],
    "must_avoid": [],
    "success_signals": []
  },
  "psychological_constraints": {
    "energy_drains": [],
    "motivation_triggers": [],
    "sabotage_patterns": []
  },
  "module_parameters": {
    "clarity": {
      "positioning_angle": "",
      "client_profile_hint": "",
      "tone_of_voice": "",
      "key_differentiator": ""
    },
    "architecture": {
      "recommended_model": "",
      "entry_price_logic": "",
      "ladder_depth": "medium",
      "free_vs_paid_logic": ""
    },
    "system": {
      "complexity_tolerance": "structured",
      "priority_capabilities": [],
      "anti_patterns": []
    },
    "launch": {
      "recommended_speed": "medium",
      "first_90_days_focus": "",
      "quick_win_type": "",
      "risk_tolerance": "medium"
    },
    "growth": {
      "scaling_readiness": "almost",
      "delegation_priority": "",
      "kpi_focus": []
    }
  },
  "anti_patterns": [],
  "alignment_score": 0
}
`.trim();
}
