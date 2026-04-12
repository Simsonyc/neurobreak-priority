type ShouldFinalizeInput = {
  userMessageCount: number;
  completionScore: number;
  coveredDimensionsCount: number;
  enoughInformation: boolean;
};

export const HARD_STOP_AT = 14;

export function shouldFinalize({
  userMessageCount,
  completionScore,
  coveredDimensionsCount,
  enoughInformation,
}: ShouldFinalizeInput): boolean {
  // sécurité absolue
  if (userMessageCount >= HARD_STOP_AT) {
    return true;
  }

  // on ne finalise jamais avant une vraie profondeur
  const hasMinimumDepth = userMessageCount >= 10;

  // on veut une couverture plus large des dimensions
  const hasEnoughCoverage = coveredDimensionsCount >= 7;

  // score IA plus exigeant
  const hasGoodScore = completionScore >= 0.82;

  // validation IA
  const aiFeelsReady = enoughInformation === true;

  return (
    hasMinimumDepth &&
    hasEnoughCoverage &&
    hasGoodScore &&
    aiFeelsReady
  );
}