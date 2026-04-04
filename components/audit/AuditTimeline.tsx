"use client";

import { formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  Zap,
  UserCheck,
  Lock,
  Award,
  Clock,
  XCircle,
  ExternalLink,
  Hash,
  AlertTriangle,
  ShieldCheck,
  Users,
  BarChart3,
} from "lucide-react";
import type { HcsEventType, HcsEventStatus } from "@/types/hedera";

interface AuditEvent {
  id?: string;
  eventType: HcsEventType;
  localPayload: Record<string, unknown>;
  topicId?: string | null;
  transactionId?: string | null;
  sequenceNumber?: number | null;
  consensusTimestamp?: string | null;
  status: HcsEventStatus;
  createdAt: string | Date;
}

interface AuditTimelineProps {
  events: AuditEvent[];
  topicId?: string | null;
}

const EVENT_CONFIG: Record<
  HcsEventType,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    headerBg: string;
  }
> = {
  TENDER_CREATED: {
    label: "Tender Created",
    Icon: CheckCircle2,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    headerBg: "bg-blue-50",
  },
  AI_RANKING_GENERATED: {
    label: "AI Evaluation Completed",
    Icon: Zap,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
    headerBg: "bg-purple-50",
  },
  HUMAN_DECISION_RECORDED: {
    label: "Human Decision Recorded",
    Icon: UserCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
    headerBg: "bg-amber-50",
  },
  DECISION_FINALIZED: {
    label: "Decision Finalized",
    Icon: Lock,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-200",
    headerBg: "bg-emerald-50",
  },
  BADGE_ISSUED: {
    label: "Reviewer Badge Issued",
    Icon: Award,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    borderColor: "border-teal-200",
    headerBg: "bg-teal-50",
  },
};

const STATUS_CONFIG: Record<
  HcsEventStatus,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: {
    label: "Pending",
    className: "text-slate-500 bg-slate-50 border-slate-200",
    Icon: Clock,
  },
  SUBMITTED: {
    label: "On Hedera",
    className: "text-teal-700 bg-teal-50 border-teal-200",
    Icon: ShieldCheck,
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    Icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    className: "text-red-700 bg-red-50 border-red-200",
    Icon: XCircle,
  },
};

function OverrideBanner({ reason }: { reason?: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-amber-800">
          Human selection differs from AI recommendation
        </p>
        {reason && (
          <p className="text-xs text-amber-700 mt-0.5 italic">"{reason}"</p>
        )}
      </div>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
      <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
      <span className="text-xs text-slate-500 font-medium">{label}:</span>
      <span className="font-mono text-xs text-slate-400 truncate">{value}</span>
    </div>
  );
}

