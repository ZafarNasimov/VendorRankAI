import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      vendors: true,
      evaluation: true,
      decision: {
        include: {
          aiRecommendedVendor: true,
          selectedVendor: true,
        },
      },
      auditEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  return Response.json(tender);
}
