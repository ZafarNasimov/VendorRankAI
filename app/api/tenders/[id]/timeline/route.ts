import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTimelineForTopic } from "@/services/mirrorNodeService";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tender = await prisma.tender.findUnique({
    where: { id },
    select: { id: true, hcsTopicId: true },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  // Local audit events (always available)
  const localEvents = await prisma.hederaAuditEvent.findMany({
    where: { tenderId: id },
    orderBy: { createdAt: "asc" },
  });

  // Mirror Node events (only if topic configured)
  let mirrorEvents = null;
  let mirrorError = null;

  if (tender.hcsTopicId) {
    try {
      mirrorEvents = await getTimelineForTopic(tender.hcsTopicId);
    } catch (err) {
      mirrorError =
        err instanceof Error ? err.message : "Mirror Node fetch failed";
    }
  }

  return Response.json({
    tenderId: id,
    topicId: tender.hcsTopicId,
    localEvents,
    mirrorEvents,
    mirrorError,
  });
}
