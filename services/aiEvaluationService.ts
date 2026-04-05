import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { VendorProposal, CriteriaWeights, VendorRankEntry, RedFlag, VendorInsight } from "@/types/tender";
import { scoreVendors } from "./procurementScoringService";

const SYSTEM_PROMPT = `You are a neutral procurement evaluation assistant for public-sector organizations.
Your role is to provide DECISION SUPPORT — not autonomous choices.
You analyze vendor proposals against weighted criteria and return structured, explainable analysis.
Be critical, specific, and balanced. Reference actual numbers from the proposals.
Highlight risks, gaps, and differentiators — not just rankings.
Return ONLY valid JSON matching the requested schema. No markdown, no prose outside the JSON.`;

export interface TenderContext {
  title: string;
  department: string;
  category: string;
  procurementMethod?: string | null;
  estimatedBudget?: number | null;
  currency?: string | null;
  contractType?: string | null;
  paymentTerms?: string | null;
  mandatoryCertifications?: string | null;
  technicalRequirements?: string | null;
  deliverables?: string | null;
  minimumPassingScore?: number | null;
  bidBondRequired?: boolean;
  performanceGuaranteeRequired?: boolean;
  notes?: string | null;
}

interface AiEvaluationResult {
  ranking: VendorRankEntry[];
  criterionScores: Record<string, Record<string, number>>;
  reasoning: string;
  redFlags: RedFlag[];
  vendorInsights: Record<string, VendorInsight>;
  whyTopVendorWon: string;
  confidenceNotes: string;
}

