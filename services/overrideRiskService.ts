/**
 * Override Risk Assessment Service
 *
 * Computes a risk level and reasons when a human selects a vendor
 * that differs from the AI top recommendation.
 *
 * This is a deterministic, rule-based assessment — no AI required.
 * Results are stored in ProcurementDecision and surfaced in the UI.
 */

import type { VendorProposal, VendorRankEntry } from "@/types/tender";

export type OverrideRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface OverrideRiskAssessment {
  riskLevel: OverrideRiskLevel;
  reasons: string[];
  scoreGap: number;
  complianceGapSummary: string;
}

/**
 * Assess the risk of a human override decision.
 *
 * @param aiTopVendor         The AI-recommended vendor
 * @param selectedVendor      The human-selected vendor
 * @param aiTopEntry          The AI ranking entry for the top vendor
 * @param selectedEntry       The AI ranking entry for the selected vendor
 */
export function assessOverrideRisk(
  aiTopVendor: VendorProposal,
  selectedVendor: VendorProposal,
  aiTopEntry: VendorRankEntry | undefined,
  selectedEntry: VendorRankEntry | undefined
): OverrideRiskAssessment {
  const reasons: string[] = [];
  let riskScore = 0;

  const aiScore = aiTopEntry?.totalScore ?? 0;
  const selectedScore = selectedEntry?.totalScore ?? 0;
  const scoreGap = Math.round((aiScore - selectedScore) * 10) / 10;

  // Score gap analysis
  if (scoreGap >= 20) {
    reasons.push(
      `Selected vendor scored ${scoreGap} points below AI recommendation (${selectedScore} vs ${aiScore}) — a significant gap.`
    );
    riskScore += 3;
  } else if (scoreGap >= 10) {
    reasons.push(
      `Selected vendor scored ${scoreGap} points below AI recommendation (${selectedScore} vs ${aiScore}).`
    );
    riskScore += 2;
  } else if (scoreGap >= 5) {
    reasons.push(
      `Selected vendor scored ${scoreGap} points below AI recommendation (${selectedScore} vs ${aiScore}) — a minor gap.`
    );
    riskScore += 1;
  }

  // Compliance comparison
  const aiCompliance = aiTopVendor.complianceStatus;
  const selectedCompliance = selectedVendor.complianceStatus;

  let complianceGapSummary = "";

  if (selectedCompliance === "NONE" && aiCompliance === "FULL") {
    reasons.push(
      `AI-recommended vendor is fully compliant while the selected vendor has NO compliance certifications — high regulatory risk.`
    );
    complianceGapSummary = `${aiTopVendor.companyName} (FULL compliance) → ${selectedVendor.companyName} (NO compliance)`;
    riskScore += 3;
  } else if (selectedCompliance === "PARTIAL" && aiCompliance === "FULL") {
    reasons.push(
      `AI-recommended vendor is fully compliant; selected vendor has only partial compliance — certifications must be verified.`
    );
    complianceGapSummary = `${aiTopVendor.companyName} (FULL compliance) → ${selectedVendor.companyName} (PARTIAL compliance)`;
    riskScore += 2;
  } else if (selectedCompliance === "NONE") {
    reasons.push(`Selected vendor has NO compliance certifications — procurement may be at regulatory risk.`);
    complianceGapSummary = `${selectedVendor.companyName} has no compliance certifications on file.`;
    riskScore += 2;
  } else if (selectedCompliance === "PARTIAL") {
    reasons.push(`Selected vendor has only partial compliance — missing certifications should be identified and waived or fulfilled.`);
    complianceGapSummary = `${selectedVendor.companyName} has partial compliance only.`;
    riskScore += 1;
  } else {
    complianceGapSummary = "Both vendors have equivalent compliance status.";
  }

  // Price comparison — selected vendor is more expensive AND worse technically
  if (
    selectedVendor.price > aiTopVendor.price &&
    selectedScore < aiScore
  ) {
    const priceDiff = Math.round(((selectedVendor.price - aiTopVendor.price) / aiTopVendor.price) * 100);
    reasons.push(
      `Selected vendor is ${priceDiff}% more expensive ($${selectedVendor.price.toLocaleString()} vs $${aiTopVendor.price.toLocaleString()}) despite a lower evaluation score — value-for-money gap.`
    );
    riskScore += 2;
  }

  // Technical requirements
  if (!selectedVendor.meetsTechnicalRequirements && aiTopVendor.meetsTechnicalRequirements) {
    reasons.push(
      `Selected vendor does NOT meet stated technical requirements; AI-recommended vendor does — technical delivery risk.`
    );
    riskScore += 3;
  }

  // Sanctions declaration
  if (!selectedVendor.sanctionsDeclaration) {
    reasons.push(`Selected vendor has not submitted a sanctions/debarment declaration — mandatory due diligence gap.`);
    riskScore += 2;
  }

  // Delivery timeline
  if (selectedVendor.deliveryDays > aiTopVendor.deliveryDays + 30) {
    reasons.push(
      `Selected vendor delivery timeline is ${selectedVendor.deliveryDays - aiTopVendor.deliveryDays} days longer than AI recommendation (${selectedVendor.deliveryDays} vs ${aiTopVendor.deliveryDays} days).`
    );
    riskScore += 1;
  }

  // Experience gap
  if (selectedVendor.experienceScore + 2 < aiTopVendor.experienceScore) {
    reasons.push(
      `Selected vendor experience score is ${aiTopVendor.experienceScore - selectedVendor.experienceScore} points lower than AI recommendation (${selectedVendor.experienceScore}/10 vs ${aiTopVendor.experienceScore}/10).`
    );
    riskScore += 1;
  }

  // Compute final risk level
  let riskLevel: OverrideRiskLevel;
  if (riskScore >= 6) {
    riskLevel = "HIGH";
  } else if (riskScore >= 3) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  // If no specific reasons, add a generic low-risk note
  if (reasons.length === 0) {
    reasons.push(
      `Score difference is within acceptable range (${scoreGap} points). No major compliance or technical concerns identified.`
    );
  }

  return { riskLevel, reasons, scoreGap, complianceGapSummary };
}
