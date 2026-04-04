"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Breadcrumbs } from "@/components/layout/Header";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { formatCurrency } from "@/lib/utils";
import { Zap, UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { VendorProposal, AiEvaluation, VendorRankEntry } from "@/types/tender";

interface TenderData {
  id: string;
  title: string;
  vendors: VendorProposal[];
  evaluation: AiEvaluation | null;
  decision: {
    id: string;
    selectedVendorId: string;
    overrideUsed: boolean;
    overrideReason?: string | null;
    finalizedAt?: string | null;
  } | null;
}

export default function DecisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tender, setTender] = useState<TenderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [reviewerName, setReviewerName] = useState("Procurement Officer");
  const [reviewerRole, setReviewerRole] = useState("Procurement Officer");

  useEffect(() => {
    fetch(`/api/tenders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTender(data);
        // Pre-select AI recommendation
        const topId = (data.evaluation?.ranking as VendorRankEntry[])?.[0]?.vendorId;
        if (topId && !data.decision) {
          setSelectedVendorId(topId);
        } else if (data.decision?.selectedVendorId) {
          setSelectedVendorId(data.decision.selectedVendorId);
          setOverrideReason(data.decision.overrideReason ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !tender) {
    return (
      <PageWrapper>
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      </PageWrapper>
    );
  }

  const evaluation = tender.evaluation;
  const rankMap = new Map(
    (evaluation?.ranking ?? []).map((r) => [r.vendorId, r])
  );
  const aiTopId = evaluation?.ranking?.[0]?.vendorId ?? "";
  const isOverride = selectedVendorId !== aiTopId && !!selectedVendorId;
  const isFinalized = !!tender.decision?.finalizedAt;

  async function handleSubmit() {
    if (!selectedVendorId) {
      toast.error("Please select a vendor");
      return;
    }

    if (isOverride && !overrideReason.trim()) {
      toast.error("An override reason is required when not following the AI recommendation");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenderId: id,
          selectedVendorId,
          overrideUsed: isOverride,
          overrideReason: isOverride ? overrideReason : undefined,
          reviewerName: reviewerName.trim() || reviewerRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to record decision");
      }

      toast.success("Decision recorded successfully");
      router.push(`/tenders/${id}/finalize`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record decision");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: "Tenders", href: "/tenders" },
          { label: tender.title, href: `/tenders/${id}` },
          { label: "Human Decision" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Human Decision Review</h1>
        <p className="text-slate-500 mt-1">
          Review the AI recommendation and make your final vendor selection. All
          decisions are logged to Hedera.
        </p>
      </div>

      {isFinalized && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            This decision has been finalized and cannot be changed.
          </p>
        </div>
      )}

      {/* AI Recommendation notice */}
      {evaluation && (
        <Card className="mb-6 border-purple-200 bg-purple-50/50">
          <CardBody className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">
                  AI Recommendation
                </p>
                <p className="font-semibold text-slate-800">
                  {tender.vendors.find((v) => v.id === aiTopId)?.companyName ?? "Unknown"}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    · Score: {rankMap.get(aiTopId)?.totalScore}/100
                  </span>
                </p>
              </div>
              <StatusChip type="ai-recommended" />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Vendor selector */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800">Select Vendor</h3>
          </div>
        </CardHeader>
        <CardBody className="divide-y divide-slate-100">
          {tender.vendors.map((vendor) => {
            const rank = rankMap.get(vendor.id);
            const isAiTop = vendor.id === aiTopId;
            const isSelected = vendor.id === selectedVendorId;

            return (
              <label
                key={vendor.id}
                className={`flex items-start gap-4 py-4 cursor-pointer transition-colors rounded-lg px-2 -mx-2 ${
                  isFinalized ? "cursor-default" : "hover:bg-slate-50"
                } ${isSelected ? "bg-blue-50/50" : ""}`}
              >
                <input
                  type="radio"
                  name="vendor"
                  value={vendor.id}
                  checked={isSelected}
                  disabled={isFinalized}
                  onChange={() => setSelectedVendorId(vendor.id)}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-slate-800">{vendor.companyName}</span>
                    {isAiTop && <StatusChip type="ai-recommended" />}
                    {isSelected && !isAiTop && <StatusChip type="overridden" />}
                    {isSelected && isAiTop && <StatusChip type="selected" />}
                    {rank && (
                      <span
                        className={`text-xs font-bold ${
                          rank.rank === 1 ? "text-purple-700" : "text-slate-500"
                        }`}
                      >
                        #{rank.rank} · {rank.totalScore} pts
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Price</p>
                      <p className="font-medium text-slate-700">
                        {formatCurrency(vendor.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Delivery</p>
                      <p className="font-medium text-slate-700">{vendor.deliveryDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Compliance</p>
                      <Badge
                        variant={
                          vendor.complianceStatus === "FULL"
                            ? "success"
                            : vendor.complianceStatus === "PARTIAL"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {vendor.complianceStatus}
                      </Badge>
                    </div>
                    {rank && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Score</p>
                        <ScoreBar
                          score={rank.totalScore}
                          size="sm"
                          className="w-full max-w-[80px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </CardBody>
      </Card>

      {/* Override reason */}
      {isOverride && !isFinalized && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-slate-800">Override Justification Required</h3>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-amber-700 mb-3">
              You are selecting a vendor that differs from the AI recommendation.
              A written justification is required for the audit record.
            </p>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={4}
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
              placeholder="Explain why you are overriding the AI recommendation (e.g., prior relationship quality, strategic considerations, additional context not captured in the scoring...)."
            />
          </CardBody>
        </Card>
      )}

      {!isFinalized && (
        <>
          {/* Reviewer identity */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Decision recorded by
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Role
                </label>
                <select
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option>Procurement Officer</option>
                  <option>Committee Reviewer</option>
                  <option>Head of Procurement</option>
                  <option>Chief Financial Officer</option>
                  <option>Department Head</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/tenders/${id}/evaluate`)}
            >
              ← Back to Evaluation
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedVendorId}
              size="lg"
            >
              Record Decision & Continue →
            </Button>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
