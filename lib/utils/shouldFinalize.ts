type ShouldFinalizeInput = {
  userMessageCount: number;
  completionScore: number;
  coveredDimensionsCount: number;
  enoughInformation: boolean;
};

export const HARD_STOP_AT = 20;

export type FinalizeReason = "hard_stop" | "optimal" | "acceptable" | "not_yet";

export function getFinalizeReason({
  userMessageCount,
  completionScore,
  coveredDimensionsCount,
  enoughInformation,
}: ShouldFinalizeInput): FinalizeReason {
  if (userMessageCount >= HARD_STOP_AT) return "hard_stop";

  // IA signale que c'est bon + 8+ dimensions couvertes
  if (enoughInformation === true && coveredDimensionsCount >= 8 && completionScore >= 0.8) {
    return "optimal";
  }

  // Toutes dimensions couvertes + assez de messages
  if (coveredDimensionsCount >= 10 && userMessageCount >= 13) {
    return "acceptable";
  }

  // Secours
  if (userMessageCount >= 16 && coveredDimensionsCount >= 6) {
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
    case "not_yet": return `Pas encore : ${input.userMessageCount} msgs, ${input.coveredDimensionsCount}/10 dims, score ${input.completionScore.toFixed(2)}.`;
  }
}
