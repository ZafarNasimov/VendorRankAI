"use client";

import {
  AlertTriangle, ShieldAlert, TrendingDown, DollarSign,
  Clock, CheckCircle2, XCircle, Minus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { VendorProposal, VendorRankEntry } from "@/types/tender";
import type { OverrideRiskAssessment } from "@/services/overrideRiskService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverrideRiskPanelProps {
  aiTopVendor: VendorProposal;
  selectedVendor: VendorProposal;
  aiTopEntry?: VendorRankEntry;
  selectedEntry?: VendorRankEntry;
  assessment: OverrideRiskAssessment;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_STYLES = {
  LOW: {
    banner: "bg-amber-50 border-amber-300",
    chip: "bg-amber-100 text-amber-800 border-amber-300",
    icon: "text-amber-600",
    title: "text-amber-900",
    body: "text-amber-800",
    bar: "bg-amber-400",
  },
  MEDIUM: {
    banner: "bg-orange-50 border-orange-400",
    chip: "bg-orange-100 text-orange-800 border-orange-400",
    icon: "text-orange-600",
    title: "text-orange-900",
    body: "text-orange-800",
    bar: "bg-orange-500",
  },
  HIGH: {
    banner: "bg-red-50 border-red-500",
    chip: "bg-red-100 text-red-800 border-red-500",
    icon: "text-red-600",
    title: "text-red-900",
    body: "text-red-800",
    bar: "bg-red-600",
  },
};

function CompareCell({
  label, aiValue, selectedValue, aiWins,
}: {
  label: string;
  aiValue: React.ReactNode;
  selectedValue: React.ReactNode;
  aiWins?: boolean | null; // null = neutral
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
        {label}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {aiWins === true && <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />}
          {aiWins === false && <Minus className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
          <span className={`text-sm font-semibold ${aiWins === true ? "text-purple-800" : "text-slate-700"}`}>
            {aiValue}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {aiWins === false && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
          {aiWins === true && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
          {aiWins === null && <Minus className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
          <span className={`text-sm font-semibold ${aiWins === false ? "text-blue-800" : "text-slate-700"}`}>
            {selectedValue}
          </span>
        </div>
      </td>
    </tr>
  );
}

function ComplianceBadge({ status }: { status: string }) {
  if (status === "FULL") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="w-3 h-3" /> Compliant
    </span>
  );
  if (status === "PARTIAL") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <ShieldAlert className="w-3 h-3" /> Partial
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> Non-Compliant
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OverrideRiskPanel({
  aiTopVendor,
  selectedVendor,
  aiTopEntry,
  selectedEntry,
  assessment,
}: OverrideRiskPanelProps) {
  const { riskLevel, reasons, scoreGap } = assessment;
  const style = RISK_STYLES[riskLevel];
  const riskBarWidth = riskLevel === "HIGH" ? "w-full" : riskLevel === "MEDIUM" ? "w-2/3" : "w-1/3";

  return (
    <div className="space-y-4">

      {/* ── Main override banner ── */}
      <div className={`rounded-xl border-2 overflow-hidden ${style.banner}`}>
        {/* Header */}
        <div className={`px-5 py-4 flex items-start gap-4`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            riskLevel === "HIGH" ? "bg-red-100"
            : riskLevel === "MEDIUM" ? "bg-orange-100"
            : "bg-amber-100"
          }`}>
            <AlertTriangle className={`w-5 h-5 ${style.icon}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h3 className={`text-base font-bold ${style.title}`}>
                Human Override Detected
              </h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.chip}`}>
                OVERRIDDEN · Risk: {riskLevel}
              </span>
            </div>
            <p className={`text-sm ${style.body}`}>
              The AI recommended <strong>{aiTopVendor.companyName}</strong> but{" "}
              <strong>{selectedVendor.companyName}</strong> was selected.
              {scoreGap > 0 && ` Score gap: ${scoreGap} points.`}
              {" "}This decision will be recorded with full justification on Hedera.
            </p>
          </div>
        </div>

        {/* Risk meter */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className={style.body}>Override Risk Level</span>
            <span className={`font-bold ${style.body}`}>{riskLevel}</span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${style.bar} ${riskBarWidth}`} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* ── Side-by-side comparison ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div className="px-4 py-2.5">Criterion</div>
          <div className="px-4 py-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
            AI Recommendation
          </div>
          <div className="px-4 py-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            Selected Vendor
          </div>
        </div>

        <table className="w-full">
          <tbody>
            <CompareCell
              label="Vendor"
              aiValue={<span className="font-bold text-purple-700">{aiTopVendor.companyName}</span>}
              selectedValue={<span className="font-bold text-blue-700">{selectedVendor.companyName}</span>}
              aiWins={null}
            />
            <CompareCell
              label="AI Score"
              aiValue={<span>{aiTopEntry?.totalScore ?? "—"} / 100</span>}
              selectedValue={<span>{selectedEntry?.totalScore ?? "—"} / 100</span>}
              aiWins={(aiTopEntry?.totalScore ?? 0) >= (selectedEntry?.totalScore ?? 0)}
            />
            <CompareCell
              label="Bid Price"
              aiValue={formatCurrency(aiTopVendor.price)}
              selectedValue={formatCurrency(selectedVendor.price)}
              aiWins={aiTopVendor.price <= selectedVendor.price ? true : false}
            />
            <CompareCell
              label="Delivery"
              aiValue={`${aiTopVendor.deliveryDays} days`}
              selectedValue={`${selectedVendor.deliveryDays} days`}
              aiWins={aiTopVendor.deliveryDays <= selectedVendor.deliveryDays ? true : false}
            />
            <CompareCell
              label="Compliance"
              aiValue={<ComplianceBadge status={aiTopVendor.complianceStatus} />}
              selectedValue={<ComplianceBadge status={selectedVendor.complianceStatus} />}
              aiWins={
                aiTopVendor.complianceStatus === "FULL" && selectedVendor.complianceStatus !== "FULL"
                  ? true
                  : aiTopVendor.complianceStatus !== "FULL" && selectedVendor.complianceStatus === "FULL"
                  ? false
                  : null
              }
            />
            <CompareCell
              label="Experience"
              aiValue={`${aiTopVendor.experienceScore}/10`}
              selectedValue={`${selectedVendor.experienceScore}/10`}
              aiWins={aiTopVendor.experienceScore >= selectedVendor.experienceScore ? true : false}
            />
          </tbody>
        </table>
      </div>

      {/* ── Risk reasons list ── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">Override Risk Assessment</h4>
        </div>
        <div className="px-4 py-3 space-y-2">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white ${
                riskLevel === "HIGH" ? "bg-red-500"
                : riskLevel === "MEDIUM" ? "bg-orange-500"
                : "bg-amber-400"
              }`}>
                {i + 1}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
