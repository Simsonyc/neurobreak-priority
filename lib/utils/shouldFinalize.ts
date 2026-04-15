type ShouldFinalizeInput = {
  userMessageCount: number;
  completionScore: number;
  coveredDimensionsCount: number;
  enoughInformation: boolean;
};

// 10 dimensions × 3 échanges = 30 messages utilisateur minimum
// On accepte 28 pour tolérer le message trigger "Démarre le diagnostic."
export const MIN_MESSAGES = 28;
export const HARD_STOP_AT = 40;

export type FinalizeReason = "hard_stop" | "optimal" | "acceptable" | "not_yet";

export function getFinalizeReason({
  userMessageCount,
  completionScore,
  coveredDimensionsCount,
  enoughInformation,
}: ShouldFinalizeInput): FinalizeReason {
  // Sécurité absolue
  if (userMessageCount >= HARD_STOP_AT) return "hard_stop";

  // Pas assez de messages — trop tôt quoi qu'il arrive
  if (userMessageCount < MIN_MESSAGES) return "not_yet";

  // Finalisation optimale — IA signale que c'est bon
  if (enoughInformation === true && coveredDimensionsCount >= 8 && completionScore >= 0.8) {
    return "optimal";
  }

  // Finalisation acceptable — toutes dimensions couvertes
  if (coveredDimensionsCount >= 10 && userMessageCount >= MIN_MESSAGES) {
    return "acceptable";
  }

  // Secours — beaucoup de messages même sans signal IA
  if (userMessageCount >= 35 && coveredDimensionsCount >= 6) {
    return "acceptable";
  }

  return "not_yet";
}

export function shouldFinalize(input: ShouldFinalizeInput): boolean {
  return getFinalizeReason(input) !== "not_yet";
}

export function getFinalizeReasonLabel(input: ShouldFinalizeInput): string {
  const reason = getFinalizeReason(input);
  switch (reason) {
    case "hard_stop": return `Hard stop : ${input.userMessageCount} msgs >= ${HARD_STOP_AT}.`;
    case "optimal": return `Optimal : ${input.coveredDimensionsCount}/10 dims, score ${input.completionScore.toFixed(2)}, IA prête.`;
    case "acceptable": return `Acceptable : ${input.userMessageCount} msgs, ${input.coveredDimensionsCount}/10 dims.`;
    case "not_yet": return `Pas encore : ${input.userMessageCount}/${MIN_MESSAGES} msgs min, ${input.coveredDimensionsCount}/10 dims, score ${input.completionScore.toFixed(2)}.`;
  }
}
