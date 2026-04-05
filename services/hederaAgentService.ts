/**
 * Hedera Agent Service
 *
 * This service provides a structured, agent-action-style interface over the
 * raw Hedera SDK calls. It mirrors the intent of the Hedera Agent Kit
 * (github.com/hedera-dev/hedera-agent-kit): a composable set of Hedera
 * "tools" that an AI agent (or structured workflow) can invoke by name to
 * read and write to the Hedera network.
 *
 * Architecture note
 * ─────────────────
 * VendorRank AI uses @hashgraph/sdk directly because it runs inside a
 * Next.js server environment and needs fine-grained control over transaction
 * IDs and error handling. The Hedera Agent Kit wraps the same SDK, so
 * replacing calls below with `HederaAgentKit.executeTool(...)` calls is a
 * direct swap — the payload schema and semantics are identical.
 *
 * Each exported function corresponds to one "agent tool" in Hedera Agent Kit
 * terminology. The function names, parameter shapes, and return types are
 * intentionally compatible with the Kit's tool registry pattern so that a
 * LangChain / Vercel AI SDK agent can call them transparently.
 *
 * Tool registry (mirrors Hedera Agent Kit tool names)
 * ────────────────────────────────────────────────────
 *   hcs_create_topic          → createAuditTopic()     (in hederaConsensusService)
 *   hcs_submit_message        → submitAuditMessage()   (in hederaConsensusService)
 *   hcs_get_topic_info        → getTopicInfo()         (in hederaConsensusService)
 *   hts_create_token          → createBadgeToken()     (in badgeService)
 *   hts_mint_nft              → mintReviewerBadge()    (in badgeService)
 *   mirror_get_topic_messages → getMessages()          (in mirrorNodeService)
 */

import {
  createAuditTopic,
  submitAuditMessage,
  isHederaConfigured,
  type SubmitResult,
} from "./hederaConsensusService";
import type { HcsEventPayload } from "@/types/hedera";

// ─── Agent action: Tender Created ────────────────────────────────────────────

export interface TenderCreatedInput {
  tenderId: string;
  title: string;
  referenceNumber: string;
  department: string;
  category: string;
  budget: number;
  currency: string;
  criteriaWeights: Record<string, number>;
}

/**
 * Agent tool: record_tender_created
 *
 * Submits an HCS message declaring the immutable creation of a procurement
 * tender, including its criteria weights. Because the weights are written
 * before any vendor submits, they cannot be retroactively altered to favour
 * a preferred vendor.
 */
export async function recordTenderCreated(
  topicId: string,
  input: TenderCreatedInput
): Promise<SubmitResult> {
  assertHederaConfigured();

  const payload: HcsEventPayload = {
    eventType: "TENDER_CREATED",
    tenderId: input.tenderId,
    recordedBy: "Procurement Officer",
    recordedAt: new Date().toISOString(),
    data: {
      title: input.title,
      referenceNumber: input.referenceNumber,
      department: input.department,
      category: input.category,
      budget: input.budget,
      currency: input.currency,
      criteriaWeights: input.criteriaWeights,
    },
  };

  return submitAuditMessage(topicId, payload);
}

// ─── Agent action: AI Ranking Generated ──────────────────────────────────────

export interface AiRankingGeneratedInput {
  tenderId: string;
  topVendorId: string;
  topVendorName: string;
  vendorCount: number;
  evaluationHash: string;
  rankedVendors: Array<{ vendorId: string; vendorName: string; score: number; rank: number }>;
}

/**
 * Agent tool: record_ai_ranking
 *
 * Submits an HCS message recording the AI-generated vendor ranking. The
 * SHA-256 evaluation hash creates an off-chain/on-chain link: anyone can
 * re-hash the stored evaluation JSON and compare it with this on-chain value
 * to verify that no fields were modified after the fact.
 */
export async function recordAiRanking(
  topicId: string,
  input: AiRankingGeneratedInput
): Promise<SubmitResult> {
  assertHederaConfigured();

  const payload: HcsEventPayload = {
    eventType: "AI_RANKING_GENERATED",
    tenderId: input.tenderId,
    recordedBy: "ai-system",
    recordedAt: new Date().toISOString(),
    data: {
      topVendorId: input.topVendorId,
      topVendorName: input.topVendorName,
      vendorCount: input.vendorCount,
      evaluationHash: input.evaluationHash,
      rankedVendors: input.rankedVendors,
    },
  };

  return submitAuditMessage(topicId, payload);
}

