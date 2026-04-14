import { z } from "zod";

const impactLevelSchema = z.enum(["high", "medium", "low"]);

const profileSchema = z.enum([
  "entrepreneur",
  "salarie",
  "independant",
  "createur",
]);

const profileLabelSchema = z.enum([
  "Entrepreneur",
  "Salarié",
  "Indépendant",
  "Créateur",
]);

const redirectSchema = z.enum([
  "/offre/entrepreneur",
  "/offre/salarie",
  "/offre/independant",
  "/offre/createur",
]);

const prioritySchema = z.object({
  id: z.string().min(1),
  rank: z.number().int().min(1),
  title: z.string().min(1),
  short: z.string().min(1),
  description: z.string().min(1),
  impact_level: impactLevelSchema,
  impact_score: z.number().min(0).max(100),
  influences: z.array(z.string()),
  positive_effects: z.array(z.string()),
  negative_patterns: z.array(z.string()),
  recommendation: z.string().min(1),
});

const tensionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  impact_on_life: z.string().min(1),
  impact_on_business: z.string().min(1),
  how_to_balance: z.string().min(1),
});

const blockSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  example: z.string().min(1),
  root_cause: z.string().min(1),
  impact_level: impactLevelSchema,
});

const dimensionScoresSchema = z.object({
  liberte_autonomie: z.number().int().min(0).max(10),
  securite_stabilite: z.number().int().min(0).max(10),
  croissance_progression: z.number().int().min(0).max(10),
  impact_reconnaissance: z.number().int().min(0).max(10),
  liens_humains: z.number().int().min(0).max(10),
  famille: z.number().int().min(0).max(10),
  creation_expression: z.number().int().min(0).max(10),
  aventure_experiences: z.number().int().min(0).max(10),
  sens_mission: z.number().int().min(0).max(10),
  confort_materiel: z.number().int().min(0).max(10),
});

const radarDataSchema = z.object({
  liberte_autonomie: z.number().min(0).max(100),
  securite_stabilite: z.number().min(0).max(100),
  croissance_progression: z.number().min(0).max(100),
  impact_reconnaissance: z.number().min(0).max(100),
  liens_humains: z.number().min(0).max(100),
  famille: z.number().min(0).max(100),
  creation_expression: z.number().min(0).max(100),
  aventure_experiences: z.number().min(0).max(100),
  sens_mission: z.number().min(0).max(100),
  confort_materiel: z.number().min(0).max(100),
});

const architectureComponentSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  priority_link: z.string().min(1),
  complexity: z.enum(["faible", "moyenne", "élevée"]),
});

const priorityConflictSchema = z.object({
  conflict: z.string().min(1),
  resolution_direction: z.string().min(1),
});

const businessBlueprintSchema = z.object({
  business_model: z.object({
    type: z.string().min(1),
    why_aligned: z.string().min(1),
    core_requirements: z.array(z.string().min(1)).min(1),
  }),
  architecture_required: z.array(architectureComponentSchema).min(1),
  priority_conflicts: z.array(priorityConflictSchema).min(1),
});

export const finalDiagnosticSchema = z.object({
  meta: z.object({
    version: z.literal("1.0"),
    profil_selected: profileSchema,
    profil_label: profileLabelSchema,
    created_at: z.string().datetime(),
    language: z.literal("fr"),
    confidence_score: z.number().min(0).max(1),
  }),
  user: z.object({
    first_name: z.string().min(1),
    email: z.email(),
  }),
  global_summary: z.object({
    headline: z.string().min(1),
    summary: z.string().min(1),
    core_driver: z.string().min(1),
    core_fear: z.string().min(1),
    hidden_pattern: z.string().min(1),
  }),
  profil_summary: z.string().min(1).optional(),
  model_recommande: z.string().min(1).optional(),
  priorities: z.array(prioritySchema).min(8).max(10),
  dimension_scores: dimensionScoresSchema.optional(),
  radar_data: radarDataSchema.optional(),
  business_blueprint: businessBlueprintSchema.optional(),
  tensions: z.array(tensionSchema).min(1),
  // Anciens champs — optionnels pour compatibilité descendante
  blocks: z.array(blockSchema).optional(),
  actions: z.object({
    immediate: z.array(z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    })).min(1),
    habits_to_change: z.array(z.string()),
    main_lever: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  }).optional(),
  projection: z.object({
    aligned_future: z.string().min(1),
    what_changes: z.array(z.string()).min(1),
    emotional_shift: z.string().min(1),
  }),
  cta: z.object({
    headline: z.string().min(1),
    subtext: z.string().min(1),
    button_label: z.string().min(1),
    redirect: redirectSchema,
  }),
}).superRefine((data, ctx) => {
  const ranks = data.priorities.map((p) => p.rank).sort((a, b) => a - b);
  const expectedRanks = Array.from({ length: data.priorities.length }, (_, i) => i + 1);

  if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Priority ranks must be unique and sequential starting at 1",
      path: ["priorities"],
    });
  }

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

  if (data.meta.profil_label !== profileLabelMap[data.meta.profil_selected]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "profil_label does not match profil_selected",
      path: ["meta", "profil_label"],
    });
  }

  if (data.cta.redirect !== redirectMap[data.meta.profil_selected]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "cta.redirect does not match profil_selected",
      path: ["cta", "redirect"],
    });
  }
});

export type FinalDiagnostic = z.infer<typeof finalDiagnosticSchema>;
