import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVendorSchema } from "@/validators/vendorSchema";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createVendorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const tender = await prisma.tender.findUnique({
    where: { id: parsed.data.tenderId },
    select: { id: true, status: true },
  });

  if (!tender) {
    return Response.json({ error: "Tender not found" }, { status: 404 });
  }

  if (tender.status === "FINALIZED") {
    return Response.json(
      { error: "Cannot add vendors to a finalized tender" },
      { status: 409 }
    );
  }

  const vendorCount = await prisma.vendorProposal.count({
    where: { tenderId: parsed.data.tenderId },
  });

  if (vendorCount >= 5) {
    return Response.json(
      { error: "Maximum of 5 vendors per tender" },
      { status: 409 }
    );
  }

  const d = parsed.data;
  const vendor = await prisma.vendorProposal.create({
    data: {
      tenderId: d.tenderId,
      // Section A
      companyName: d.companyName,
      registrationNumber: d.registrationNumber || null,
      country: d.country || null,
      address: d.address || null,
      contactPerson: d.contactPerson || null,
      contactEmail: d.contactEmail || null,
      contactPhone: d.contactPhone || null,
      taxId: d.taxId || null,
      // Section B
      price: d.price,
      currency: d.currency || "USD",
      deliveryDays: d.deliveryDays,
      paymentTermsOffered: d.paymentTermsOffered || null,
      discountTerms: d.discountTerms || null,
      offerValidityDays: d.offerValidityDays ?? null,
      // Section C
      experienceScore: d.experienceScore,
      yearsInBusiness: d.yearsInBusiness ?? null,
      similarProjectsCount: d.similarProjectsCount ?? null,
      proposedTeamSize: d.proposedTeamSize ?? null,
      keyPersonnelSummary: d.keyPersonnelSummary || null,
      referenceClients: d.referenceClients || null,
      // Section D
      complianceStatus: d.complianceStatus,
      certificationsPresent: d.certificationsPresent ?? false,
      sanctionsDeclaration: d.sanctionsDeclaration ?? false,
      conflictDeclaration: d.conflictDeclaration ?? false,
      insurancePresent: d.insurancePresent ?? false,
      financialStatementsAvailable: d.financialStatementsAvailable ?? false,
      // Section E
      warrantyScore: d.warrantyScore,
      meetsTechnicalRequirements: d.meetsTechnicalRequirements ?? false,
      supportPeriodMonths: d.supportPeriodMonths ?? null,
      maintenanceIncluded: d.maintenanceIncluded ?? false,
      riskNotes: d.riskNotes || null,
      proposalSummary: d.proposalSummary || null,
    },
  });

  return Response.json(vendor, { status: 201 });
}

export async function GET(req: NextRequest) {
  const tenderId = req.nextUrl.searchParams.get("tenderId");
  if (!tenderId) {
    return Response.json({ error: "tenderId required" }, { status: 400 });
  }

  const vendors = await prisma.vendorProposal.findMany({
    where: { tenderId },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(vendors);
}