// ─── Agent action: Human Decision Recorded ───────────────────────────────────

export interface HumanDecisionInput {
  tenderId: string;
  selectedVendorId: string;
  selectedVendorName: string;
  overrideUsed: boolean;
  overrideReason?: string;
  overrideRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  scoreGap?: number | null;
  reviewerName?: string;
  decisionHash: string;
}

/**
 * Agent tool: record_human_decision
 *
 * Submits an HCS message recording the final human vendor selection. When
 * overrideUsed is true, the override reason and risk level are written
 * on-chain — permanent, non-deletable accountability.
 */
export async function recordHumanDecision(
  topicId: string,
  input: HumanDecisionInput
): Promise<SubmitResult> {
  assertHederaConfigured();

  const payload: HcsEventPayload = {
    eventType: "HUMAN_DECISION_RECORDED",
    tenderId: input.tenderId,
    recordedBy: input.reviewerName ?? "Procurement Officer",
    recordedAt: new Date().toISOString(),
    data: {
      selectedVendorId: input.selectedVendorId,
      selectedVendorName: input.selectedVendorName,
      overrideUsed: input.overrideUsed,
      overrideReason: input.overrideReason ?? null,
      overrideRiskLevel: input.overrideRiskLevel ?? null,
      scoreGap: input.scoreGap ?? null,
      reviewerName: input.reviewerName ?? null,
      decisionHash: input.decisionHash,
    },
  };

  return submitAuditMessage(topicId, payload);
}

// ─── Agent action: Decision Finalized ────────────────────────────────────────

export interface DecisionFinalizedInput {
  tenderId: string;
  reviewerName: string;
  reviewerRole?: string;
  finalDecisionHash: string;
}

/**
 * Agent tool: record_decision_finalized
 *
 * Submits an HCS message locking the procurement decision. After this event,
 * no further mutations should be accepted by the application. The chain of
 * events (CREATED → RANKED → DECIDED → FINALIZED) forms a complete, ordered
 * audit trail.
 */
export async function recordDecisionFinalized(
  topicId: string,
  input: DecisionFinalizedInput
): Promise<SubmitResult> {
  assertHederaConfigured();

  const payload: HcsEventPayload = {
    eventType: "DECISION_FINALIZED",
    tenderId: input.tenderId,
    recordedBy: input.reviewerName ?? "Procurement Officer",
    recordedAt: new Date().toISOString(),
    data: {
      reviewerName: input.reviewerName,
      reviewerRole: input.reviewerRole ?? null,
      finalDecisionHash: input.finalDecisionHash,
    },
  };

  return submitAuditMessage(topicId, payload);
}

// ─── Agent action: Ensure topic exists ───────────────────────────────────────

/**
 * Agent tool: ensure_audit_topic
 *
 * Idempotent helper: returns the existing topic ID from env, or creates a
 * new topic if none is configured. Mirrors the Hedera Agent Kit pattern of
 * "provision infrastructure on first use" rather than requiring pre-setup.
 */
export async function ensureAuditTopic(memo: string): Promise<string> {
  assertHederaConfigured();

  const existing = process.env.HEDERA_TOPIC_ID;
  if (existing) return existing;

  return createAuditTopic(memo);
}

// ─── Capability probe (safe to call without credentials) ─────────────────────

export interface HederaCapabilities {
  hcsAvailable: boolean;
  topicConfigured: boolean;
  network: string;
}

/**
 * Returns the current Hedera capability state without throwing.
 * Used by the UI to decide whether to show Hedera-linked features or
 * gracefully degrade to local-only mode.
 */
export function getHederaCapabilities(): HederaCapabilities {
  return {
    hcsAvailable: isHederaConfigured(),
    topicConfigured: !!process.env.HEDERA_TOPIC_ID,
    network: process.env.HEDERA_NETWORK ?? "testnet",
  };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function assertHederaConfigured(): void {
  if (!isHederaConfigured()) {
    throw new Error(
      "Hedera is not configured. Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env.local"
    );
  }
}
