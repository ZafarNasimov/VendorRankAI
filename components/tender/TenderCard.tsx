"use client";

import Link from "next/link";
import { Building2, Calendar, Users, ArrowRight, Zap, UserCheck, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TenderStatusChip } from "@/components/ui/StatusChip";
import { formatDate } from "@/lib/utils";

interface TenderCardProps {
  tender: {
    id: string;
    title: string;
    department: string;
    category: string;
    status: string;
    createdAt: string | Date;
    vendors?: { id: string }[];
    evaluation?: { id: string } | null;
    decision?: { id: string; finalizedAt: string | Date | null } | null;
  };
}

const STATUS_ORDER = ["DRAFT", "OPEN", "EVALUATED", "DECIDED", "FINALIZED"];

const NEXT_ACTION: Record<string, { label: string; path: string }> = {
  DRAFT:      { label: "Add Vendors",        path: "vendors"  },
  OPEN:       { label: "Run AI Evaluation",  path: "evaluate" },
  EVALUATED:  { label: "Record Decision",    path: "decision" },
  DECIDED:    { label: "Finalize",           path: "finalize" },
  FINALIZED:  { label: "View Audit Trail",   path: "audit"    },
};

export function TenderCard({ tender }: TenderCardProps) {
  const vendorCount = tender.vendors?.length ?? 0;
  const statusIdx = STATUS_ORDER.indexOf(tender.status);
  const next = NEXT_ACTION[tender.status] ?? NEXT_ACTION.DRAFT;

  // Mini step dots
  const steps = [
    { done: vendorCount >= 2,         Icon: Users },
    { done: !!tender.evaluation,      Icon: Zap   },
    { done: !!tender.decision,        Icon: UserCheck },
    { done: tender.status === "FINALIZED", Icon: Lock },
  ];

  return (
    <Link href={`/tenders/${tender.id}`}>
      <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
        <div className="p-5 flex-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-tight line-clamp-2">
              {tender.title}
            </h3>
            <TenderStatusChip status={tender.status} />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap mb-4">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {tender.department}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {vendorCount} vendor{vendorCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(tender.createdAt)}
            </span>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map(({ done, Icon }, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    done
                      ? "bg-blue-600 border-blue-600 text-white"
                      : i <= statusIdx
                      ? "bg-blue-100 border-blue-300 text-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-300"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-4 ${done ? "bg-blue-400" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
            <span className="ml-auto text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded px-2 py-0.5">
              {tender.category}
            </span>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {tender.status === "FINALIZED" ? "Complete" : `Next: ${next.label}`}
          </span>
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            {tender.status === "FINALIZED" ? "View" : "Open"} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
