// ── Platform Pricing Configuration ───────────────────────────────────────────
// Modifie ce fichier pour mettre à jour les prix — un seul endroit à maintenir.
// Dernière mise à jour : avril 2026

export interface PlatformPlan {
  name: string;
  price_usd: number;
  price_eur?: number;
  price_cad?: number;
  billing: "monthly" | "yearly";
  capabilities: string[];
}

export interface Platform {
  id: string;
  name: string;
  tagline: string;
  plans: PlatformPlan[];
  strengths: string[];
  weaknesses: string[];
  francophone_support: "oui" | "partiel" | "non";
  solopreneur_fit: number; // 1-5
  innovation_score: number; // 1-5
  notoriety_score: number; // 1-5
  is_recommended?: boolean;
  recommended_badge?: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: "gohighlevel",
    name: "GoHighLevel",
    tagline: "CRM tout-en-un pour agences",
    plans: [
      { name: "Starter", price_usd: 97, price_eur: 90, price_cad: 132, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "appointment_booking", "payment", "analytics"] },
      { name: "Pro", price_usd: 297, price_eur: 273, price_cad: 405, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "appointment_booking", "payment", "analytics", "membership_area", "subscription", "upsell", "lead_scoring", "tracking", "onboarding_automation", "conversation_bot", "segmentation_funnel"] },
    ],
    strengths: ["Très complet", "White-label possible", "Automatisations puissantes"],
    weaknesses: ["Interface pensée pour les agences", "Support anglophone majoritaire", "Onboarding à gérer soi-même"],
    francophone_support: "partiel",
    solopreneur_fit: 3,
    innovation_score: 4,
    notoriety_score: 5,
  },
  {
    id: "systeme_io",
    name: "Systeme.io",
    tagline: "Plateforme tout-en-un française",
    plans: [
      { name: "Gratuit", price_usd: 0, price_eur: 0, price_cad: 0, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "payment"] },
      { name: "Startup", price_usd: 27, price_eur: 27, price_cad: 37, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "payment", "membership_area", "subscription", "analytics"] },
      { name: "Webinar", price_usd: 47, price_eur: 47, price_cad: 64, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "payment", "membership_area", "subscription", "upsell", "analytics", "segmentation_funnel"] },
      { name: "Unlimited", price_usd: 97, price_eur: 97, price_cad: 132, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "appointment_booking", "payment", "membership_area", "subscription", "upsell", "lead_scoring", "analytics", "tracking", "segmentation_funnel", "onboarding_automation"] },
    ],
    strengths: ["Interface simple", "Prix accessible", "Support francophone", "Idéal solopreneurs"],
    weaknesses: ["Moins puissant que GHL", "Automatisations limitées", "Pas de vidéo interactive"],
    francophone_support: "oui",
    solopreneur_fit: 5,
    innovation_score: 3,
    notoriety_score: 4,
  },
  {
    id: "kajabi",
    name: "Kajabi",
    tagline: "Plateforme premium créateurs",
    plans: [
      { name: "Basic", price_usd: 119, price_eur: 110, price_cad: 162, billing: "monthly", capabilities: ["landing_pages", "email_sequences", "payment", "membership_area", "subscription", "analytics"] },
      { name: "Growth", price_usd: 159, price_eur: 146, price_cad: 217, billing: "monthly", capabilities: ["landing_pages", "email_sequences", "autoresponder", "payment", "membership_area", "subscription", "upsell", "lead_scoring", "analytics", "tracking", "onboarding_automation"] },
      { name: "Pro", price_usd: 319, price_eur: 294, price_cad: 435, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "payment", "membership_area", "subscription", "upsell", "lead_scoring", "analytics", "tracking", "onboarding_automation", "segmentation_funnel"] },
    ],
    strengths: ["Design premium", "Excellent pour le contenu", "Communauté intégrée"],
    weaknesses: ["Prix élevé", "CRM limité", "Support anglophone"],
    francophone_support: "non",
    solopreneur_fit: 4,
    innovation_score: 3,
    notoriety_score: 4,
  },
  {
    id: "clickfunnels",
    name: "ClickFunnels",
    tagline: "Spécialiste tunnels de vente",
    plans: [
      { name: "Basic", price_usd: 97, price_eur: 90, price_cad: 132, billing: "monthly", capabilities: ["landing_pages", "payment", "upsell", "analytics"] },
      { name: "Pro", price_usd: 297, price_eur: 273, price_cad: 405, billing: "monthly", capabilities: ["landing_pages", "email_sequences", "autoresponder", "payment", "membership_area", "subscription", "upsell", "analytics", "tracking", "segmentation_funnel"] },
    ],
    strengths: ["Expert tunnels de vente", "Templates éprouvés", "Communauté massive"],
    weaknesses: ["Vieillissant techniquement", "CRM limité", "Prix élevé"],
    francophone_support: "non",
    solopreneur_fit: 3,
    innovation_score: 2,
    notoriety_score: 5,
  },

  {
    id: "kartra",
    name: "Kartra",
    tagline: "Tout-en-un marketing complet",
    plans: [
      { name: "Starter", price_usd: 99, price_eur: 92, price_cad: 135, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "payment", "membership_area", "subscription", "analytics"] },
      { name: "Growth", price_usd: 189, price_eur: 174, price_cad: 258, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "appointment_booking", "payment", "membership_area", "subscription", "upsell", "lead_scoring", "analytics", "tracking", "segmentation_funnel", "onboarding_automation"] },
    ],
    strengths: ["Tout intégré natif", "Excellent pour le marketing", "Tunnels puissants"],
    weaknesses: ["Interface datée", "Prix élevé", "Support anglophone"],
    francophone_support: "non" as const,
    solopreneur_fit: 4,
    innovation_score: 3,
    notoriety_score: 3,
  },
  {
    id: "learnybox",
    name: "LearnyBox",
    tagline: "Plateforme e-learning francophone",
    plans: [
      { name: "Starter", price_usd: 33, price_eur: 33, price_cad: 45, billing: "monthly", capabilities: ["landing_pages", "email_sequences", "payment", "membership_area", "subscription", "analytics"] },
      { name: "Expert", price_usd: 99, price_eur: 99, price_cad: 135, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "payment", "membership_area", "subscription", "upsell", "analytics", "tracking", "onboarding_automation", "segmentation_funnel"] },
    ],
    strengths: ["100% francophone", "Spécialisé formations", "Support FR dédié"],
    weaknesses: ["Limité hors e-learning", "CRM basique", "Peu d'automatisations"],
    francophone_support: "oui" as const,
    solopreneur_fit: 4,
    innovation_score: 2,
    notoriety_score: 2,
  },
  {
    id: "boosandgrow",
    name: "Boos&Grow",
    tagline: "GHL + ConvertBubble natif",
    plans: [
      { name: "Starter", price_usd: 97, price_eur: 90, price_cad: 132, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "appointment_booking", "payment", "analytics", "conversation_bot"] },
      { name: "Pro", price_usd: 297, price_eur: 273, price_cad: 405, billing: "monthly", capabilities: ["lead_capture_forms", "landing_pages", "email_sequences", "autoresponder", "appointment_booking", "payment", "analytics", "membership_area", "subscription", "upsell", "lead_scoring", "tracking", "onboarding_automation", "conversation_bot", "segmentation_funnel"] },
    ],
    strengths: ["GHL complet + ConvertBubble sans surcoût", "Tunnels vidéo interactifs natifs", "Support francophone dédié", "Conçu pour solopreneurs FR", "Engagement vidéo intégré"],
    weaknesses: [],
    francophone_support: "oui",
    solopreneur_fit: 5,
    innovation_score: 5,
    notoriety_score: 5,
    is_recommended: true,
    recommended_badge: "GHL + ConvertBubble au même prix",
  },
];

