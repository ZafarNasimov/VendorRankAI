import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordDecisionSchema } from "@/validators/decisionSchema";
import { hashDecision } from "@/services/hashingService";
import { submitAuditMessage, isHederaConfigured } from "@/services/hederaConsensusService";
import type { HumanDecisionPayload } from "@/types/hedera";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = recordDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tenderId, selectedVendorId, overrideUsed, overrideReason, reviewerName } =
    parsed.data;

  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: { evaluation: true, vendors: { select: { id: true, companyName: true } } },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  if (!tender.evaluation) {
    return Response.json(
      { error: "Tender must be evaluated before recording a decision" },
      { status: 409 }
    );
  }

  // Get AI top vendor from evaluation
  const ranking = tender.evaluation.ranking as Array<{ vendorId: string; rank: number }>;
  const aiTopVendorId = ranking.find((r) => r.rank === 1)?.vendorId ?? "";

  const timestamp = new Date().toISOString();
  const decisionHash = hashDecision({
    tenderId,
    aiRecommendedVendorId: aiTopVendorId,
    selectedVendorId,
    overrideUsed,
    overrideReason: overrideReason ?? null,
    timestamp,
  });

  const decision = await prisma.procurementDecision.upsert({
    where: { tenderId },
    update: {
      aiRecommendedVendorId: aiTopVendorId,
      selectedVendorId,
      overrideUsed,
      overrideReason: overrideReason ?? null,
      decisionHash,
      finalizedAt: null,
    },
    create: {
      tenderId,
      aiRecommendedVendorId: aiTopVendorId,
      selectedVendorId,
      overrideUsed,
      overrideReason: overrideReason ?? null,
      decisionHash,
    },
  });

  await prisma.tender.update({
    where: { id: tenderId },
    data: { status: "DECIDED" },
  });

  // HCS event
  const vendorMap = Object.fromEntries(tender.vendors.map((v) => [v.id, v.companyName]));
  const payload: HumanDecisionPayload = {
    eventType: "HUMAN_DECISION_RECORDED",
    tenderId,
    aiTopVendorId,
    aiTopVendorName: vendorMap[aiTopVendorId] ?? "Unknown",
    selectedVendorId,
    selectedVendorName: vendorMap[selectedVendorId] ?? "Unknown",
    overrideUsed,
    overrideReason: overrideReason,
    decisionHash,
    recordedBy: reviewerName ?? "Procurement Officer",
    recordedAt: timestamp,
  };

  const topicId = tender.hcsTopicId;

  if (topicId && isHederaConfigured()) {
    try {
      const hcsResult = await submitAuditMessage(topicId, payload);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId,
          eventType: "HUMAN_DECISION_RECORDED",
          localPayload: payload as object,
          topicId: hcsResult.topicId,
          transactionId: hcsResult.transactionId,
          status: "SUBMITTED",
        },
      });
    } catch (err) {
      console.error("[HCS] Decision submit failed:", err);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId,
          eventType: "HUMAN_DECISION_RECORDED",
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
        eventType: "HUMAN_DECISION_RECORDED",
        localPayload: payload as object,
        topicId,
        status: "PENDING",
      },
    });
  }

  return Response.json({ decision, decisionHash });
}
