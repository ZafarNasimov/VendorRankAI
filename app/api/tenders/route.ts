import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTenderSchema } from "@/validators/tenderSchema";
import { submitAuditMessage, isHederaConfigured } from "@/services/hederaConsensusService";
import { TenderCreatedPayload } from "@/types/hedera";

export async function GET() {
  const tenders = await prisma.tender.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendors: { select: { id: true, companyName: true } },
      evaluation: { select: { id: true, createdAt: true } },
      decision: { select: { id: true, finalizedAt: true, overrideUsed: true } },
    },
  });
  return Response.json(tenders);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTenderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const topicId = process.env.HEDERA_TOPIC_ID || null;

  // Normalize empty date strings to undefined
  const data = parsed.data;
  const tender = await prisma.tender.create({
    data: {
      title: data.title,
      referenceNumber: data.referenceNumber || null,
      department: data.department,
      category: data.category,
      procurementMethod: data.procurementMethod || null,
      description: data.description || null,
      submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : null,
      contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
      contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
      estimatedBudget: data.estimatedBudget ?? null,
      currency: data.currency || "USD",
      contractType: data.contractType || null,
      paymentTerms: data.paymentTerms || null,
      bidBondRequired: data.bidBondRequired ?? false,
      performanceGuaranteeRequired: data.performanceGuaranteeRequired ?? false,
      criteriaWeights: data.criteriaWeights,
      minimumPassingScore: data.minimumPassingScore ?? null,
      requiredCompliance: data.requiredCompliance,
      mandatoryCertifications: data.mandatoryCertifications || null,
      technicalRequirements: data.technicalRequirements || null,
      deliverables: data.deliverables || null,
      conflictDeclarationRequired: data.conflictDeclarationRequired ?? false,
      sensitiveProcurement: data.sensitiveProcurement ?? false,
      multiReviewRequired: data.multiReviewRequired ?? false,
      notes: data.notes || null,
      status: "OPEN",
      hcsTopicId: topicId,
    },
  });

  // Write HCS event (non-blocking)
  const payload: TenderCreatedPayload = {
    eventType: "TENDER_CREATED",
    tenderId: tender.id,
    title: tender.title,
    department: tender.department,
    category: tender.category,
    procurementMethod: tender.procurementMethod ?? null,
    estimatedBudget: tender.estimatedBudget ?? null,
    currency: tender.currency ?? null,
    referenceNumber: tender.referenceNumber ?? null,
    recordedBy: "Procurement Officer",
    recordedAt: tender.createdAt.toISOString(),
  };

  let hcsResult = null;
  if (topicId && isHederaConfigured()) {
    try {
      hcsResult = await submitAuditMessage(topicId, payload);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId: tender.id,
          eventType: "TENDER_CREATED",
          localPayload: payload as object,
          topicId: hcsResult.topicId,
          transactionId: hcsResult.transactionId,
          status: "SUBMITTED",
        },
      });
    } catch (err) {
      console.error("[HCS] Failed to submit tender_created:", err);
      await prisma.hederaAuditEvent.create({
        data: {
          tenderId: tender.id,
          eventType: "TENDER_CREATED",
          localPayload: payload as object,
          topicId: topicId,
          status: "FAILED",
        },
      });
    }
  } else {
    await prisma.hederaAuditEvent.create({
      data: {
        tenderId: tender.id,
        eventType: "TENDER_CREATED",
        localPayload: payload as object,
        topicId: topicId,
        status: "PENDING",
      },
    });
  }

  return Response.json({ tender, hcsSubmitted: !!hcsResult }, { status: 201 });
}
