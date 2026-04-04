"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, AlertTriangle, Hash, ChevronDown, ChevronUp,
  ShieldCheck, ShieldAlert, CheckCircle2, Trophy,
  TrendingUp, Clock, DollarSign, Award, Info, Lock,
  ThumbsUp, ThumbsDown, RefreshCw, BarChart3, Eye,
  ArrowUpRight, Target, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { formatCurrency } from "@/lib/utils";
import type { AiEvaluation, VendorProposal, RedFlag, VendorInsight } from "@/types/tender";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationPanelProps {
  tenderId: string;
  evaluation: AiEvaluation;
  vendors: VendorProposal[];
  criteriaWeights?: Record<string, number>;
  selectedVendorId?: string | null;
  isFinalized?: boolean;
  onReEvaluate?: () => void;
  isReEvaluating?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRITERION_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  price:      { label: "Price",       Icon: DollarSign },
  delivery:   { label: "Delivery",    Icon: Clock },
  experience: { label: "Experience",  Icon: TrendingUp },
  compliance: { label: "Compliance",  Icon: ShieldCheck },
  warranty:   { label: "Support",     Icon: Award },
};

const FLAG_STYLE: Record<string, { border: string; bg: string; badge: "danger" | "warning" | "info" }> = {
  HIGH:   { border: "border-red-200",   bg: "bg-red-50",   badge: "danger" },
  MEDIUM: { border: "border-amber-200", bg: "bg-amber-50", badge: "warning" },
  LOW:    { border: "border-blue-200",  bg: "bg-blue-50",  badge: "info" },
};

