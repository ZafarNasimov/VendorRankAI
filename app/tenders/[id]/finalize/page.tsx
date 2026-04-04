"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Breadcrumbs } from "@/components/layout/Header";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Hash,
  ExternalLink,
  Award,
  FileText,
} from "lucide-react";

interface TenderData {
  id: string;
  title: string;
  hcsTopicId: string | null;
  decision: {
    id: string;
    aiRecommendedVendorId: string;
    selectedVendorId: string;
    overrideUsed: boolean;
    overrideReason: string | null;
    decisionHash: string;
    finalizedAt: string | null;
    aiRecommendedVendor: { id: string; companyName: string; price: number };
    selectedVendor: { id: string; companyName: string; price: number };
  } | null;
}

export default function FinalizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tender, setTender] = useState<TenderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [reviewerName, setReviewerName] = useState("Procurement Officer");
  const [reviewerRole, setReviewerRole] = useState("Procurement Officer");
  const [finalizeResult, setFinalizeResult] = useState<{
    transactionId: string | null;
    topicId: string | null;
    finalizedAt: string;
  } | null>(null);
  const [mintingBadge, setMintingBadge] = useState(false);
  const [badgeResult, setBadgeResult] = useState<{
    tokenId: string;
    serialNumber: number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/tenders/${id}`)
      .then((r) => r.json())
      .then(setTender)
      .finally(() => setLoading(false));
  }, [id]);

  const isFinalized = !!tender?.decision?.finalizedAt;

  async function handleFinalize() {
    if (!reviewerName.trim()) {
      toast.error("Enter your name to finalize");
      return;
    }
    setFinalizing(true);
    try {
      const res = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId: id, reviewerName: reviewerName.trim() || reviewerRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Finalization failed");
      }

      const data = await res.json();
      setFinalizeResult({
        transactionId: data.transactionId,
        topicId: data.topicId,
        finalizedAt: data.finalizedAt,
      });
      toast.success("Decision finalized and logged to Hedera");
      // Reload tender
      const updated = await fetch(`/api/tenders/${id}`).then((r) => r.json());
      setTender(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Finalization failed");
    } finally {
      setFinalizing(false);
    }
  }

  async function handleMintBadge() {
    setMintingBadge(true);
    try {
      const res = await fetch("/api/hedera/mint-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId: id, reviewerName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Badge minting failed");
      }

      const data = await res.json();
      setBadgeResult({
        tokenId: data.badge.tokenId,
        serialNumber: data.badge.serialNumber,
      });
      toast.success("Reviewer badge minted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Badge minting failed");
    } finally {
      setMintingBadge(false);
    }
  }

  if (loading || !tender) {
    return (
      <PageWrapper>
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      </PageWrapper>
    );
  }

  const decision = tender.decision;

  return (
    <PageWrapper className="max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Tenders", href: "/tenders" },
          { label: tender.title, href: `/tenders/${id}` },
          { label: "Finalize" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Finalize Decision</h1>
        <p className="text-slate-500 mt-1">
          Review the final procurement decision and submit to Hedera for
          permanent record.
        </p>
      </div>

      {/* Decision Summary */}
      {decision && (
        <Card className="mb-6">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-semibold text-slate-800">Decision Summary</h3>
              {isFinalized ? (
                <StatusChip type="finalized" />
              ) : decision.overrideUsed ? (
                <StatusChip type="overridden" />
              ) : (
                <StatusChip type="ai-recommended" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1">
                  AI Recommendation
                </p>
                <p className="font-bold text-slate-800">
                  {decision.aiRecommendedVendor.companyName}
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(decision.aiRecommendedVendor.price)}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  decision.overrideUsed
                    ? "bg-amber-50 border-amber-100"
                    : "bg-emerald-50 border-emerald-100"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                    decision.overrideUsed ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {decision.overrideUsed ? "Human Override" : "Human Selection (Agreed)"}
                </p>
                <p className="font-bold text-slate-800">
                  {decision.selectedVendor.companyName}
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(decision.selectedVendor.price)}
                </p>
              </div>
            </div>

            {decision.overrideUsed && decision.overrideReason && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700">Override Reason:</p>
                  <p className="text-sm text-amber-800 mt-0.5">{decision.overrideReason}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
              <Hash className="w-4 h-4 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600">Decision Hash</p>
                <p className="text-xs font-mono text-slate-400 truncate">
                  {decision.decisionHash}
                </p>
              </div>
            </div>

            {isFinalized && decision.finalizedAt && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Finalized at {formatDateTime(decision.finalizedAt)}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Finalization result */}
      {(finalizeResult || (isFinalized && tender.hcsTopicId)) && (
        <Card className="mb-6 border-teal-200 bg-teal-50/50">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-teal-800 mb-1">
                  Decision logged on Hedera
                </p>
                {tender.hcsTopicId && (
                  <p className="text-sm text-teal-700 font-mono mb-1">
                    Topic: {tender.hcsTopicId}
                  </p>
                )}
                {finalizeResult?.transactionId && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-teal-600 font-mono truncate">
                      Tx: {finalizeResult.transactionId}
                    </p>
                    <a
                      href={`https://hashscan.io/testnet/transaction/${finalizeResult.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-800"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Badge result */}
      {badgeResult && (
        <Card className="mb-6 border-purple-200 bg-purple-50/50">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-purple-800">Reviewer Badge Minted</p>
                <p className="text-xs text-purple-600 font-mono">
                  Token {badgeResult.tokenId} · Serial #{badgeResult.serialNumber}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      {!isFinalized ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Finalizing Officer Name
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                <option>Auditor</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/tenders/${id}/decision`)}
            >
              ← Back
            </Button>
            <Button
              onClick={handleFinalize}
              loading={finalizing}
              size="lg"
            >
              <Lock className="w-4 h-4" />
              Finalize & Record on Hedera
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleMintBadge}
              loading={mintingBadge}
              disabled={!!badgeResult}
            >
              <Award className="w-4 h-4" />
              {badgeResult ? "Badge Minted" : "Mint Reviewer Badge (HTS)"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/tenders/${id}/report`)}
            >
              <FileText className="w-4 h-4" />
              View Report
            </Button>
          </div>
          <Button onClick={() => router.push(`/tenders/${id}/audit`)} size="lg">
            View Audit Timeline →
          </Button>
        </div>
      )}
    </PageWrapper>
  );
}
