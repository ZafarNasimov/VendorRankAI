"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Breadcrumbs } from "@/components/layout/Header";
import { EvaluationPanel } from "@/components/evaluation/EvaluationPanel";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VendorTable } from "@/components/vendor/VendorTable";
import { Zap, RefreshCw, Lock } from "lucide-react";
import type { VendorProposal, AiEvaluation } from "@/types/tender";

interface TenderData {
  id: string;
  title: string;
  status: string;
  vendors: VendorProposal[];
  evaluation: AiEvaluation | null;
  decision: {
    selectedVendorId: string;
    overrideUsed: boolean;
    finalizedAt: string | null;
  } | null;
}

export default function EvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tender, setTender] = useState<TenderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  async function loadTender() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenders/${id}`);
      const data = await res.json();
      setTender(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTender();
  }, [id]);

  async function runEvaluation() {
    setEvaluating(true);
    const toastId = toast.loading("Running AI evaluation…");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId: id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Evaluation failed");
      }

      toast.success("AI evaluation complete", { id: toastId });
      await loadTender();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Evaluation failed",
        { id: toastId }
      );
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) {
    return (
      <PageWrapper className="max-w-4xl">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  if (!tender) {
    return (
      <PageWrapper>
        <p className="text-slate-500">Tender not found.</p>
      </PageWrapper>
    );
  }

  const isFinalized = tender.status === "FINALIZED";

  return (
    <PageWrapper className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Tenders", href: "/tenders" },
          { label: tender.title, href: `/tenders/${id}` },
          { label: "AI Evaluation" },
        ]}
      />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">AI Evaluation</h1>
            {isFinalized && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Lock className="w-3 h-3" /> Finalized
              </span>
            )}
          </div>
          <p className="text-slate-500">
            AI-assisted multi-criteria analysis across{" "}
            {tender.vendors.length} vendors. All scores are explainable and hashed on Hedera.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tender.evaluation && !isFinalized && (
            <Button variant="outline" onClick={runEvaluation} loading={evaluating} size="sm">
              <RefreshCw className="w-4 h-4" />
              Re-evaluate
            </Button>
          )}
          {!tender.evaluation && (
            <Button onClick={runEvaluation} loading={evaluating} size="lg">
              <Zap className="w-4 h-4" />
              Run AI Evaluation
            </Button>
          )}
        </div>
      </div>

      {/* Vendor comparison table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Vendor Overview</h3>
            <Badge variant="default">{tender.vendors.length} proposals</Badge>
          </div>
        </CardHeader>
        <VendorTable
          vendors={tender.vendors}
          ranking={tender.evaluation?.ranking}
          aiTopVendorId={tender.evaluation?.ranking?.[0]?.vendorId}
          selectedVendorId={tender.decision?.selectedVendorId ?? undefined}
        />
      </Card>

      {tender.evaluation ? (
        <EvaluationPanel
          tenderId={id}
          evaluation={tender.evaluation}
          vendors={tender.vendors}
          selectedVendorId={tender.decision?.selectedVendorId ?? null}
          isFinalized={isFinalized}
        />
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Ready to evaluate
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Click <strong>Run AI Evaluation</strong> to score all vendor proposals
            using weighted multi-criteria analysis. The result will be hashed and
            logged to the Hedera audit trail.
          </p>
          <Button onClick={runEvaluation} loading={evaluating} size="lg">
            <Zap className="w-4 h-4" />
            Run AI Evaluation
          </Button>
        </div>
      )}
    </PageWrapper>
  );
}
