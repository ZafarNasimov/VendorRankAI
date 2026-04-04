import { createHash } from "crypto";

export function sha256(data: object | string): string {
  const content =
    typeof data === "string" ? data : JSON.stringify(data, null, 0);
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function hashEvaluation(evaluation: {
  tenderId: string;
  ranking: unknown;
  criterionScores: unknown;
  reasoning: string;
  redFlags: unknown;
}): string {
  return sha256({
    tenderId: evaluation.tenderId,
    ranking: evaluation.ranking,
    criterionScores: evaluation.criterionScores,
    reasoning: evaluation.reasoning,
    redFlags: evaluation.redFlags,
  });
}

export function hashDecision(decision: {
  tenderId: string;
  aiRecommendedVendorId: string;
  selectedVendorId: string;
  overrideUsed: boolean;
  overrideReason?: string | null;
  timestamp: string;
}): string {
  return sha256(decision);
}
