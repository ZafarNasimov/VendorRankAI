"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, AlertTriangle, Hash, ChevronDown, ChevronUp,
  ShieldCheck, ShieldAlert, CheckCircle2, Trophy,
  TrendingUp, Clock, DollarSign, Award, Info, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { formatCurrency } from "@/lib/utils";
import type { AiEvaluation, VendorProposal, RedFlag } from "@/types/tender";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationPanelProps {
  tenderId: string;
  evaluation: AiEvaluation;
  vendors: VendorProposal[];
  selectedVendorId?: string | null;  // human's choice, if already recorded
  isFinalized?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRITERION_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  price:      { label: "Price",        Icon: DollarSign },
  delivery:   { label: "Delivery",     Icon: Clock },
  experience: { label: "Experience",   Icon: TrendingUp },
  compliance: { label: "Compliance",   Icon: ShieldCheck },
  warranty:   { label: "Support",      Icon: Award },
};

const FLAG_STYLE: Record<string, { border: string; bg: string; badge: "danger" | "warning" | "info" }> = {
  HIGH:   { border: "border-red-200",    bg: "bg-red-50",    badge: "danger" },
  MEDIUM: { border: "border-amber-200",  bg: "bg-amber-50",  badge: "warning" },
  LOW:    { border: "border-blue-200",   bg: "bg-blue-50",   badge: "info" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-50";
  if (score >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function rankBadge(rank: number) {
  if (rank === 1) return "bg-purple-600 text-white";
  if (rank === 2) return "bg-slate-600 text-white";
  if (rank === 3) return "bg-amber-600 text-white";
  return "bg-slate-200 text-slate-600";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-lg border text-center ${accent ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-200"}`}>
      <span className={`text-xs ${accent ? "text-purple-500" : "text-slate-400"}`}>{label}</span>
      <span className={`text-sm font-bold mt-0.5 ${accent ? "text-purple-800" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function VendorCard({
  entry, vendor, isTop, isSelected, isFinalized, flags,
}: {
  entry: AiEvaluation["ranking"][0];
  vendor: VendorProposal | undefined;
  isTop: boolean;
  isSelected: boolean;
  isFinalized: boolean;
  flags: RedFlag[];
}) {
  if (!vendor) return null;
  const [expanded, setExpanded] = useState(isTop);
  const vendorFlags = flags.filter((f) => f.vendorId === vendor.id);
  const complianceOk = vendor.complianceStatus === "FULL";

  return (
    <div className={`rounded-xl border overflow-hidden transition-shadow ${
      isSelected && isFinalized ? "border-emerald-300 shadow-emerald-100 shadow-md"
      : isTop ? "border-purple-200 shadow-purple-50 shadow-md"
      : "border-slate-200"
    }`}>
      {/* Card header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${
        isSelected && isFinalized ? "bg-emerald-50"
        : isTop ? "bg-purple-50"
        : "bg-white"
      }`}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBadge(entry.rank)}`}>
          {entry.rank}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 truncate">{vendor.companyName}</span>
            {isTop && !isSelected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                <Zap className="w-3 h-3" /> AI Pick
              </span>
            )}
            {isSelected && isFinalized && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Lock className="w-3 h-3" /> Awarded
              </span>
            )}
            {isSelected && !isFinalized && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3 h-3" /> Selected
              </span>
            )}
            {!complianceOk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                <ShieldAlert className="w-3 h-3" />
                {vendor.complianceStatus === "PARTIAL" ? "Partial Compliance" : "Non-Compliant"}
              </span>
            )}
            {vendorFlags.some((f) => f.severity === "HIGH") && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" /> High Risk
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span>{formatCurrency(vendor.price)}</span>
            <span>·</span>
            <span>{vendor.deliveryDays} days</span>
            {vendor.country && <><span>·</span><span>{vendor.country}</span></>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`text-xl font-bold ${isTop ? "text-purple-700" : "text-slate-700"}`}>
              {entry.totalScore}
            </p>
            <p className="text-xs text-slate-400">/ 100</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Score bars */}
      {expanded && (
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <div className="grid grid-cols-1 gap-2.5">
            {Object.entries(CRITERION_META).map(([key, meta]) => {
              const score = entry.criterionScores[key] ?? 0;
              const { Icon } = meta;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-28 flex items-center gap-1.5 flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">{meta.label}</span>
                  </div>
                  <ScoreBar score={score} size="sm" showValue={false} className="flex-1" />
                  <span className={`text-xs font-semibold w-8 text-right px-1 py-0.5 rounded ${scoreColor(score)}`}>
                    {score}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Vendor flags */}
          {vendorFlags.length > 0 && (
            <div className="mt-3 space-y-2">
              {vendorFlags.map((f, i) => {
                const style = FLAG_STYLE[f.severity] ?? FLAG_STYLE.LOW;
                return (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${style.border} ${style.bg}`}>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700">{f.flag}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EvaluationPanel({
  tenderId,
  evaluation,
  vendors,
  selectedVendorId,
  isFinalized = false,
}: EvaluationPanelProps) {
  const router = useRouter();
  const [showReasoning, setShowReasoning] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const vendorMap = new Map(vendors.map((v) => [v.id, v]));
  const topEntry = evaluation.ranking[0];
  const topVendor = vendorMap.get(topEntry?.vendorId ?? "");

  const overrideApplied =
    selectedVendorId && selectedVendorId !== topEntry?.vendorId;

  const highFlags = evaluation.redFlags.filter((f) => f.severity === "HIGH");
  const complianceFailures = vendors.filter(
    (v) => v.complianceStatus !== "FULL"
  );

  return (
    <div className="space-y-5">

      {/* ── Mismatch banner ── */}
      {overrideApplied && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              Final human selection differs from AI recommendation
            </p>
            <p className="text-sm text-amber-800 mt-0.5">
              AI recommended{" "}
              <strong>{topVendor?.companyName}</strong>, but the procurement
              officer selected{" "}
              <strong>
                {vendorMap.get(selectedVendorId)?.companyName ?? selectedVendorId}
              </strong>
              . The override justification is recorded in the audit trail.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Vendors Evaluated" value={String(evaluation.ranking.length)} />
        <StatPill label="Scoring Model" value="v1.0" />
        <StatPill label="High-Risk Flags" value={String(highFlags.length)} accent={highFlags.length > 0} />
        <StatPill label="Compliance Issues" value={String(complianceFailures.length)} accent={complianceFailures.length > 0} />
      </div>

      {/* ── AI Recommendation card ── */}
      {topVendor && (
        <div className={`rounded-xl border-2 overflow-hidden ${overrideApplied ? "border-amber-200" : "border-purple-300"}`}>
          <div className="px-5 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-purple-200" />
              <span className="text-xs font-semibold text-purple-200 uppercase tracking-wide">
                AI Top Recommendation
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{topVendor.companyName}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-purple-200">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatCurrency(topVendor.price)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {topVendor.deliveryDays} days
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {topVendor.complianceStatus === "FULL" ? "Fully Compliant" : topVendor.complianceStatus}
                  </span>
                  {topVendor.country && (
                    <span>{topVendor.country}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-black">{topEntry?.totalScore}</p>
                <p className="text-xs text-purple-300">composite / 100</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 bg-purple-50 grid grid-cols-5 gap-2">
            {Object.entries(CRITERION_META).map(([key, meta]) => {
              const score = topEntry?.criterionScores[key] ?? 0;
              return (
                <div key={key} className="text-center">
                  <p className="text-xs text-slate-400 mb-1">{meta.label}</p>
                  <p className={`text-sm font-bold px-1 py-0.5 rounded ${scoreColor(score)}`}>
                    {score}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Ranked vendor cards ── */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide text-slate-500">
          All Vendors — Ranked
        </h3>
        {evaluation.ranking.map((entry) => (
          <VendorCard
            key={entry.vendorId}
            entry={entry}
            vendor={vendorMap.get(entry.vendorId)}
            isTop={entry.vendorId === topEntry?.vendorId}
            isSelected={entry.vendorId === selectedVendorId}
            isFinalized={isFinalized}
            flags={evaluation.redFlags as RedFlag[]}
          />
        ))}
      </div>

      {/* ── Comparison table (collapsible) ── */}
      <Card>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <h3 className="font-semibold text-slate-800 text-sm">
            Full Score Comparison Table
          </h3>
          {showTable
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </button>
        {showTable && (
          <CardBody className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">#</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                    {Object.values(CRITERION_META).map((m) => (
                      <th key={m.label} className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {m.label}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluation.ranking.map((entry) => {
                    const vendor = vendorMap.get(entry.vendorId);
                    return (
                      <tr key={entry.vendorId} className={entry.rank === 1 ? "bg-purple-50/40" : ""}>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${rankBadge(entry.rank)}`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-slate-800 whitespace-nowrap">
                          {vendor?.companyName ?? entry.vendorId}
                        </td>
                        {Object.keys(CRITERION_META).map((key) => {
                          const score = entry.criterionScores[key] ?? 0;
                          return (
                            <td key={key} className="py-2.5 px-2 text-center">
                              <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded ${scoreColor(score)}`}>
                                {score}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-sm font-bold ${entry.rank === 1 ? "text-purple-700" : "text-slate-700"}`}>
                            {entry.totalScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        )}
      </Card>

      {/* ── Compliance failures ── */}
      {complianceFailures.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-slate-800">Compliance Failures</h3>
              <Badge variant="warning">{complianceFailures.length}</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {complianceFailures.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-800">{v.companyName}</span>
                  <span className="text-sm text-slate-600 ml-2">
                    — {v.complianceStatus === "PARTIAL" ? "Partially compliant only" : "No compliance certifications"}
                  </span>
                </div>
                <Badge variant={v.complianceStatus === "PARTIAL" ? "warning" : "danger"}>
                  {v.complianceStatus}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* ── Red flags ── */}
      {evaluation.redFlags.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-slate-800">Risk Flags</h3>
              {highFlags.length > 0 && (
                <Badge variant="danger">{highFlags.length} HIGH</Badge>
              )}
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            {(evaluation.redFlags as RedFlag[]).map((flag, idx) => {
              const vendor = vendorMap.get(flag.vendorId);
              const style = FLAG_STYLE[flag.severity] ?? FLAG_STYLE.LOW;
              return (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${style.border} ${style.bg}`}>
                  <Badge variant={style.badge}>{flag.severity}</Badge>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-600">
                      {vendor?.companyName ?? flag.vendorId}:{" "}
                    </span>
                    <span className="text-sm text-slate-700">{flag.flag}</span>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* ── AI Reasoning ── */}
      <Card>
        <button
          type="button"
          onClick={() => setShowReasoning((s) => !s)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-slate-800">AI Evaluation Reasoning</h3>
          </div>
          {showReasoning
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </button>
        {showReasoning && (
          <CardBody className="pt-0">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {evaluation.reasoning}
            </p>
            {evaluation.confidenceNotes && (
              <div className="mt-3 flex items-start gap-2 pt-3 border-t border-slate-100">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 italic">{evaluation.confidenceNotes}</p>
              </div>
            )}
          </CardBody>
        )}
      </Card>

      {/* ── Integrity footer ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Evaluation Hash (SHA-256)</p>
            <p className="text-xs font-mono text-slate-400 truncate">{evaluation.evaluationHash}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl border border-teal-200">
          <ShieldCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-teal-700">Scoring model v1.0</p>
            <p className="text-xs text-teal-600">
              Weighted multi-criteria · {evaluation.ranking.length} vendors · Hash logged to Hedera
            </p>
          </div>
        </div>
      </div>

      {!selectedVendorId && (
        <div className="flex justify-end">
          <Button onClick={() => router.push(`/tenders/${tenderId}/decision`)} size="lg">
            Proceed to Human Decision →
          </Button>
        </div>
      )}
    </div>
  );
}