function EventDetails({
  type,
  payload,
}: {
  type: HcsEventType;
  payload: Record<string, unknown>;
}) {
  switch (type) {
    case "TENDER_CREATED":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <span className="text-slate-400 text-xs">Title</span>
              <p className="font-medium text-slate-800 text-sm leading-tight">
                {String(payload.title ?? "")}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Department / Agency</span>
              <p className="font-medium text-slate-700 text-sm leading-tight">
                {String(payload.department ?? "")}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Category</span>
              <p className="text-slate-600 text-sm">{String(payload.category ?? "")}</p>
            </div>
            {Boolean(payload.procurementMethod) && (
              <div>
                <span className="text-slate-400 text-xs">Method</span>
                <p className="text-slate-600 text-sm">{String(payload.procurementMethod)}</p>
              </div>
            )}
            {Boolean(payload.estimatedBudget) && (
              <div>
                <span className="text-slate-400 text-xs">Est. Budget</span>
                <p className="text-slate-600 text-sm">
                  {String(payload.currency ?? "USD")}{" "}
                  {Number(payload.estimatedBudget).toLocaleString()}
                </p>
              </div>
            )}
            {Boolean(payload.referenceNumber) && (
              <div>
                <span className="text-slate-400 text-xs">Reference No.</span>
                <p className="font-mono text-slate-600 text-sm">{String(payload.referenceNumber)}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span>Recorded by: <strong>{String(payload.recordedBy ?? "")}</strong></span>
          </div>
        </div>
      );

    case "AI_RANKING_GENERATED":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              <Zap className="w-3 h-3" />
              AI Top Pick
            </span>
            <span className="font-semibold text-slate-800 text-sm">
              {String(payload.topVendorName ?? "")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
              <p className="text-xs text-slate-400">Vendors</p>
              <p className="font-bold text-slate-700 text-sm">
                {String(payload.vendorCount ?? (payload.vendorIds as unknown[])?.length ?? "—")}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
              <p className="text-xs text-slate-400">Model</p>
              <p className="font-bold text-slate-700 text-xs">
                {String(payload.scoringModelVersion ?? "v1.0")}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
              <p className="text-xs text-slate-400">Source</p>
              <p className="font-bold text-slate-700 text-xs">AI + Weighted</p>
            </div>
          </div>
          <HashRow label="Eval Hash" value={String(payload.evaluationHash ?? "")} />
        </div>
      );

    case "HUMAN_DECISION_RECORDED": {
      const isOverride = Boolean(payload.overrideUsed);
      return (
        <div className="space-y-2">
          {isOverride ? (
            <OverrideBanner reason={payload.overrideReason as string | undefined} />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-800">
                Human decision follows AI recommendation
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm mt-1">
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-400 mb-0.5">AI Recommended</p>
              <p className="font-semibold text-purple-700 text-sm leading-tight">
                {String(payload.aiTopVendorName ?? payload.aiTopVendorId ?? "—")}
              </p>
            </div>
            <div className={`rounded-lg border px-3 py-2 ${isOverride ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
              <p className="text-xs text-slate-400 mb-0.5">Selected by Human</p>
              <p className={`font-semibold text-sm leading-tight ${isOverride ? "text-amber-800" : "text-emerald-800"}`}>
                {String(payload.selectedVendorName ?? payload.selectedVendorId ?? "—")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserCheck className="w-3 h-3" />
            <span>Recorded by: <strong>{String(payload.recordedBy ?? "")}</strong></span>
          </div>
          <HashRow label="Decision Hash" value={String(payload.decisionHash ?? "")} />
        </div>
      );
    }

    case "DECISION_FINALIZED": {
      const isOverride = Boolean(payload.overrideUsed);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Lock className="w-3 h-3" />
              Contract Awarded
            </span>
            <span className="font-semibold text-emerald-800 text-sm">
              {String(payload.selectedVendorName ?? "")}
            </span>
          </div>
          {isOverride && Boolean(payload.aiTopVendorName) && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                AI had recommended{" "}
                <strong>{String(payload.aiTopVendorName)}</strong> — human override applied.
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-3 h-3 text-teal-500" />
            <span>Finalized by: <strong>{String(payload.recordedBy ?? "")}</strong></span>
          </div>
          <HashRow label="Decision Hash" value={String(payload.decisionHash ?? "")} />
        </div>
      );
    }

    case "BADGE_ISSUED":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              <Award className="w-3 h-3" />
              NFT Minted
            </span>
            <span className="text-sm text-teal-800 font-medium">
              {String(payload.reviewerName ?? "")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Token ID</span>
              <p className="font-mono text-slate-700">{String(payload.tokenId ?? "")}</p>
            </div>
            <div>
              <span className="text-slate-400">Serial #</span>
              <p className="font-mono text-slate-700">#{String(payload.serialNumber ?? "")}</p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function TechnicalFooter({ event }: { event: AuditEvent }) {
  if (!event.transactionId && !event.topicId && event.sequenceNumber == null) return null;
  return (
    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 space-y-1.5">
      {event.topicId && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium w-16 flex-shrink-0">Topic</span>
          <span className="font-mono">{event.topicId}</span>
        </div>
      )}
      {event.transactionId && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium w-16 flex-shrink-0">Tx ID</span>
          <span className="font-mono truncate flex-1">{event.transactionId}</span>
          <a
            href={`https://hashscan.io/testnet/transaction/${event.transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 flex-shrink-0 flex items-center gap-1"
          >
            HashScan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
      {event.sequenceNumber != null && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium w-16 flex-shrink-0">Seq #</span>
          <span className="font-mono">{event.sequenceNumber}</span>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isLast }: { event: AuditEvent; isLast: boolean }) {
  const config = EVENT_CONFIG[event.eventType];
  const statusCfg = STATUS_CONFIG[event.status];

  if (!config) return null;
  const { Icon, color, bgColor, borderColor, headerBg, label } = config;
  const { Icon: StatusIcon } = statusCfg;

  const timestamp = event.consensusTimestamp
    ? formatDateTime(new Date(parseFloat(event.consensusTimestamp) * 1000).toISOString())
    : formatDateTime(event.createdAt);

  return (
    <div className="flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full ${bgColor} ${borderColor} border-2 flex items-center justify-center flex-shrink-0 shadow-sm`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {!isLast && <div className="w-0.5 bg-slate-200 flex-1 mt-2" />}
      </div>

      {/* Card */}
      <div className={`flex-1 ${isLast ? "pb-2" : "pb-8"}`}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`px-4 py-3 border-b ${borderColor} ${headerBg}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">{label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{timestamp}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.className}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <EventDetails type={event.eventType} payload={event.localPayload} />
          </div>

          {/* Technical footer */}
          <TechnicalFooter event={event} />
        </div>
      </div>
    </div>
  );
}

function IntegritySummary({ events }: { events: AuditEvent[] }) {
  const decisionEvent = events.find((e) => e.eventType === "HUMAN_DECISION_RECORDED");
  const finalEvent = events.find((e) => e.eventType === "DECISION_FINALIZED");
  const aiEvent = events.find((e) => e.eventType === "AI_RANKING_GENERATED");
  const badgeEvent = events.find((e) => e.eventType === "BADGE_ISSUED");

  const onChainCount = events.filter(
    (e) => e.status === "SUBMITTED" || e.status === "CONFIRMED"
  ).length;

  const overrideUsed = Boolean(decisionEvent?.localPayload?.overrideUsed);
  const isFinalized = Boolean(finalEvent);

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">Procurement Integrity Summary</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200">
        <div className="px-4 py-3">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> AI Evaluated
          </p>
          <p className={`font-semibold text-sm ${aiEvent ? "text-purple-700" : "text-slate-400"}`}>
            {aiEvent ? "Yes" : "Pending"}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> AI vs. Human
          </p>
          {decisionEvent ? (
            <p className={`font-semibold text-sm ${overrideUsed ? "text-amber-700" : "text-emerald-700"}`}>
              {overrideUsed ? "Override" : "Agreed"}
            </p>
          ) : (
            <p className="font-semibold text-sm text-slate-400">Pending</p>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Finalized
          </p>
          <p className={`font-semibold text-sm ${isFinalized ? "text-emerald-700" : "text-slate-400"}`}>
            {isFinalized ? "Yes" : "No"}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> On Hedera
          </p>
          <p className={`font-semibold text-sm ${onChainCount > 0 ? "text-teal-700" : "text-slate-400"}`}>
            {onChainCount}/{events.length} events
          </p>
        </div>
      </div>
      {overrideUsed && (
        <div className="px-4 py-3 bg-amber-50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Override recorded.</strong> The human decision differs from the AI recommendation.
            Override justification is included in the signed audit trail.
          </p>
        </div>
      )}
      {badgeEvent && (
        <div className="px-4 py-3 bg-teal-50 flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <p className="text-xs text-teal-800">
            <strong>Reviewer badge minted</strong> on Hedera Token Service —{" "}
            {String(badgeEvent.localPayload?.reviewerName ?? "")}.
          </p>
        </div>
      )}
    </div>
  );
}

export function AuditTimeline({ events, topicId }: AuditTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No audit events yet</p>
        <p className="text-sm mt-1">
          Events will appear here as the tender progresses through the procurement workflow.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Hedera topic banner */}
      {topicId && (
        <div className="mb-6 flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-teal-800">Hedera Topic: </span>
            <span className="font-mono text-sm text-teal-700">{topicId}</span>
          </div>
          <a
            href={`https://hashscan.io/testnet/topic/${topicId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-800 flex-shrink-0"
          >
            View on HashScan
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Integrity summary */}
      <IntegritySummary events={events} />

      {/* Timeline */}
      <div className="relative">
        {events.map((event, idx) => (
          <EventCard key={event.id ?? idx} event={event} isLast={idx === events.length - 1} />
        ))}
      </div>
    </div>
  );
}
