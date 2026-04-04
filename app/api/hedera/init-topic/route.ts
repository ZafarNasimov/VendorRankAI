import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditTopic, isHederaConfigured } from "@/services/hederaConsensusService";

const schema = z.object({ tenderId: z.string().min(1) });

export async function POST(req: NextRequest) {
  if (!isHederaConfigured()) {
    return Response.json(
      { error: "Hedera credentials not configured. Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY." },
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

  const tender = await prisma.tender.findUnique({
    where: { id: parsed.data.tenderId },
    select: { id: true, title: true, hcsTopicId: true },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  if (tender.hcsTopicId) {
    return Response.json({ topicId: tender.hcsTopicId, existing: true });
  }

  const topicId = await createAuditTopic(
    `VendorRank AI | ${tender.title} | ${tender.id}`
  );

  await prisma.tender.update({
    where: { id: tender.id },
    data: { hcsTopicId: topicId },
  });

  return Response.json({ topicId, existing: false }, { status: 201 });
}
