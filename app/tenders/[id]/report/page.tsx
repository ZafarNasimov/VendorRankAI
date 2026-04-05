import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PrintButton } from "@/components/ui/PrintButton";
import {
  Building2, Tag, DollarSign, Calendar, Hash, ShieldCheck,
  ShieldAlert, AlertTriangle, CheckCircle2, Lock, Zap,
  Award, ExternalLink, FileText, Clock, Scale, TrendingDown,
  XCircle, Target, BarChart3,
} from "lucide-react";
import type { CriteriaWeights, VendorRankEntry, RedFlag, VendorInsight } from "@/types/tender";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      vendors: { orderBy: { createdAt: "asc" } },
      evaluation: true,
      decision: { include: { selectedVendor: true, aiRecommendedVendor: true } },
      auditEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!tender) notFound();

  const weights = tender.criteriaWeights as unknown as CriteriaWeights;
  const ranking = (tender.evaluation?.ranking ?? []) as unknown as VendorRankEntry[];
  const redFlags = (tender.evaluation?.redFlags ?? []) as unknown as RedFlag[];
  const vendorInsights = (tender.evaluation?.vendorInsights ?? {}) as unknown as Record<string, VendorInsight>;
  const rankMap = new Map(ranking.map((r) => [r.vendorId, r]));

  const isFinalized = tender.status === "FINALIZED";
  const decision = tender.decision;
  const isOverride = decision?.overrideUsed ?? false;
  const overrideRiskLevel = (decision as Record<string, unknown>)?.overrideRiskLevel as string | null ?? null;
  const overrideRiskReasons = (decision as Record<string, unknown>)?.overrideRiskReasons as string[] | null ?? null;
  const scoreGap = (decision as Record<string, unknown>)?.scoreGap as number | null ?? null;
  const complianceGapSummary = (decision as Record<string, unknown>)?.complianceGapSummary as string | null ?? null;
  const generatedAt = new Date().toISOString();

  const submittedEvents = tender.auditEvents.filter(
    (e) => e.status === "SUBMITTED" || e.status === "CONFIRMED"
  );

  const criterionLabels: Record<string, string> = {
    price: "Price", delivery: "Delivery", experience: "Experience",
    compliance: "Compliance", warranty: "Support / Warranty",
  };

  const sortedVendors = ranking.length > 0
    ? [...tender.vendors].sort((a, b) => {
        const ra = rankMap.get(a.id)?.rank ?? 99;
        const rb = rankMap.get(b.id)?.rank ?? 99;
        return ra - rb;
      })
    : tender.vendors;

  const reportTitle = `${tender.referenceNumber ?? tender.id.slice(0, 8).toUpperCase()} — ${tender.title}`;

  const overrideRiskColors = {
    HIGH:   { bg: "bg-red-50",    border: "border-red-400",   text: "text-red-800",   chip: "bg-red-600 text-white" },
    MEDIUM: { bg: "bg-orange-50", border: "border-orange-400", text: "text-orange-800", chip: "bg-orange-500 text-white" },
    LOW:    { bg: "bg-amber-50",  border: "border-amber-400",  text: "text-amber-800", chip: "bg-amber-500 text-white" },
  };
  const riskStyle = overrideRiskLevel
    ? overrideRiskColors[overrideRiskLevel as keyof typeof overrideRiskColors] ?? overrideRiskColors.LOW
    : null;

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">

      {/* ── Screen-only toolbar ── */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <a href={`/tenders/${id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            ← Back to Tender
          </a>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-medium text-slate-700">Procurement Decision Report</span>
          {isOverride && overrideRiskLevel && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              overrideRiskLevel === "HIGH" ? "bg-red-100 text-red-700"
              : overrideRiskLevel === "MEDIUM" ? "bg-orange-100 text-orange-700"
              : "bg-amber-100 text-amber-700"
            }`}>
              Override: {overrideRiskLevel} Risk
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a href={`/tenders/${id}/audit`} className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1">
            Audit Timeline
          </a>
          <PrintButton reportTitle={reportTitle} />
        </div>
      </div>

      {/* ── Report document ── */}
      <div className="max-w-5xl mx-auto p-6 print:p-0">
        <div
          id="report-document"
          className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none"
        >

          {/* ══ COVER BLOCK ══ */}
          <div className="bg-slate-900 text-white print:bg-slate-900">
            {/* Gov-style top bar */}
            <div className="bg-blue-700 px-8 py-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-widest">
                Procurement Decision Record — Tamper-Evident Audit
              </span>
            </div>

            <div className="px-8 py-8">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-300 text-sm font-semibold tracking-wide uppercase">
                      VendorRank AI · Procurement Intelligence Platform
                    </span>
                  </div>
                  <h1 className="text-3xl font-black leading-tight mb-2">{tender.title}</h1>
                  {tender.referenceNumber && (
                    <p className="text-slate-400 text-sm font-mono">Ref: {tender.referenceNumber}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {tender.department}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> {tender.category}
                    </span>
                    {tender.estimatedBudget && (
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        Budget: {tender.currency ?? "USD"} {tender.estimatedBudget.toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(tender.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 space-y-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    isFinalized ? "bg-emerald-500 text-white"
                    : tender.status === "DECIDED" ? "bg-blue-500 text-white"
                    : "bg-amber-400 text-amber-900"
                  }`}>
                    {isFinalized ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {tender.status.replace("_", " ")}
                  </span>

                  {isOverride && overrideRiskLevel && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold block ${riskStyle?.chip}`}>
                      <AlertTriangle className="w-3 h-3" />
                      OVERRIDE · {overrideRiskLevel} RISK
                    </div>
                  )}
                </div>
              </div>

              {/* Summary bar */}
              <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">AI Recommendation</p>
                  <p className="text-sm font-bold text-white">
                    {tender.vendors.find(v => v.id === ranking[0]?.vendorId)?.companyName ?? "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Final Selection</p>
                  <p className={`text-sm font-bold ${isOverride ? "text-amber-400" : "text-emerald-400"}`}>
                    {decision?.selectedVendor?.companyName ?? "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Vendors Evaluated</p>
                  <p className="text-sm font-bold text-white">{tender.vendors.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Audit Events</p>
                  <p className="text-sm font-bold text-white">
                    {tender.auditEvents.length}
                    {submittedEvents.length > 0 && (
                      <span className="text-teal-400 ml-1">({submittedEvents.length} on-chain)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ══ REPORT BODY ══ */}
          <div className="px-8 py-8 space-y-8 print:px-8 print:py-6">

            {/* ── Section 1: Tender Details ── */}
            <section className="report-section">
              <SectionTitle number="1" title="Tender Summary" icon={FileText} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoCell label="Department / Agency" value={tender.department} />
                <InfoCell label="Category" value={tender.category} />
                {tender.procurementMethod && <InfoCell label="Method" value={tender.procurementMethod} />}
                {tender.contractType && <InfoCell label="Contract Type" value={tender.contractType} />}
                {tender.estimatedBudget && (
                  <InfoCell
                    label="Estimated Budget"
                    value={`${tender.currency ?? "USD"} ${tender.estimatedBudget.toLocaleString()}`}
                  />
                )}
                {tender.submissionDeadline && (
                  <InfoCell label="Submission Deadline" value={formatDateTime(tender.submissionDeadline)} />
                )}
                {tender.contractStartDate && (
                  <InfoCell label="Contract Start" value={formatDate(tender.contractStartDate)} />
                )}
                {tender.contractEndDate && (
                  <InfoCell label="Contract End" value={formatDate(tender.contractEndDate)} />
                )}
                {tender.paymentTerms && <InfoCell label="Payment Terms" value={tender.paymentTerms} />}
                <InfoCell label="Bid Bond Required" value={tender.bidBondRequired ? "Yes" : "No"} />
                <InfoCell label="Performance Guarantee" value={tender.performanceGuaranteeRequired ? "Yes" : "No"} />
                <InfoCell label="Sensitive Procurement" value={tender.sensitiveProcurement ? "Yes" : "No"} />
              </div>
              {tender.description && (
                <NoteBox label="Scope Description" text={tender.description} />
              )}
              {tender.technicalRequirements && (
                <NoteBox label="Technical Requirements" text={tender.technicalRequirements} />
              )}
            </section>

            <Divider />

            {/* ── Section 2: Evaluation Model ── */}
            <section className="report-section">
              <SectionTitle number="2" title="Evaluation Criteria & Weights" icon={BarChart3} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {Object.entries(weights).map(([key, val]) => (
                  <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 capitalize font-medium">
                        {criterionLabels[key] ?? key}
                      </p>
                      <span className="text-sm font-black text-slate-700">
                        {Math.round((val as number) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(val as number) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Multi-criteria weighted analysis · Scores normalized 0–100 per criterion · Model v1.0
                {tender.minimumPassingScore && ` · Minimum passing score: ${tender.minimumPassingScore}/100`}
              </p>
            </section>

            <Divider />

            {/* ── Section 3: Vendor Comparison ── */}
            <section className="report-section">
              <SectionTitle number="3" title={`Vendor Comparison (${sortedVendors.length} Proposals)`} icon={Scale} />

              {/* Headline comparison */}
              <div className={`grid grid-cols-2 gap-4 mb-4`}>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> AI Top Recommendation
                  </p>
                  <p className="font-black text-slate-800 text-lg">
                    {tender.vendors.find(v => v.id === ranking[0]?.vendorId)?.companyName ?? "—"}
                  </p>
                  <p className="text-sm text-purple-700 mt-0.5">
                    Composite score: <strong>{ranking[0]?.totalScore}/100</strong>
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${
                  isOverride ? "bg-amber-50 border-amber-300" : "bg-emerald-50 border-emerald-200"
                }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1 ${
                    isOverride ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {isOverride ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {isOverride ? "Human Override Selection" : "Human Selection (Agreed)"}
                  </p>
                  <p className="font-black text-slate-800 text-lg">
                    {decision?.selectedVendor?.companyName ?? "—"}
                  </p>
                  {isOverride && scoreGap && (
                    <p className="text-sm text-amber-700 mt-0.5">Score gap: <strong>{scoreGap} points</strong></p>
                  )}
                </div>
              </div>

              {/* Full comparison table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {ranking.length > 0 && (
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rank</th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Delivery</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Compliance</th>
                      {ranking.length > 0 && (
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Score</th>
                      )}
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedVendors.map((v) => {
                      const rank = rankMap.get(v.id);
                      const isAiTop = v.id === ranking[0]?.vendorId;
                      const isSelected = v.id === decision?.selectedVendorId;
                      return (
                        <tr key={v.id} className={isSelected ? "bg-emerald-50" : isAiTop ? "bg-purple-50/40" : ""}>
                          {ranking.length > 0 && (
                            <td className="px-4 py-3">
                              <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                                rank?.rank === 1 ? "bg-purple-600 text-white"
                                : rank?.rank === 2 ? "bg-slate-600 text-white"
                                : rank?.rank === 3 ? "bg-amber-600 text-white"
                                : "bg-slate-200 text-slate-600"
                              }`}>{rank?.rank ?? "—"}</span>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{v.companyName}</p>
                            {v.country && <p className="text-xs text-slate-400">{v.country}</p>}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(v.price)}</td>
                          <td className="px-4 py-3 text-center text-slate-600 text-xs">{v.deliveryDays}d</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              v.complianceStatus === "FULL" ? "bg-emerald-100 text-emerald-700"
                              : v.complianceStatus === "PARTIAL" ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                            }`}>
                              {v.complianceStatus === "FULL" ? <><ShieldCheck className="w-3 h-3" /> Compliant</>
                              : v.complianceStatus === "PARTIAL" ? <><ShieldAlert className="w-3 h-3" /> Partial</>
                              : <><XCircle className="w-3 h-3" /> Non-Compliant</>}
                            </span>
                          </td>
                          {ranking.length > 0 && (
                            <td className="px-4 py-3 text-center font-black text-slate-700">
                              {rank?.totalScore ?? "—"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-center">
                            {isSelected && isFinalized ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <Lock className="w-3 h-3" /> Awarded
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                <CheckCircle2 className="w-3 h-3" /> Selected
                              </span>
                            ) : isAiTop ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                <Zap className="w-3 h-3" /> AI Rec.
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <Divider />

            {/* ── Section 4: AI Evaluation Summary ── */}
            {tender.evaluation && (
              <section className="report-section">
                <SectionTitle number="4" title="AI Evaluation Summary" icon={Zap} />

                {!!(tender.evaluation as Record<string, unknown>).whyTopVendorWon && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Why Top Vendor Was Selected</p>
                        <p className="text-sm text-purple-900 leading-relaxed">
                          {String((tender.evaluation as Record<string, unknown>).whyTopVendorWon)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {tender.evaluation.reasoning && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AI Reasoning</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {tender.evaluation.reasoning}
                    </p>
                  </div>
                )}

                {/* Per-vendor insights if available */}
                {Object.keys(vendorInsights).length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Per-Vendor Insights</p>
                    {sortedVendors.map((v) => {
                      const insight = vendorInsights[v.id];
                      if (!insight) return null;
                      return (
                        <div key={v.id} className="p-3 bg-white border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-slate-800 text-sm">{v.companyName}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              insight.riskLevel === "HIGH" ? "bg-red-50 text-red-700 border-red-200"
                              : insight.riskLevel === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>Risk: {insight.riskLevel}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="font-semibold text-emerald-700 mb-1">Strengths</p>
                              <ul className="space-y-0.5 text-slate-600">
                                {insight.strengths.slice(0, 3).map((s, i) => <li key={i}>• {s}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-red-600 mb-1">Weaknesses</p>
                              <ul className="space-y-0.5 text-slate-600">
                                {insight.weaknesses.slice(0, 3).map((w, i) => <li key={i}>• {w}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-600">Evaluation Integrity Hash (SHA-256)</p>
                    <p className="text-xs font-mono text-slate-400 break-all">{tender.evaluation.evaluationHash}</p>
                  </div>
                </div>
              </section>
            )}

            {tender.evaluation && <Divider />}

            {/* ── Section 5: Procurement Decision ── */}
            <section className="report-section">
              <SectionTitle number={tender.evaluation ? "5" : "4"} title="Procurement Decision" icon={Scale} />

              {decision ? (
                <div className="space-y-4">
                  {/* Decision status banner */}
                  {isOverride ? (
                    <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${riskStyle?.bg ?? "bg-amber-50"} ${riskStyle?.border ?? "border-amber-300"}`}>
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${riskStyle?.text ?? "text-amber-600"}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className={`font-bold ${riskStyle?.text ?? "text-amber-900"}`}>Human Override Applied</p>
                          {overrideRiskLevel && (
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${riskStyle?.chip}`}>
                              Override Risk: {overrideRiskLevel}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${riskStyle?.text ?? "text-amber-800"}`}>
                          The procurement officer selected{" "}
                          <strong>{decision.selectedVendor.companyName}</strong> instead of the
                          AI-recommended <strong>{decision.aiRecommendedVendor.companyName}</strong>.
                          {scoreGap && scoreGap > 0 && ` Score gap: ${scoreGap} points.`}
                        </p>
                        {complianceGapSummary && (
                          <p className={`text-xs mt-1 italic ${riskStyle?.text ?? "text-amber-700"}`}>
                            Compliance gap: {complianceGapSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-emerald-800">
                        Human decision follows the AI recommendation. No override applied.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> AI Recommendation
                      </p>
                      <p className="font-bold text-slate-800">{decision.aiRecommendedVendor.companyName}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(decision.aiRecommendedVendor.price)}</p>
                      <p className="text-xs text-purple-600 mt-1">Score: {rankMap.get(decision.aiRecommendedVendorId)?.totalScore}/100</p>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      isOverride ? `${riskStyle?.bg ?? "bg-amber-50"} ${riskStyle?.border ?? "border-amber-200"}` : "bg-emerald-50 border-emerald-200"
                    }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                        isOverride ? (riskStyle?.text ?? "text-amber-600") : "text-emerald-600"
                      }`}>
                        {isOverride ? "Human Override Selection" : "Human Selection (Agreed)"}
                      </p>
                      <p className="font-bold text-slate-800">{decision.selectedVendor.companyName}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(decision.selectedVendor.price)}</p>
                      <p className="text-xs text-slate-400 mt-1">Score: {rankMap.get(decision.selectedVendorId)?.totalScore ?? "—"}/100</p>
                    </div>
                  </div>

                  {isOverride && decision.overrideReason && (
                    <div className={`p-4 ${riskStyle?.bg ?? "bg-amber-50"} border ${riskStyle?.border ?? "border-amber-200"} rounded-xl`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${riskStyle?.text ?? "text-amber-700"}`}>Override Justification</p>
                      <p className={`text-sm ${riskStyle?.text ?? "text-amber-800"}`}>{decision.overrideReason}</p>
                    </div>
                  )}

                  {/* Override risk reasons */}
                  {isOverride && overrideRiskReasons && overrideRiskReasons.length > 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" /> Override Risk Factors
                      </p>
                      <ul className="space-y-1">
                        {overrideRiskReasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="font-bold text-slate-400 flex-shrink-0">{i + 1}.</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {decision.finalizedAt && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-medium text-slate-600">Finalized At</p>
                          <p className="text-sm font-bold text-slate-800">{formatDateTime(decision.finalizedAt)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-600">Decision Hash (SHA-256)</p>
                        <p className="text-xs font-mono text-slate-400 truncate">{decision.decisionHash}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No decision recorded yet.</p>
              )}
            </section>

            <Divider />

            {/* ── Section 6: Risk & Compliance ── */}
            <section className="report-section">
              <SectionTitle number={tender.evaluation ? "6" : "5"} title="Risk & Compliance Notes" icon={AlertTriangle} />

              {redFlags.length > 0 ? (
                <div className="space-y-2">
                  {redFlags.map((flag, i) => {
                    const vendor = tender.vendors.find((v) => v.id === flag.vendorId);
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                        flag.severity === "HIGH" ? "bg-red-50 border-red-200"
                        : flag.severity === "MEDIUM" ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                      }`}>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                          flag.severity === "HIGH" ? "bg-red-200 text-red-800"
                          : flag.severity === "MEDIUM" ? "bg-amber-200 text-amber-800"
                          : "bg-blue-200 text-blue-800"
                        }`}>
                          {flag.severity}
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-slate-600">
                            {vendor?.companyName ?? flag.vendorId}:{" "}
                          </span>
                          <span className="text-sm text-slate-700">{flag.flag}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700">No risk flags raised by the AI evaluation.</p>
                </div>
              )}

              {tender.notes && <NoteBox label="Internal Notes" text={tender.notes} className="mt-4" />}
            </section>

            <Divider />

            {/* ── Section 7: Hedera Audit Trail ── */}
            <section className="report-section">
              <SectionTitle number={tender.evaluation ? "7" : "6"} title="Hedera Audit Trail & Verification" icon={ShieldCheck} />

              {tender.hcsTopicId ? (
                <div className="mb-4 flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse print:animate-none" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-teal-700">Hedera Consensus Topic</p>
                    <p className="font-mono text-sm text-teal-800">{tender.hcsTopicId}</p>
                  </div>
                  <a
                    href={`https://hashscan.io/testnet/topic/${tender.hcsTopicId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="print:hidden flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium"
                  >
                    HashScan <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="hidden print:inline text-xs text-teal-600">
                    hashscan.io/testnet/topic/{tender.hcsTopicId}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic mb-4">Hedera topic not configured for this tender.</p>
              )}

              {tender.auditEvents.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Event</th>
                        <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Recorded By</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase print:hidden">Transaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tender.auditEvents.map((ev) => {
                        const payload = ev.localPayload as Record<string, unknown>;
                        return (
                          <tr key={ev.id}>
                            <td className="px-4 py-2.5 font-medium text-slate-700 text-xs">
                              {ev.eventType.replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                ev.status === "SUBMITTED" || ev.status === "CONFIRMED"
                                  ? "bg-teal-100 text-teal-700"
                                  : ev.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}>
                                {(ev.status === "SUBMITTED" || ev.status === "CONFIRMED") && (
                                  <ShieldCheck className="w-3 h-3" />
                                )}
                                {ev.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {String(payload.recordedBy ?? "—")}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">
                              {formatDateTime(ev.createdAt)}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-mono text-slate-400 print:hidden">
                              {ev.transactionId ? (
                                <a
                                  href={`https://hashscan.io/testnet/transaction/${ev.transactionId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                >
                                  {ev.transactionId.slice(0, 20)}… <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mb-4">No audit events recorded.</p>
              )}

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Integrity Verification Statement
                </p>
                <p className="text-xs text-teal-800 leading-relaxed">
                  This decision trail was recorded on the Hedera Consensus Service (HCS) and can be independently verified.
                  Each HCS message includes a SHA-256 integrity hash linking the on-chain record to the off-chain evaluation and decision data.
                  Consensus timestamps are assigned by the Hedera network — not the application server.
                  To verify: query topic <strong>{tender.hcsTopicId ?? "[topic ID]"}</strong> at{" "}
                  <span className="font-mono">hashscan.io/testnet</span> or via the Hedera Mirror Node REST API.
                </p>
                {submittedEvents.length > 0 && (
                  <p className="text-xs text-teal-700 font-semibold mt-2">
                    ✓ {submittedEvents.length}/{tender.auditEvents.length} events confirmed on Hedera.
                  </p>
                )}
              </div>
            </section>

            {/* ── Section 8: Signature / Reviewer ── */}
            <section className="report-section">
              <SectionTitle number={tender.evaluation ? "8" : "7"} title="Signature & Review Record" icon={Award} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">Report Generated</p>
                  <p className="text-sm font-semibold text-slate-800">{formatDateTime(generatedAt)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">Tender Status</p>
                  <p className="text-sm font-semibold text-slate-800">{tender.status}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">Hedera Network</p>
                  <p className="text-sm font-semibold text-slate-800">Testnet</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-300 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-6">Procurement Officer Signature</p>
                  <div className="border-b border-slate-400 mb-1"></div>
                  <p className="text-xs text-slate-400">Name / Role / Date</p>
                </div>
                <div className="border border-slate-300 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-6">Authorising Officer Signature</p>
                  <div className="border-b border-slate-400 mb-1"></div>
                  <p className="text-xs text-slate-400">Name / Role / Date</p>
                </div>
              </div>
            </section>

            {/* ── Document footer ── */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                    <FileText className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="font-medium text-slate-500">VendorRank AI</span>
                  <span>·</span>
                  <span>Powered by Hedera HCS</span>
                  <span>·</span>
                  <span>Procurement Intelligence Platform</span>
                </div>
                <span className="font-mono">{formatDateTime(generatedAt)}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                This document is system-generated. Hashes and audit events are tamper-evident and linked to the Hedera blockchain.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionTitle({
  number, title, icon: Icon,
}: {
  number: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200">
      <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      <h2 className="font-bold text-slate-800">{title}</h2>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function NoteBox({ label, text, className = "" }: { label: string; text: string; className?: string }) {
  return (
    <div className={`p-4 bg-slate-50 rounded-xl border border-slate-200 ${className}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

function Divider() {
  return <hr className="border-slate-200" />;
}