function getProvider(): "anthropic" | "openai" | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (explicit === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

function getAnthropicClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function getOpenAIClient() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function evaluateVendorsWithAI(
  tenderId: string,
  vendors: VendorProposal[],
  weights: CriteriaWeights,
  tenderContext: TenderContext
): Promise<AiEvaluationResult> {
  const { ranking, scored } = scoreVendors(vendors, weights);
  const provider = getProvider();

  if (!provider) {
    return buildFallbackResult(vendors, ranking, scored, weights);
  }

  const userPrompt = buildPrompt(vendors, weights, tenderContext, ranking);

  try {
    let raw = "{}";

    if (provider === "anthropic") {
      const client = getAnthropicClient();
      const model = process.env.AI_MODEL || "claude-3-5-sonnet-20241022";
      const response = await client.messages.create({
        model,
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = response.content[0];
      raw = block.type === "text" ? block.text : "{}";
      raw = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    } else {
      const client = getOpenAIClient();
      // gpt-4 (base) doesn't support response_format json_object; use gpt-4o-mini as safe fallback
      const requestedModel = process.env.AI_MODEL || "gpt-4o-mini";
      const model = requestedModel === "gpt-4" ? "gpt-4o-mini" : requestedModel;
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });
      raw = response.choices[0]?.message?.content ?? "{}";
    }

    const parsed = JSON.parse(raw);

    // Merge AI criterion scores back into the objective ranking
    const mergedRanking = mergeRankings(ranking, parsed.ranking ?? []);

    return {
      ranking: mergedRanking,
      criterionScores: buildCriterionScoresMap(mergedRanking),
      reasoning: parsed.reasoning ?? "AI evaluation complete.",
      redFlags: parsed.redFlags ?? [],
      vendorInsights: parsed.vendorInsights ?? {},
      whyTopVendorWon: parsed.whyTopVendorWon ?? "",
      confidenceNotes: parsed.confidenceNotes ?? "",
    };
  } catch (err) {
    console.error("[AI] Evaluation error:", err instanceof Error ? err.message : err);
    return buildFallbackResult(vendors, ranking, scored, weights);
  }
}

function vendorLine(v: VendorProposal): string {
  const lines: string[] = [
    `  Company: ${v.companyName}${v.country ? ` (${v.country})` : ""}${v.yearsInBusiness ? `, ${v.yearsInBusiness} years in business` : ""}`,
    `  Price: $${v.price.toLocaleString()}${v.currency ? ` ${v.currency}` : ""}${v.discountTerms ? ` | Discount: ${v.discountTerms}` : ""}`,
    `  Delivery: ${v.deliveryDays} days${v.paymentTermsOffered ? ` | Payment: ${v.paymentTermsOffered}` : ""}${v.offerValidityDays ? ` | Validity: ${v.offerValidityDays} days` : ""}`,
    `  Experience: ${v.experienceScore}/10${v.similarProjectsCount != null ? ` | Similar projects: ${v.similarProjectsCount}` : ""}${v.proposedTeamSize != null ? ` | Team: ${v.proposedTeamSize} people` : ""}`,
  ];

  if (v.keyPersonnelSummary) lines.push(`  Key personnel: ${v.keyPersonnelSummary}`);
  if (v.referenceClients) lines.push(`  Reference clients: ${v.referenceClients}`);

  lines.push(`  Compliance: ${v.complianceStatus}${v.certificationsPresent ? " | Certifications: YES" : ""}${v.insurancePresent ? " | Insurance: YES" : ""}${v.financialStatementsAvailable ? " | Financials: available" : ""}${v.sanctionsDeclaration === false ? " | SANCTIONS DECLARATION: MISSING" : ""}`);

  lines.push(`  Technical: Score ${v.warrantyScore}/10${v.meetsTechnicalRequirements != null ? ` | Meets requirements: ${v.meetsTechnicalRequirements ? "YES" : "NO"}` : ""}${v.supportPeriodMonths != null ? ` | Support: ${v.supportPeriodMonths} months` : ""}${v.maintenanceIncluded ? " | Maintenance: included" : ""}`);

  if (v.riskNotes) lines.push(`  Risk notes: ${v.riskNotes}`);
  if (v.proposalSummary) lines.push(`  Proposal summary: ${v.proposalSummary}`);

  return lines.join("\n");
}

function buildPrompt(
  vendors: VendorProposal[],
  weights: CriteriaWeights,
  context: TenderContext,
  scoring: VendorRankEntry[]
): string {
  const weightsStr = Object.entries(weights)
    .map(([k, v]) => `${k}: ${Math.round((v as number) * 100)}%`)
    .join(", ");

  const scoringSummary = scoring
    .map((s) => `  #${s.rank} ${vendors.find(v => v.id === s.vendorId)?.companyName ?? s.vendorId}: ${s.totalScore} pts`)
    .join("\n");

  const tenderLines = [
    `Tender: "${context.title}"`,
    `Department: ${context.department} | Category: ${context.category}`,
    context.procurementMethod ? `Procurement method: ${context.procurementMethod}` : null,
    context.estimatedBudget ? `Estimated budget: $${context.estimatedBudget.toLocaleString()} ${context.currency ?? ""}`.trim() : null,
    context.contractType ? `Contract type: ${context.contractType}` : null,
    context.paymentTerms ? `Payment terms: ${context.paymentTerms}` : null,
    context.mandatoryCertifications ? `Mandatory certifications: ${context.mandatoryCertifications}` : null,
    context.technicalRequirements ? `Technical requirements: ${context.technicalRequirements}` : null,
    context.deliverables ? `Deliverables: ${context.deliverables}` : null,
    context.minimumPassingScore ? `Minimum passing score: ${context.minimumPassingScore}/100` : null,
    context.bidBondRequired ? `Bid bond: REQUIRED` : null,
    context.performanceGuaranteeRequired ? `Performance guarantee: REQUIRED` : null,
    context.notes ? `Notes: ${context.notes}` : null,
  ].filter(Boolean).join("\n");

  const vendorBlocks = vendors.map((v, i) =>
    `Vendor ${i + 1} (id: ${v.id}):\n${vendorLine(v)}`
  ).join("\n\n");

  return `${tenderLines}

Evaluation criteria weights: ${weightsStr}

Objective scoring results:
${scoringSummary}

Vendor proposals:
${vendorBlocks}

Produce a critical, specific procurement analysis. Reference actual figures (prices, scores, delivery days, certifications) in your reasoning. Don't just restate the scores — explain what they mean for this specific tender.

Return a JSON object with this EXACT schema:
{
  "ranking": [
    {
      "vendorId": "<id>",
      "rank": 1,
      "totalScore": 87.5,
      "criterionScores": {
        "price": 90,
        "delivery": 85,
        "experience": 88,
        "compliance": 100,
        "warranty": 80
      }
    }
  ],
  "reasoning": "<3-5 paragraphs: (1) overall recommendation with justification referencing specific data, (2) key differentiators between vendors, (3) risk analysis and concerns, (4) tradeoffs the procurement committee should weigh>",
  "whyTopVendorWon": "<2-3 sentences explaining the specific reasons the top vendor outperformed others — reference actual scores, prices, compliance status, and delivery timelines>",
  "vendorInsights": {
    "<vendorId>": {
      "strengths": ["<specific strength 1 with data>", "<specific strength 2>"],
      "weaknesses": ["<specific weakness 1 with data>", "<specific weakness 2>"],
      "riskLevel": "LOW|MEDIUM|HIGH",
      "summaryNote": "<1-2 sentence explanation of why this vendor ranked where it did, referencing specific numbers>"
    }
  },
  "redFlags": [
    {
      "vendorId": "<id>",
      "flag": "<specific, actionable description referencing actual data>",
      "severity": "HIGH|MEDIUM|LOW"
    }
  ],
  "confidenceNotes": "<note on data completeness, missing fields that would strengthen the analysis, or assumptions made>"
}

All vendors must appear in ranking AND vendorInsights. RedFlags should be specific — cite actual numbers or missing fields. Empty array if no flags.`;
}

/**
 * Use AI-adjusted criterion scores where available, fall back to objective scores otherwise.
 * Always preserve objective total score ordering (AI adjusts scores within each criterion, not the ranking).
 */
function mergeRankings(objective: VendorRankEntry[], aiRanking: VendorRankEntry[]): VendorRankEntry[] {
  const aiMap = new Map(aiRanking.map((r) => [r.vendorId, r]));
  return objective.map((obj) => {
    const ai = aiMap.get(obj.vendorId);
    if (ai?.criterionScores) {
      return { ...obj, criterionScores: ai.criterionScores };
    }
    return obj;
  });
}

interface ScoredVendorPartial {
  vendorId: string;
  companyName: string;
  scores: Record<string, number>;
  totalScore: number;
}

function buildFallbackResult(
  vendors: VendorProposal[],
  ranking: VendorRankEntry[],
  scored: ScoredVendorPartial[],
  weights: CriteriaWeights
): AiEvaluationResult {
  const top = scored[0];
  const bottom = scored[scored.length - 1];
  const avgPrice = vendors.reduce((s, v) => s + v.price, 0) / vendors.length;

  const reasoning = [
    `Based on a weighted multi-criteria analysis across ${vendors.length} vendor proposals, **${top?.companyName}** emerges as the top recommendation with a composite score of ${top?.totalScore} out of 100.`,
    `Evaluation weights applied: Price (${Math.round(weights.price * 100)}%), Delivery (${Math.round(weights.delivery * 100)}%), Experience (${Math.round(weights.experience * 100)}%), Compliance (${Math.round(weights.compliance * 100)}%), Support/Warranty (${Math.round(weights.warranty * 100)}%). ${top?.companyName} performed consistently across the most heavily weighted dimensions.`,
    bottom && bottom.vendorId !== top?.vendorId
      ? `${bottom.companyName} ranked last with a score of ${bottom.totalScore}. Key weaknesses should be reviewed independently before finalizing the shortlist.`
      : "",
    `Average proposal price: $${Math.round(avgPrice).toLocaleString()}. Procurement teams should verify all compliance certifications and technical requirements before award.`,
  ]
    .filter(Boolean)
    .join(" ");

  const redFlags: RedFlag[] = [];

  vendors.filter((v) => v.complianceStatus === "NONE").forEach((v) => {
    redFlags.push({
      vendorId: v.id,
      flag: `${v.companyName} reports NO compliance certifications — mandatory review required before award.`,
      severity: "HIGH",
    });
  });

  vendors.filter((v) => v.complianceStatus === "PARTIAL").forEach((v) => {
    redFlags.push({
      vendorId: v.id,
      flag: `${v.companyName} has partial compliance only. Identify which certifications are missing and whether they are mandatory for this contract.`,
      severity: "MEDIUM",
    });
  });

  vendors.filter((v) => v.meetsTechnicalRequirements === false).forEach((v) => {
    redFlags.push({
      vendorId: v.id,
      flag: `${v.companyName} explicitly does not meet technical requirements. This may be grounds for disqualification.`,
      severity: "HIGH",
    });
  });

  vendors.filter((v) => v.sanctionsDeclaration === false).forEach((v) => {
    redFlags.push({
      vendorId: v.id,
      flag: `${v.companyName} has not submitted a sanctions declaration. Required before any award.`,
      severity: "HIGH",
    });
  });

  vendors.filter((v) => v.price > avgPrice * 1.5).forEach((v) => {
    redFlags.push({
      vendorId: v.id,
      flag: `${v.companyName} price ($${v.price.toLocaleString()}) is ${Math.round((v.price / avgPrice - 1) * 100)}% above the field average ($${Math.round(avgPrice).toLocaleString()}). Verify value justification.`,
      severity: "LOW",
    });
  });

  vendors.filter((v) => v.deliveryDays > 120).forEach((v) => {
    redFlags.push({
      vendorId: v.id,
      flag: `${v.companyName} proposes ${v.deliveryDays}-day delivery, which may conflict with contract timeline requirements.`,
      severity: "MEDIUM",
    });
  });

  // Build fallback vendorInsights from objective data
  const vendorInsights: Record<string, VendorInsight> = {};
  for (const v of vendors) {
    const sc = scored.find((s) => s.vendorId === v.id);
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (v.complianceStatus === "FULL") strengths.push("Full regulatory compliance — no compliance risk");
    if (v.experienceScore >= 8) strengths.push(`High experience score (${v.experienceScore}/10)`);
    if (v.deliveryDays <= 60) strengths.push(`Fast delivery timeline (${v.deliveryDays} days)`);
    if (v.price < avgPrice) strengths.push(`Competitive price (${Math.round((1 - v.price / avgPrice) * 100)}% below field average)`);
    if (v.warrantyScore >= 8) strengths.push(`Strong support offering (${v.warrantyScore}/10 warranty score)`);

    if (v.complianceStatus === "PARTIAL") weaknesses.push("Only partial compliance — certifications must be verified");
    if (v.complianceStatus === "NONE") weaknesses.push("No compliance certifications — HIGH RISK for regulated procurement");
    if (v.experienceScore < 6) weaknesses.push(`Below-average experience score (${v.experienceScore}/10)`);
    if (v.deliveryDays > 90) weaknesses.push(`Long delivery timeline (${v.deliveryDays} days)`);
    if (v.price > avgPrice * 1.3) weaknesses.push(`Price ${Math.round((v.price / avgPrice - 1) * 100)}% above average`);
    if (!v.meetsTechnicalRequirements) weaknesses.push("Does not meet stated technical requirements");
    if (!v.sanctionsDeclaration) weaknesses.push("Missing sanctions declaration — required before award");

    const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
      v.complianceStatus === "NONE" || !v.meetsTechnicalRequirements || !v.sanctionsDeclaration
        ? "HIGH"
        : v.complianceStatus === "PARTIAL" || v.price > avgPrice * 1.4
        ? "MEDIUM"
        : "LOW";

    const rankEntry = ranking.find((r) => r.vendorId === v.id);
    vendorInsights[v.id] = {
      strengths: strengths.length > 0 ? strengths : ["No notable strengths identified from available data"],
      weaknesses: weaknesses.length > 0 ? weaknesses : ["No notable weaknesses identified from available data"],
      riskLevel,
      summaryNote: `Ranked #${rankEntry?.rank ?? "?"} with a composite score of ${sc?.totalScore ?? "?"}/100 based on objective multi-criteria analysis.`,
    };
  }

  const topVendor = vendors.find((v) => v.id === ranking[0]?.vendorId);
  const whyTopVendorWon = topVendor
    ? `${topVendor.companyName} achieved the highest composite score (${ranking[0]?.totalScore}/100) by performing consistently across the most heavily weighted criteria. ${topVendor.complianceStatus === "FULL" ? "Full compliance status eliminates regulatory risk. " : ""}Price of $${topVendor.price.toLocaleString()} ${topVendor.price < avgPrice ? "is below the field average, adding value competitiveness." : "is above average but justified by capability scores."}`
    : "Top vendor selected based on highest composite weighted score.";

  return {
    ranking,
    criterionScores: buildCriterionScoresMap(ranking),
    reasoning,
    redFlags,
    vendorInsights,
    whyTopVendorWon,
    confidenceNotes:
      "Scores computed using objective normalization. Set OPENAI_API_KEY or ANTHROPIC_API_KEY to enable AI-generated critical analysis.",
  };
}

function buildCriterionScoresMap(ranking: VendorRankEntry[]): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {};
  for (const entry of ranking) {
    map[entry.vendorId] = entry.criterionScores;
  }
  return map;
}
