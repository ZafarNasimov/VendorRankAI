import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PrintButton } from "@/components/ui/PrintButton";
import {
  Building2, Tag, DollarSign, Calendar, Hash, ShieldCheck,
  ShieldAlert, AlertTriangle, CheckCircle2, Lock, Zap,
  Award, ExternalLink, FileText, Clock,
} from "lucide-react";
import type { CriteriaWeights, VendorRankEntry, RedFlag } from "@/types/tender";

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
  const rankMap = new Map(ranking.map((r) => [r.vendorId, r]));

  const isFinalized = tender.status === "FINALIZED";
  const decision = tender.decision;
  const isOverride = decision?.overrideUsed ?? false;
  const generatedAt = new Date().toISOString();

  const submittedEvents = tender.auditEvents.filter(
    (e) => e.status === "SUBMITTED" || e.status === "CONFIRMED"
  );

  const criterionLabels: Record<string, string> = {
    price: "Price", delivery: "Delivery", experience: "Experience",
    compliance: "Compliance", warranty: "Support",
  };

  // Sort vendors by rank if evaluation exists
  const sortedVendors = ranking.length > 0
    ? [...tender.vendors].sort((a, b) => {
        const ra = rankMap.get(a.id)?.rank ?? 99;
        const rb = rankMap.get(b.id)?.rank ?? 99;
        return ra - rb;
      })
    : tender.vendors;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href={`/tenders/${id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            ← Back to Tender
          </a>
          <span className="text-slate-300">|</span>
          <span className="text-sm font-medium text-slate-700">Procurement Decision Report</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/tenders/${id}/audit`}
            className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
          >
            Audit Timeline
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Report document */}
      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none print:rounded-none">

          {/* ── Document header ── */}
          <div className="bg-slate-900 text-white px-8 py-7 print:px-8 print:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium tracking-wide uppercase">
                    VendorRank AI · Procurement Decision Report
                  </span>
                </div>
                <h1 className="text-2xl font-bold leading-tight">{tender.title}</h1>
                {tender.referenceNumber && (
                  <p className="text-slate-400 text-sm mt-1 font-mono">Ref: {tender.referenceNumber}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  isFinalized
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-400 text-amber-900"
                }`}>
                  {isFinalized ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {tender.status.replace("_", " ")}
                </span>
                <p className="text-slate-400 text-xs mt-2">
                  Generated {formatDateTime(generatedAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {tender.department}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> {tender.category}
              </span>
              {tender.procurementMethod && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> {tender.procurementMethod}
                </span>
              )}
              {tender.estimatedBudget && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  {tender.currency ?? "USD"} {tender.estimatedBudget.toLocaleString()} est. budget
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Created {formatDate(tender.createdAt)}
              </span>
            </div>
          </div>

          <div className="px-8 py-7 space-y-8 print:px-8 print:py-6">

            {/* ── Section 1: Tender Details ── */}
            <section>
              <SectionTitle number="1" title="Tender Details" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoCell label="Department / Agency" value={tender.department} />
                <InfoCell label="Procurement Category" value={tender.category} />
                {tender.procurementMethod && <InfoCell label="Procurement Method" value={tender.procurementMethod} />}
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
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Scope Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{tender.description}</p>
                </div>
              )}
              {tender.technicalRequirements && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Technical Requirements</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{tender.technicalRequirements}</p>
                </div>
              )}
              {tender.deliverables && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Deliverables</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{tender.deliverables}</p>
                </div>
              )}
            </section>

            <Divider />

            {/* ── Section 2: Evaluation Model ── */}
            <section>
              <SectionTitle number="2" title="Evaluation Model" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(weights).map(([key, val]) => (
                  <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 capitalize mb-1">
                      {criterionLabels[key] ?? key}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(val as number) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-9 text-right">
                        {Math.round((val as number) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {tender.minimumPassingScore && (
                <p className="mt-3 text-sm text-slate-600">
                  Minimum passing score: <strong>{tender.minimumPassingScore}/100</strong>
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Scoring model v1.0 · Multi-criteria weighted analysis · Scores normalized 0–100 per criterion
              </p>
            </section>

            <Divider />

            {/* ── Section 3: Vendor Comparison ── */}
            <section>
              <SectionTitle number="3" title={`Vendor Comparison (${sortedVendors.length} proposals)`} />
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
                          <td className="px-4 py-3 text-right font-medium text-slate-700">
                            {formatCurrency(v.price)}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 text-xs">
                            {v.deliveryDays}d
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              v.complianceStatus === "FULL"
                                ? "bg-emerald-100 text-emerald-700"
                                : v.complianceStatus === "PARTIAL"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {v.complianceStatus === "FULL"
                                ? <><ShieldCheck className="w-3 h-3" /> Compliant</>
                                : v.complianceStatus === "PARTIAL"
                                ? <><ShieldAlert className="w-3 h-3" /> Partial</>
                                : <><ShieldAlert className="w-3 h-3" /> Non-Compliant</>
                              }
                            </span>
                          </td>
                          {ranking.length > 0 && (
                            <td className="px-4 py-3 text-center font-bold text-slate-700">
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

            {/* ── Section 4: AI Evaluation ── */}
            {tender.evaluation && (
              <section>
                <SectionTitle number="4" title="AI Evaluation" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> AI Top Recommendation
                    </p>
                    <p className="font-bold text-slate-800 text-lg">
                      {tender.vendors.find((v) => v.id === ranking[0]?.vendorId)?.companyName ?? "—"}
                    </p>
                    <p className="text-sm text-purple-700 mt-0.5">
                      Composite score: <strong>{ranking[0]?.totalScore}/100</strong>
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Evaluation Metadata</p>
                    <p className="text-xs text-slate-600">Scoring model: <strong>v1.0</strong></p>
                    <p className="text-xs text-slate-600">Vendors evaluated: <strong>{ranking.length}</strong></p>
                    {tender.evaluation.confidenceNotes && (
                      <p className="text-xs text-slate-400 italic mt-1">{tender.evaluation.confidenceNotes}</p>
                    )}
                  </div>
                </div>

                {tender.evaluation.reasoning && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AI Reasoning</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {tender.evaluation.reasoning}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
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
            <section>
              <SectionTitle number={tender.evaluation ? "5" : "4"} title="Procurement Decision" />

              {decision ? (
                <div className="space-y-4">
                  {/* Override banner */}
                  {isOverride ? (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">Human Override Applied</p>
                        <p className="text-sm text-amber-800 mt-1">
                          The procurement officer selected{" "}
                          <strong>{decision.selectedVendor.companyName}</strong> instead of the
                          AI-recommended <strong>{decision.aiRecommendedVendor.companyName}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-emerald-800">
                        Human decision follows the AI recommendation.
                        No override was applied.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2">AI Recommendation</p>
                      <p className="font-bold text-slate-800">{decision.aiRecommendedVendor.companyName}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(decision.aiRecommendedVendor.price)}</p>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      isOverride ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
                    }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                        isOverride ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {isOverride ? "Human Override Selection" : "Human Selection (Agreed)"}
                      </p>
                      <p className="font-bold text-slate-800">{decision.selectedVendor.companyName}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(decision.selectedVendor.price)}</p>
                    </div>
                  </div>

                  {isOverride && decision.overrideReason && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Override Justification</p>
                      <p className="text-sm text-amber-800">{decision.overrideReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {decision.finalizedAt && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-medium text-slate-600">Finalized At</p>
                          <p className="text-sm font-semibold text-slate-800">{formatDateTime(decision.finalizedAt)}</p>
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
            <section>
              <SectionTitle number={tender.evaluation ? "6" : "5"} title="Risk & Compliance Notes" />

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

              {tender.notes && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Internal Notes</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{tender.notes}</p>
                </div>
              )}
            </section>

            <Divider />

            {/* ── Section 7: Hedera Audit Trail ── */}
            <section>
              <SectionTitle number={tender.evaluation ? "7" : "6"} title="Hedera Audit Trail" />

              {tender.hcsTopicId ? (
                <div className="mb-4 flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-teal-700">Hedera Topic</p>
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
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic mb-4">Hedera topic not configured.</p>
              )}

              {tender.auditEvents.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                                {ev.status === "SUBMITTED" || ev.status === "CONFIRMED"
                                  ? <ShieldCheck className="w-3 h-3" />
                                  : null
                                }
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
                <p className="text-sm text-slate-400">No audit events recorded.</p>
              )}

              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> Integrity Verification
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All events above were submitted to the Hedera Consensus Service (HCS).
                  Each transaction can be independently verified on{" "}
                  <a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline print:hidden">
                    HashScan
                  </a>
                  <span className="hidden print:inline">HashScan (hashscan.io/testnet)</span>.
                  Evaluation and decision hashes are SHA-256 digests that can be used to
                  verify the integrity of off-chain records.
                </p>
                {submittedEvents.length > 0 && (
                  <p className="text-xs text-teal-700 font-medium mt-2">
                    {submittedEvents.length}/{tender.auditEvents.length} events confirmed on Hedera.
                  </p>
                )}
              </div>
            </section>

            {/* ── Footer ── */}
            <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-xs text-slate-400">
              <span>Generated by VendorRank AI · Powered by Hedera HCS</span>
              <span>{formatDateTime(generatedAt)}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
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

function Divider() {
  return <hr className="border-slate-200" />;
}
