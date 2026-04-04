import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isHederaConfigured } from "@/services/hederaConsensusService";
import { mintReviewerBadge, createBadgeToken } from "@/services/badgeService";
import { PrivateKey } from "@hashgraph/sdk";

const schema = z.object({
  tenderId: z.string().min(1),
  reviewerName: z.string().min(2).max(100),
  reviewerAccount: z.string().optional(),
});

// Use env-configured token id or create on demand
const BADGE_TOKEN_ID = process.env.HEDERA_BADGE_TOKEN_ID;

export async function POST(req: NextRequest) {
  if (!isHederaConfigured()) {
    return Response.json(
      { error: "Hedera credentials not configured" },
      { status: 503 }
    );
  }

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

  const { tenderId, reviewerName, reviewerAccount } = parsed.data;

  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    select: { id: true, title: true, status: true },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  if (tender.status !== "FINALIZED") {
    return Response.json(
      { error: "Badges can only be minted for finalized tenders" },
      { status: 409 }
    );
  }

  let tokenId = BADGE_TOKEN_ID;

  if (!tokenId) {
    const supplyKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY!);
    tokenId = await createBadgeToken(supplyKey);
  }

  // Keep on-chain metadata compact (≤100 bytes — HTS hard limit).
  // Full badge details are stored in the DB ReviewerBadge record.
  const shortTenderId = tenderId.slice(-12); // last 12 chars of cuid
  const shortReviewer = reviewerName.slice(0, 28);
  const metadata = `vrb:badge:${shortTenderId}:${shortReviewer}`;

  const result = await mintReviewerBadge(tokenId, metadata);

  const badge = await prisma.reviewerBadge.create({
    data: {
      reviewerName,
      reviewerAccount: reviewerAccount ?? null,
      tenderId,
      tokenId: result.tokenId,
      serialNumber: result.serialNumber,
      metadata: metadata,
      issuedAt: new Date(),
    },
  });

  // Log HCS event for badge issuance
  await prisma.hederaAuditEvent.create({
    data: {
      tenderId,
      eventType: "BADGE_ISSUED",
      localPayload: {
        eventType: "BADGE_ISSUED",
        tenderId,
        reviewerName,
        tokenId: result.tokenId,
        serialNumber: result.serialNumber,
        transactionId: result.transactionId,
        recordedBy: reviewerName,
        recordedAt: new Date().toISOString(),
      },
      topicId: tender.id,
      transactionId: result.transactionId,
      status: "SUBMITTED",
    },
  });

  return Response.json({ badge, mintResult: result }, { status: 201 });
}
