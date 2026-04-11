type ShouldFinalizeInput = {
  userMessageCount: number;
  completionScore: number;
  coveredDimensionsCount: number;
  enoughInformation: boolean;
};

export const HARD_STOP_AT = 12;

export function shouldFinalize({
  userMessageCount,
  completionScore,
  coveredDimensionsCount,
  enoughInformation,
}: ShouldFinalizeInput): boolean {
  // 🔥 1. HARD STOP (sécurité absolue)
  if (userMessageCount >= HARD_STOP_AT) {
    return true;
  }

  // 🔥 2. minimum réel (évite finalisation trop tôt)
  const hasMinimumDepth = userMessageCount >= 7;

  // 🔥 3. profondeur psychologique minimale
  const hasEnoughCoverage = coveredDimensionsCount >= 5;

  // 🔥 4. score IA (indicatif seulement)
  const hasGoodScore = completionScore >= 0.75;

  // 🔥 5. validation IA
  const aiFeelsReady = enoughInformation === true;

  // 🔥 6. logique combinée plus robuste
  if (
    hasMinimumDepth &&
    hasEnoughCoverage &&
    hasGoodScore &&
    aiFeelsReady
  ) {
    return true;
  }

  return false;
}