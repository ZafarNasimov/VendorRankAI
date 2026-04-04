"use client";

import { useState, useEffect, use } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Breadcrumbs } from "@/components/layout/Header";
import { AuditTimeline } from "@/components/audit/AuditTimeline";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { HederaAuditEvent } from "@/types/hedera";

interface TimelineData {
  tenderId: string;
  topicId: string | null;
  localEvents: HederaAuditEvent[];
  mirrorEvents: Array<{
    sequenceNumber: number;
    consensusTimestamp: string;
    eventType: string;
    payload: Record<string, unknown>;
    topicId: string;
  }> | null;
  mirrorError: string | null;
}

export default function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenderTitle, setTenderTitle] = useState("");
  const [useMirror, setUseMirror] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [timelineRes, tenderRes] = await Promise.all([
        fetch(`/api/tenders/${id}/timeline`),
        fetch(`/api/tenders/${id}`),
      ]);
      const [timeline, tender] = await Promise.all([
        timelineRes.json(),
        tenderRes.json(),
      ]);
      setData(timeline);
      setTenderTitle(tender.title ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const hasMirrorData = data?.mirrorEvents && data.mirrorEvents.length > 0;

  // Build unified events for display
  const displayEvents = (() => {
    if (useMirror && hasMirrorData && data?.mirrorEvents) {
      return data.mirrorEvents.map((me, idx) => ({
        id: `mirror-${idx}`,
        eventType: me.eventType as HederaAuditEvent["eventType"],
        localPayload: me.payload as HederaAuditEvent["localPayload"],
        topicId: me.topicId,
        sequenceNumber: me.sequenceNumber,
        consensusTimestamp: me.consensusTimestamp,
        status: "CONFIRMED" as const,
        createdAt: new Date(parseFloat(me.consensusTimestamp) * 1000).toISOString(),
      }));
    }
    return data?.localEvents ?? [];
  })();

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: "Tenders", href: "/tenders" },
          { label: tenderTitle || "Tender", href: `/tenders/${id}` },
          { label: "Audit Timeline" },
        ]}
      />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Audit Timeline</h1>
          </div>
          <p className="text-slate-500">
            Immutable, chronological record of all procurement events.
            {data?.topicId && " Verified on Hedera."}
          </p>
        </div>
        <Button variant="outline" onClick={load} size="sm">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Source toggle */}
      {data?.topicId && (
        <div className="mb-6">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 gap-1">
            <button
              onClick={() => setUseMirror(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !useMirror
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Local Database
            </button>
            <button
              onClick={() => setUseMirror(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                useMirror
                  ? "bg-teal-600 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Hedera Mirror Node
            </button>
          </div>

          {data.mirrorError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Mirror Node error: {data.mirrorError}. Showing local data.
            </div>
          )}

          {useMirror && hasMirrorData && (
            <div className="mt-3 flex items-center gap-2 text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Showing {data.mirrorEvents!.length} events fetched live from Hedera Mirror Node
              <a
                href={`https://hashscan.io/testnet/topic/${data.topicId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 font-medium hover:text-teal-900"
              >
                HashScan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      {!loading && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: "Total Events",
              value: displayEvents.length,
              color: "text-slate-800",
            },
            {
              label: "On Hedera",
              value: displayEvents.filter(
                (e) => e.status === "SUBMITTED" || e.status === "CONFIRMED"
              ).length,
              color: "text-teal-700",
            },
            {
              label: "Pending",
              value: displayEvents.filter((e) => e.status === "PENDING").length,
              color: "text-amber-700",
            },
            {
              label: "Topic ID",
              value: data.topicId ? "Active" : "Not configured",
              color: data.topicId ? "text-blue-700" : "text-slate-400",
            },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardBody className="py-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <AuditTimeline events={displayEvents} topicId={data?.topicId} />
      )}

      {/* Hedera info box */}
      {!data?.topicId && (
        <Card className="mt-8 border-amber-200 bg-amber-50/50">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">
                  Hedera topic not configured
                </p>
                <p className="text-sm text-amber-700">
                  Set <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">HEDERA_ACCOUNT_ID</code>,{" "}
                  <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">HEDERA_PRIVATE_KEY</code>, and{" "}
                  <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">HEDERA_TOPIC_ID</code> to
                  enable live Hedera integration. Events are stored locally in the
                  meantime.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </PageWrapper>
  );
}
