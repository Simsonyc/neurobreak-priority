type ShouldFinalizeInput = {
  userMessageCount: number;
  completionScore: number;
  coveredDimensionsCount: number;
  enoughInformation: boolean;
};

export const HARD_STOP_AT = 16;

export type FinalizeReason =
  | "hard_stop"
  | "optimal"
  | "acceptable"
  | "not_yet";

export function getFinalizeReason({
  userMessageCount,
  completionScore,
  coveredDimensionsCount,
  enoughInformation,
}: ShouldFinalizeInput): FinalizeReason {
  // Sécurité absolue
  if (userMessageCount >= HARD_STOP_AT) {
    return "hard_stop";
  }

  // Finalisation optimale — toutes conditions réunies
  if (
    userMessageCount >= 10 &&
    coveredDimensionsCount >= 8 &&
    completionScore >= 0.8 &&
    enoughInformation === true
  ) {
    return "optimal";
  }

  // Finalisation acceptable — conditions partiellement réunies
  if (
    userMessageCount >= 13 &&
    coveredDimensionsCount >= 6 &&
    completionScore >= 0.7
  ) {
    return "acceptable";
  }

  return "not_yet";
}

export function shouldFinalize(input: ShouldFinalizeInput): boolean {
  const reason = getFinalizeReason(input);
  return reason !== "not_yet";
}

export function getFinalizeReasonLabel(input: ShouldFinalizeInput): string {
  const reason = getFinalizeReason(input);

  switch (reason) {
    case "hard_stop":
      return `Hard stop déclenché : ${input.userMessageCount} messages utilisateur >= limite de ${HARD_STOP_AT}.`;
    case "optimal":
      return `Finalisation optimale : ${input.userMessageCount} messages, ${input.coveredDimensionsCount}/10 dimensions couvertes, score ${input.completionScore.toFixed(2)}, IA prête.`;
    case "acceptable":
      return `Finalisation acceptable : ${input.userMessageCount} messages, ${input.coveredDimensionsCount}/10 dimensions couvertes, score ${input.completionScore.toFixed(2)} — seuil minimal atteint.`;
    case "not_yet":
      return `Pas encore : ${input.userMessageCount} messages, ${input.coveredDimensionsCount}/10 dimensions, score ${input.completionScore.toFixed(2)}, IA prête: ${input.enoughInformation}.`;
  }
}