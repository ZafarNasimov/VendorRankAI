import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { evaluateVendorsWithAI, type TenderContext } from "@/services/aiEvaluationService";
import { hashEvaluation } from "@/services/hashingService";
import { submitAuditMessage, isHederaConfigured } from "@/services/hederaConsensusService";
import type { AiRankingGeneratedPayload } from "@/types/hedera";
import type { CriteriaWeights } from "@/types/tender";

const schema = z.object({ tenderId: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tenderId } = parsed.data;

  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: { vendors: true },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  if (tender.vendors.length < 2) {
    return Response.json(
      { error: "At least 2 vendors required for evaluation" },
      { status: 409 }
    );
  }

  const weights = tender.criteriaWeights as unknown as CriteriaWeights;
  const vendors = tender.vendors.map((v) => ({
    ...v,
    complianceStatus: v.complianceStatus as "FULL" | "PARTIAL" | "NONE",
  }));

  const tenderContext: TenderContext = {
    title: tender.title,
    department: tender.department,
    category: tender.category,
    procurementMethod: tender.procurementMethod,
    estimatedBudget: tender.estimatedBudget,
    currency: tender.currency,
    contractType: tender.contractType,
    paymentTerms: tender.paymentTerms,
    mandatoryCertifications: tender.mandatoryCertifications,
    technicalRequirements: tender.technicalRequirements,
    deliverables: tender.deliverables,
    minimumPassingScore: tender.minimumPassingScore,
    bidBondRequired: tender.bidBondRequired ?? false,
    performanceGuaranteeRequired: tender.performanceGuaranteeRequired ?? false,
    notes: tender.notes,
  };

  const result = await evaluateVendorsWithAI(
    tenderId,
    vendors,
    weights,
    tenderContext
  );

  const evaluationHash = hashEvaluation({
    tenderId,
    ranking: result.ranking,
    criterionScores: result.criterionScores,
    reasoning: result.reasoning,
    redFlags: result.redFlags,
  });

  // Upsert evaluation
  const evaluation = await prisma.aiEvaluation.upsert({
    where: { tenderId },
    update: {
      ranking: result.ranking as object[],
      criterionScores: result.criterionScores as object,
      reasoning: result.reasoning,
      redFlags: result.redFlags as object[],
      vendorInsights: result.vendorInsights as object,
      whyTopVendorWon: result.whyTopVendorWon || null,
      confidenceNotes: result.confidenceNotes,
      evaluationHash,
    },
    create: {
      tenderId,
      ranking: result.ranking as object[],
      criterionScores: result.criterionScores as object,
      reasoning: result.reasoning,
      redFlags: result.redFlags as object[],
      vendorInsights: result.vendorInsights as object,
      whyTopVendorWon: result.whyTopVendorWon || null,
      confidenceNotes: result.confidenceNotes,
      evaluationHash,
    },
  });

  await prisma.tender.update({
    where: { id: tenderId },
    data: { status: "EVALUATED" },
  });

  // HCS event
  const topVendor = tender.vendors.find(
    (v) => v.id === result.ranking[0]?.vendorId
  );

  const payload: AiRankingGeneratedPayload = {
    eventType: "AI_RANKING_GENERATED",
    tenderId,
    vendorIds: tender.vendors.map((v) => v.id),
    vendorCount: tender.vendors.length,
    topVendorId: result.ranking[0]?.vendorId ?? "",
    topVendorName: topVendor?.companyName ?? "Unknown",
    evaluationHash,
    scoringModelVersion: "v1.0",
    recordedBy: "ai-system",
    recordedAt: new Date().toISOString(),
  };

  const topicId = tender.hcsTopicId;

  if (topicId && isHederaConfigured()) {
    try {
      const hcsResult = await submitAuditMessage(topicId, payload);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId,
          eventType: "AI_RANKING_GENERATED",
          localPayload: payload as object,
          topicId: hcsResult.topicId,
          transactionId: hcsResult.transactionId,
          status: "SUBMITTED",
        },
      });
    } catch (err) {
      console.error("[HCS] AI ranking submit failed:", err);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId,
          eventType: "AI_RANKING_GENERATED",
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
        eventType: "AI_RANKING_GENERATED",
        localPayload: payload as object,
        topicId,
        status: "PENDING",
      },
    });
  }

  return Response.json({ evaluation, evaluationHash });
}
