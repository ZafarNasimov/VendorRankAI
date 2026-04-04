export type HcsEventType =
  | "TENDER_CREATED"
  | "AI_RANKING_GENERATED"
  | "HUMAN_DECISION_RECORDED"
  | "DECISION_FINALIZED"
  | "BADGE_ISSUED";

export type HcsEventStatus = "PENDING" | "SUBMITTED" | "CONFIRMED" | "FAILED";

export interface HcsEventPayload {
  eventType: HcsEventType;
  tenderId: string;
  recordedBy: string;
  recordedAt: string;
  [key: string]: unknown;
}

export interface TenderCreatedPayload extends HcsEventPayload {
  eventType: "TENDER_CREATED";
  title: string;
  department: string;
  category: string;
  // Phase 3 fields (optional until schema migration)
  procurementMethod?: string | null;
  estimatedBudget?: number | null;
  currency?: string | null;
  referenceNumber?: string | null;
}

export interface AiRankingGeneratedPayload extends HcsEventPayload {
  eventType: "AI_RANKING_GENERATED";
  vendorIds: string[];
  vendorCount: number;
  topVendorId: string;
  topVendorName: string;
  evaluationHash: string;
  scoringModelVersion: string;
}

export interface HumanDecisionPayload extends HcsEventPayload {
  eventType: "HUMAN_DECISION_RECORDED";
  aiTopVendorId: string;
  aiTopVendorName: string;
  selectedVendorId: string;
  selectedVendorName: string;
  overrideUsed: boolean;
  overrideReason?: string;
  decisionHash: string;
}

export interface DecisionFinalizedPayload extends HcsEventPayload {
  eventType: "DECISION_FINALIZED";
  selectedVendorId: string;
  selectedVendorName: string;
  aiTopVendorId?: string;
  aiTopVendorName?: string;
  overrideUsed: boolean;
  decisionHash: string;
}

export interface BadgeIssuedPayload extends HcsEventPayload {
  eventType: "BADGE_ISSUED";
  reviewerName: string;
  tokenId: string;
  serialNumber: number;
  transactionId: string;
}

export interface HederaAuditEvent {
  id: string;
  tenderId: string;
  eventType: HcsEventType;
  localPayload: HcsEventPayload;
  topicId?: string | null;
  transactionId?: string | null;
  sequenceNumber?: number | null;
  consensusTimestamp?: string | null;
  status: HcsEventStatus;
  createdAt: Date | string;
}

export interface MirrorNodeMessage {
  consensus_timestamp: string;
  message: string; // base64 encoded
  payer_account_id: string;
  running_hash: string;
  running_hash_version: number;
  sequence_number: number;
  topic_id: string;
  chunk_info?: {
    initial_transaction_id: {
      account_id: string;
      nonce: number;
      scheduled: boolean;
      transaction_valid_start: string;
    };
    number: number;
    total: number;
  };
}

export interface TimelineEvent {
  sequenceNumber: number;
  consensusTimestamp: string;
  eventType: HcsEventType;
  payload: HcsEventPayload;
  topicId: string;
  transactionId?: string;
}