const RISK_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  LOW:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  MEDIUM: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  HIGH:   { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function rankBadge(rank: number) {
  if (rank === 1) return "bg-purple-600 text-white";
  if (rank === 2) return "bg-slate-600 text-white";
  if (rank === 3) return "bg-amber-600 text-white";
  return "bg-slate-200 text-slate-600";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, accent = false, danger = false }: {
  label: string; value: string; accent?: boolean; danger?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-xl border text-center ${
      danger ? "bg-red-50 border-red-200" : accent ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-200"
    }`}>
      <span className={`text-xs font-medium ${danger ? "text-red-500" : accent ? "text-purple-500" : "text-slate-400"}`}>{label}</span>
      <span className={`text-lg font-bold mt-0.5 ${danger ? "text-red-700" : accent ? "text-purple-800" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function VendorDetailCard({
  entry, vendor, isTop, isSelected, isFinalized, flags, insight, weights,
}: {
  entry: AiEvaluation["ranking"][0];
  vendor: VendorProposal | undefined;
  isTop: boolean;
  isSelected: boolean;
  isFinalized: boolean;
  flags: RedFlag[];
  insight?: VendorInsight;
  weights?: Record<string, number>;
}) {
  if (!vendor) return null;
  const [expanded, setExpanded] = useState(isTop);
  const vendorFlags = flags.filter((f) => f.vendorId === vendor.id);
  const complianceOk = vendor.complianceStatus === "FULL";
  const riskStyle = RISK_STYLE[insight?.riskLevel ?? "LOW"];

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isSelected && isFinalized ? "border-emerald-300 shadow-emerald-100 shadow-md"
      : isTop ? "border-purple-200 shadow-purple-50 shadow-md"
      : "border-slate-200"
    }`}>
      {/* Card header row */}
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
                <Zap className="w-3 h-3" /> AI Recommended
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
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border}`}>
              Risk {insight?.riskLevel ?? "—"}
            </span>
            {!complianceOk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                <ShieldAlert className="w-3 h-3" />
                {vendor.complianceStatus === "PARTIAL" ? "Partial Compliance" : "Non-Compliant"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span>{formatCurrency(vendor.price)}</span>
            <span>·</span>
            <span>{vendor.deliveryDays} days delivery</span>
            {vendor.country && <><span>·</span><span>{vendor.country}</span></>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`text-xl font-black ${isTop ? "text-purple-700" : "text-slate-700"}`}>
              {entry.totalScore}
            </p>
            <p className="text-xs text-slate-400">/ 100</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-white">
          {/* Score bars */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">Criterion Scores</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(CRITERION_META).map(([key, meta]) => {
                const score = entry.criterionScores[key] ?? 0;
                const weight = weights?.[key];
                const { Icon } = meta;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-28 flex items-center gap-1.5 flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{meta.label}</span>
                      {weight != null && (
                        <span className="text-xs text-slate-400">({Math.round(weight * 100)}%)</span>
                      )}
                    </div>
                    <ScoreBar score={score} size="sm" showValue={false} className="flex-1" />
                    <span className={`text-xs font-semibold w-9 text-right px-1.5 py-0.5 rounded border ${scoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          {insight && (
            <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> Strengths
                </p>
                <ul className="space-y-1">
                  {insight.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ThumbsDown className="w-3 h-3" /> Weaknesses
                </p>
                <ul className="space-y-1">
                  {insight.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Summary note */}
          {insight?.summaryNote && (
            <div className="px-4 pb-3 border-t border-slate-100 pt-2">
              <p className="text-xs text-slate-500 italic">{insight.summaryNote}</p>
            </div>
          )}

          {/* Vendor-specific flags */}
          {vendorFlags.length > 0 && (
            <div className="px-4 pb-3 space-y-2 border-t border-slate-100 pt-3">
              {vendorFlags.map((f, i) => {
                const style = FLAG_STYLE[f.severity] ?? FLAG_STYLE.LOW;
                return (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${style.border} ${style.bg}`}>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <Badge variant={style.badge} className="flex-shrink-0 text-xs">{f.severity}</Badge>
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
  criteriaWeights,
  selectedVendorId,
  isFinalized = false,
  onReEvaluate,
  isReEvaluating = false,
}: EvaluationPanelProps) {
  const router = useRouter();
  const [showReasoning, setShowReasoning] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showSection, setShowSection] = useState<"all" | "top">("all");

  const vendorMap = new Map(vendors.map((v) => [v.id, v]));
  const topEntry = evaluation.ranking[0];
  const topVendor = vendorMap.get(topEntry?.vendorId ?? "");

  const insights = (evaluation.vendorInsights ?? {}) as Record<string, VendorInsight>;
  const overrideApplied = selectedVendorId && selectedVendorId !== topEntry?.vendorId;
  const highFlags = evaluation.redFlags.filter((f) => f.severity === "HIGH");
  const complianceFailures = vendors.filter((v) => v.complianceStatus !== "FULL");
  const weights = criteriaWeights ?? {};

  const visibleRanking = showSection === "top"
    ? evaluation.ranking.slice(0, 1)
    : evaluation.ranking;

  return (
    <div className="space-y-5">

      {/* ── Override mismatch banner ── */}
      {overrideApplied && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              Human selection differs from AI recommendation
            </p>
            <p className="text-sm text-amber-800 mt-0.5">
              AI recommended <strong>{topVendor?.companyName}</strong>, but the procurement officer selected{" "}
              <strong>{vendorMap.get(selectedVendorId)?.companyName ?? selectedVendorId}</strong>.
              The override justification is recorded in the audit trail.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Vendors Evaluated" value={String(evaluation.ranking.length)} />
        <StatPill label="Scoring Model" value="v1.0" />
        <StatPill
          label="High-Risk Flags"
          value={String(highFlags.length)}
          danger={highFlags.length > 0}
        />
        <StatPill
          label="Compliance Issues"
          value={String(complianceFailures.length)}
          accent={complianceFailures.length > 0}
        />
      </div>

      {/* ── AI Top Recommendation spotlight ── */}
      {topVendor && (
        <div className={`rounded-xl border-2 overflow-hidden ${overrideApplied ? "border-amber-200" : "border-purple-300"}`}>
          <div className="px-5 py-4 bg-gradient-to-r from-purple-700 to-purple-800 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                AI Top Recommendation
              </span>
              {!isFinalized && onReEvaluate && (
                <button
                  type="button"
                  onClick={onReEvaluate}
                  disabled={isReEvaluating}
                  className="ml-auto flex items-center gap-1 text-xs text-purple-300 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReEvaluating ? "animate-spin" : ""}`} />
                  {isReEvaluating ? "Re-evaluating…" : "Re-evaluate"}
                </button>
              )}
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">{topVendor.companyName}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-purple-200">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> {formatCurrency(topVendor.price)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {topVendor.deliveryDays} days
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {topVendor.complianceStatus === "FULL" ? "Fully Compliant" : topVendor.complianceStatus}
                  </span>
                  {topVendor.country && <span>{topVendor.country}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-4xl font-black">{topEntry?.totalScore}</p>
                <p className="text-xs text-purple-300">composite / 100</p>
              </div>
            </div>

            {/* Criterion scores mini-row */}
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Object.entries(CRITERION_META).map(([key, meta]) => {
                const score = topEntry?.criterionScores[key] ?? 0;
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-purple-300 mb-1">{meta.label}</p>
                    <p className={`text-sm font-bold px-1 py-0.5 rounded ${
                      score >= 80 ? "bg-emerald-500/20 text-emerald-200"
                      : score >= 60 ? "bg-amber-500/20 text-amber-200"
                      : "bg-red-500/20 text-red-200"
                    }`}>{score}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Why this vendor won */}
          {evaluation.whyTopVendorWon && (
            <div className="px-5 py-3 bg-purple-50 border-t border-purple-100">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Why This Vendor Was Selected</p>
                  <p className="text-sm text-purple-900 leading-relaxed">{evaluation.whyTopVendorWon}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Weighted Score Breakdown Table ── */}
      <Card>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50/50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Weighted Score Breakdown</h3>
            <span className="text-xs text-slate-400">— all vendors × criteria</span>
          </div>
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
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-2.5 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide w-8">#</th>
                    <th className="text-left py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                    {Object.entries(CRITERION_META).map(([key, m]) => (
                      <th key={key} className="text-center py-2.5 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {m.label}
                        {weights[key] != null && (
                          <span className="block text-slate-400 font-normal normal-case">
                            {Math.round(weights[key] * 100)}%
                          </span>
                        )}
                      </th>
                    ))}
                    <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluation.ranking.map((entry) => {
                    const vendor = vendorMap.get(entry.vendorId);
                    const isTop = entry.vendorId === topEntry?.vendorId;
                    return (
                      <tr key={entry.vendorId} className={isTop ? "bg-purple-50/40" : ""}>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${rankBadge(entry.rank)}`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <p className="font-semibold text-slate-800 whitespace-nowrap">{vendor?.companyName ?? entry.vendorId}</p>
                          {vendor?.complianceStatus && (
                            <span className={`text-xs font-medium ${
                              vendor.complianceStatus === "FULL" ? "text-emerald-600"
                              : vendor.complianceStatus === "PARTIAL" ? "text-amber-600"
                              : "text-red-600"
                            }`}>
                              {vendor.complianceStatus === "FULL" ? "✓ Compliant" : vendor.complianceStatus === "PARTIAL" ? "⚠ Partial" : "✗ Non-Compliant"}
                            </span>
                          )}
                        </td>
                        {Object.keys(CRITERION_META).map((key) => {
                          const score = entry.criterionScores[key] ?? 0;
                          return (
                            <td key={key} className="py-2.5 px-2 text-center">
                              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${scoreColor(score)}`}>
                                {score}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-sm font-black ${isTop ? "text-purple-700" : "text-slate-700"}`}>
                            {entry.totalScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-right">
              Scores normalized 0–100 per criterion · Weighted multi-criteria analysis
            </p>
          </CardBody>
        )}
      </Card>

      {/* ── Per-vendor explainability cards ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader
            icon={Eye}
            title="Vendor-by-Vendor Analysis"
            subtitle="Expand each vendor for strengths, weaknesses, and scoring detail"
          />
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setShowSection("all")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${showSection === "all" ? "bg-white shadow-sm text-slate-700" : "text-slate-500 hover:text-slate-700"}`}
            >
              All ({evaluation.ranking.length})
            </button>
            <button
              type="button"
              onClick={() => setShowSection("top")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${showSection === "top" ? "bg-white shadow-sm text-slate-700" : "text-slate-500 hover:text-slate-700"}`}
            >
              Top Only
            </button>
          </div>
        </div>

        {visibleRanking.map((entry) => (
          <VendorDetailCard
            key={entry.vendorId}
            entry={entry}
            vendor={vendorMap.get(entry.vendorId)}
            isTop={entry.vendorId === topEntry?.vendorId}
            isSelected={entry.vendorId === selectedVendorId}
            isFinalized={isFinalized}
            flags={evaluation.redFlags as RedFlag[]}
            insight={insights[entry.vendorId]}
            weights={weights}
          />
        ))}
      </div>

      {/* ── Compliance failures summary ── */}
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
                    — {v.complianceStatus === "PARTIAL" ? "Partially compliant — identify missing certifications" : "No compliance certifications — high regulatory risk"}
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
              <Badge variant="default">{evaluation.redFlags.length} total</Badge>
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

      {/* ── AI Reasoning (collapsible) ── */}
      <Card>
        <button
          type="button"
          onClick={() => setShowReasoning((s) => !s)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50/50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Full AI Evaluation Reasoning</h3>
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

      {/* ── Decision support guidance ── */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Scale className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">AI Recommendation is Decision Support</p>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              This analysis is advisory. The human procurement officer makes the final decision.
              Overrides are permitted but must include a written justification recorded in the audit trail.
              All scores, rankings, and flags are logged to Hedera for independent verification.
            </p>
          </div>
        </div>
      </div>

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
            <p className="text-xs font-medium text-teal-700">Hedera Consensus Logged</p>
            <p className="text-xs text-teal-600">
              Scoring model v1.0 · {evaluation.ranking.length} vendors · Hash recorded on-chain
            </p>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      {!selectedVendorId && !isFinalized && (
        <div className="flex justify-end">
          <Button onClick={() => router.push(`/tenders/${tenderId}/decision`)} size="lg">
            <ArrowUpRight className="w-4 h-4" />
            Proceed to Human Decision
          </Button>
        </div>
      )}
    </div>
  );
}