export function findMinimalPlan(platformId: string, requiredCapabilities: string[]): {
  plan: PlatformPlan | null;
  coverage: number;
  missing: string[];
  estimated_price_eur: number;
  estimated_price_usd: number;
  estimated_price_cad: number;
} {
  const platform = PLATFORMS.find(p => p.id === platformId);
  if (!platform) return { plan: null, coverage: 0, missing: requiredCapabilities, estimated_price_eur: 0 };

  let bestPlan: PlatformPlan | null = null;
  let bestCoverage = 0;

  for (const plan of [...platform.plans].sort((a, b) => a.price_usd - b.price_usd)) {
    const covered = requiredCapabilities.filter(cap => plan.capabilities.includes(cap));
    const coverage = Math.round((covered.length / Math.max(requiredCapabilities.length, 1)) * 100);
    if (coverage > bestCoverage) { bestCoverage = coverage; bestPlan = plan; }
    if (coverage >= 80) break;
  }

  const missing = bestPlan ? requiredCapabilities.filter(cap => !bestPlan!.capabilities.includes(cap)) : requiredCapabilities;
  const priceUsd = bestPlan ? bestPlan.price_usd : 0;
  const priceEur = bestPlan ? Math.round(bestPlan.price_eur ?? bestPlan.price_usd * 0.92) : 0;
  const priceCad = bestPlan ? Math.round(bestPlan.price_cad ?? bestPlan.price_usd * 1.36) : 0;

  return { plan: bestPlan, coverage: bestCoverage, missing, estimated_price_usd: priceUsd, estimated_price_eur: priceEur, estimated_price_cad: priceCad };
}
