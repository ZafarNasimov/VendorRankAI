import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeDecisionSchema } from "@/validators/decisionSchema";
import { submitAuditMessage, isHederaConfigured } from "@/services/hederaConsensusService";
import type { DecisionFinalizedPayload } from "@/types/hedera";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = finalizeDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tenderId, reviewerName } = parsed.data;

  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: {
      decision: {
        include: { selectedVendor: true, aiRecommendedVendor: true },
      },
    },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  if (!tender.decision) {
    return Response.json(
      { error: "Decision must be recorded before finalizing" },
      { status: 409 }
    );
  }

  const now = new Date();

  const [updatedDecision] = await prisma.$transaction([
    prisma.procurementDecision.update({
      where: { tenderId },
      data: { finalizedAt: now },
      include: { selectedVendor: true, aiRecommendedVendor: true },
    }),
    prisma.tender.update({
      where: { id: tenderId },
      data: { status: "FINALIZED" },
    }),
  ]);

  // HCS finalization event
  const payload: DecisionFinalizedPayload = {
    eventType: "DECISION_FINALIZED",
    tenderId,
    selectedVendorId: tender.decision.selectedVendorId,
    selectedVendorName: tender.decision.selectedVendor?.companyName ?? "Unknown",
    aiTopVendorId: tender.decision.aiRecommendedVendorId,
    aiTopVendorName: tender.decision.aiRecommendedVendor?.companyName ?? undefined,
    overrideUsed: tender.decision.overrideUsed,
    decisionHash: tender.decision.decisionHash,
    recordedBy: reviewerName,
    recordedAt: now.toISOString(),
  };

  const topicId = tender.hcsTopicId;
  let hcsResult = null;

  if (topicId && isHederaConfigured()) {
    try {
      hcsResult = await submitAuditMessage(topicId, payload);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId,
          eventType: "DECISION_FINALIZED",
          localPayload: payload as object,
          topicId: hcsResult.topicId,
          transactionId: hcsResult.transactionId,
          status: "SUBMITTED",
        },
      });
    } catch (err) {
      console.error("[HCS] Finalize submit failed:", err);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId,
          eventType: "DECISION_FINALIZED",
          localPayload: payload as object,
          topicId,
          status: "FAILED",
        },
      });
    }
  } else {
    await prisma.hederaAuditEvent.create({
      data: {
        tenderId,
        eventType: "DECISION_FINALIZED",
        localPayload: payload as object,
        topicId,
        status: "PENDING",
      },
    });
  }

  return Response.json({
    decision: updatedDecision,
    finalizedAt: now.toISOString(),
    hcsSubmitted: !!hcsResult,
    transactionId: hcsResult?.transactionId ?? null,
    topicId: topicId ?? null,
  });
}
