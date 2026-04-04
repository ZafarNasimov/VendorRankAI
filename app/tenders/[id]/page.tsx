import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Breadcrumbs } from "@/components/layout/Header";
import { Card, CardBody } from "@/components/ui/Card";
import { TenderStatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import {
  Building2,
  Tag,
  Calendar,
  Users,
  Zap,
  UserCheck,
  Lock,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import type { CriteriaWeights } from "@/types/tender";

export const dynamic = "force-dynamic";

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      vendors: true,
      evaluation: true,
      decision: {
        include: { selectedVendor: true, aiRecommendedVendor: true },
      },
      auditEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!tender) notFound();

  const weights = tender.criteriaWeights as unknown as CriteriaWeights;
  const canEvaluate = tender.vendors.length >= 2;
  const hasEvaluation = !!tender.evaluation;
  const hasDecision = !!tender.decision;
  const isFinalized = tender.status === "FINALIZED";

  const steps = [
    {
      label: "Vendors",
      href: `/tenders/${id}/vendors`,
      done: tender.vendors.length >= 2,
      icon: Users,
      desc: `${tender.vendors.length} vendor${tender.vendors.length !== 1 ? "s" : ""} added`,
    },
    {
      label: "AI Evaluation",
      href: `/tenders/${id}/evaluate`,
      done: hasEvaluation,
      icon: Zap,
      desc: hasEvaluation ? "Evaluation complete" : "Pending",
    },
    {
      label: "Decision",
      href: `/tenders/${id}/decision`,
      done: hasDecision,
      icon: UserCheck,
      desc: hasDecision
        ? tender.decision?.overrideUsed
          ? "Override used"
          : "AI recommendation accepted"
        : "Pending",
    },
    {
      label: "Finalize",
      href: `/tenders/${id}/finalize`,
      done: isFinalized,
      icon: Lock,
      desc: isFinalized ? "Decision finalized" : "Pending",
    },
  ];

  // Next action
  let nextHref = `/tenders/${id}/vendors`;
  if (tender.vendors.length >= 2 && !hasEvaluation) nextHref = `/tenders/${id}/evaluate`;
  else if (hasEvaluation && !hasDecision) nextHref = `/tenders/${id}/decision`;
  else if (hasDecision && !isFinalized) nextHref = `/tenders/${id}/finalize`;
  else if (isFinalized) nextHref = `/tenders/${id}/audit`;

  const nextLabel = isFinalized
    ? "View Audit Trail"
    : hasDecision
    ? "Finalize Decision"
    : hasEvaluation
    ? "Record Decision"
    : canEvaluate
    ? "Run AI Evaluation"
    : "Add Vendors";

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: "Tenders", href: "/tenders" },
          { label: tender.title },
        ]}
      />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{tender.title}</h1>
            <TenderStatusChip status={tender.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {tender.department}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              {tender.category}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(tender.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFinalized && (
            <Link href={`/tenders/${id}/report`}>
              <Button variant="outline" size="lg">
                <FileText className="w-4 h-4" />
                View Report
              </Button>
            </Link>
          )}
          <Link href={nextHref}>
            <Button size="lg">
              {nextLabel} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress steps */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-0">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <Link href={step.href} className="flex flex-col items-center flex-1 group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        step.done
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-300 text-slate-400 group-hover:border-blue-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-xs font-medium mt-1.5 ${step.done ? "text-blue-700" : "text-slate-500"}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-400 text-center hidden md:block">
                      {step.desc}
                    </p>
                  </Link>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${step.done ? "bg-blue-600" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criteria weights */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-800 mb-4">Evaluation Weights</h3>
            <div className="space-y-3">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-600 capitalize">{key}</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {Math.round((val as number) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(val as number) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Audit events count */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-800 mb-4">Hedera Events</h3>
            <div className="space-y-2">
              {tender.auditEvents.length === 0 ? (
                <p className="text-sm text-slate-400">No events yet</p>
              ) : (
                tender.auditEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      {ev.eventType.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        ev.status === "SUBMITTED"
                          ? "bg-teal-50 text-teal-700"
                          : ev.status === "FAILED"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            {tender.hcsTopicId && (
              <p className="text-xs text-slate-400 mt-3 font-mono border-t pt-2">
                Topic: {tender.hcsTopicId}
              </p>
            )}
            {isFinalized && (
              <Link href={`/tenders/${id}/audit`} className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  <Clock className="w-3.5 h-3.5" />
                  View Full Timeline
                </Button>
              </Link>
            )}
          </CardBody>
        </Card>

        {/* Notes */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-800 mb-3">Notes</h3>
            {tender.notes ? (
              <p className="text-sm text-slate-600 leading-relaxed">{tender.notes}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">No notes provided</p>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
