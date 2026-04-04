import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sha256 } from "../services/hashingService";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo data...");

  // Clean up
  await prisma.hederaAuditEvent.deleteMany();
  await prisma.reviewerBadge.deleteMany();
  await prisma.procurementDecision.deleteMany();
  await prisma.aiEvaluation.deleteMany();
  await prisma.vendorProposal.deleteMany();
  await prisma.tender.deleteMany();

  // Tender 1: Finalized demo
  const tender1 = await prisma.tender.create({
    data: {
      title: "Cloud Infrastructure & Hosting Services 2025",
      department: "Department of Digital Services",
      category: "Cloud & Hosting",
      status: "FINALIZED",
      criteriaWeights: {
        price: 0.3,
        delivery: 0.2,
        experience: 0.25,
        compliance: 0.15,
        warranty: 0.1,
      },
      requiredCompliance: { iso27001: true, gdpr: true, soc2: true, localVendor: false },
      notes: "Critical infrastructure migration. Must be completed within Q2 2025. SOC2 and ISO 27001 are mandatory.",
    },
  });

  const vendors1 = await Promise.all([
    prisma.vendorProposal.create({
      data: {
        tenderId: tender1.id,
        companyName: "Nimbus Cloud Corp",
        price: 285000,
        deliveryDays: 60,
        experienceScore: 9.0,
        complianceStatus: "FULL",
        warrantyScore: 8.5,
        proposalSummary:
          "Nimbus offers a proven government-grade cloud platform with 99.99% SLA. ISO 27001 and SOC2 Type II certified. Dedicated migration team with 10+ gov projects delivered.",
      },
    }),
    prisma.vendorProposal.create({
      data: {
        tenderId: tender1.id,
        companyName: "Stratus Systems Ltd",
        price: 248000,
        deliveryDays: 75,
        experienceScore: 7.5,
        complianceStatus: "FULL",
        warrantyScore: 7.0,
        proposalSummary:
          "Competitive pricing with solid compliance track record. Slightly longer delivery window due to custom provisioning requirements.",
      },
    }),
    prisma.vendorProposal.create({
      data: {
        tenderId: tender1.id,
        companyName: "QuickHost Technologies",
        price: 195000,
        deliveryDays: 45,
        experienceScore: 5.5,
        complianceStatus: "PARTIAL",
        warrantyScore: 6.0,
        proposalSummary:
          "Lowest cost option with fastest delivery. However, only partial ISO 27001 compliance and limited enterprise track record.",
      },
    }),
    prisma.vendorProposal.create({
      data: {
        tenderId: tender1.id,
        companyName: "DataVault Federal",
        price: 320000,
        deliveryDays: 90,
        experienceScore: 9.5,
        complianceStatus: "FULL",
        warrantyScore: 9.5,
        proposalSummary:
          "Premium provider specializing in government cloud. Highest experience and support quality, but also highest price and longest delivery.",
      },
    }),
  ]);

  const ranking = [
    { vendorId: vendors1[0].id, rank: 1, totalScore: 81.5, criterionScores: { price: 68, delivery: 75, experience: 92, compliance: 100, warranty: 88 } },
    { vendorId: vendors1[3].id, rank: 2, totalScore: 78.2, criterionScores: { price: 40, delivery: 40, experience: 100, compliance: 100, warranty: 100 } },
    { vendorId: vendors1[1].id, rank: 3, totalScore: 75.4, criterionScores: { price: 80, delivery: 58, experience: 72, compliance: 100, warranty: 68 } },
    { vendorId: vendors1[2].id, rank: 4, totalScore: 58.1, criterionScores: { price: 100, delivery: 100, experience: 40, compliance: 50, warranty: 52 } },
  ];

  const criterionScores: Record<string, Record<string, number>> = {};
  ranking.forEach((r) => { criterionScores[r.vendorId] = r.criterionScores; });

  const evalData = {
    tenderId: tender1.id,
    ranking,
    criterionScores,
    reasoning: `Based on a weighted multi-criteria analysis, **Nimbus Cloud Corp** emerges as the top recommendation with a composite score of 81.5. While not the cheapest option, Nimbus delivers the best balance across all evaluation dimensions, with particular strength in compliance (100/100) and vendor experience (92/100).

**DataVault Federal** scores second overall (78.2) and would be the top choice on experience and support metrics alone — however, its significantly higher price ($320,000 vs $285,000) and 90-day delivery timeline reduce its overall competitiveness when price and delivery weights are applied.

**QuickHost Technologies** presents the most favorable price and fastest delivery but carries material risk: partial ISO 27001 compliance does not meet mandatory requirements stated in the tender. Procurement teams should carefully consider whether a compliance waiver process is feasible before any award to this vendor.`,
    redFlags: [
      { vendorId: vendors1[2].id, flag: "QuickHost Technologies has PARTIAL compliance only. Mandatory ISO 27001 and SOC2 requirements may not be satisfied.", severity: "HIGH" },
      { vendorId: vendors1[3].id, flag: "DataVault Federal price ($320,000) is significantly above market average for this tender category.", severity: "LOW" },
    ],
    confidenceNotes: "Analysis based on provided proposal data. Independent compliance verification recommended before final award.",
  };

  const evalHash = sha256({
    tenderId: evalData.tenderId,
    ranking: evalData.ranking,
    criterionScores: evalData.criterionScores,
    reasoning: evalData.reasoning,
    redFlags: evalData.redFlags,
  });

  const evaluation = await prisma.aiEvaluation.create({
    data: {
      tenderId: tender1.id,
      ranking: evalData.ranking as object[],
      criterionScores: evalData.criterionScores as object,
      reasoning: evalData.reasoning,
      redFlags: evalData.redFlags as object[],
      confidenceNotes: evalData.confidenceNotes,
      evaluationHash: evalHash,
    },
  });

  const decisionHash = sha256({
    tenderId: tender1.id,
    aiRecommendedVendorId: vendors1[0].id,
    selectedVendorId: vendors1[0].id,
    overrideUsed: false,
    overrideReason: null,
    timestamp: new Date("2025-03-15T14:30:00Z").toISOString(),
  });

  await prisma.procurementDecision.create({
    data: {
      tenderId: tender1.id,
      aiRecommendedVendorId: vendors1[0].id,
      selectedVendorId: vendors1[0].id,
      overrideUsed: false,
      decisionHash,
      finalizedAt: new Date("2025-03-15T15:00:00Z"),
    },
  });

  // Audit events for demo
  const auditEvents = [
    {
      eventType: "TENDER_CREATED" as const,
      localPayload: { eventType: "TENDER_CREATED", tenderId: tender1.id, title: tender1.title, department: tender1.department, category: tender1.category, procurementMethod: "Open Tender", estimatedBudget: 300000, currency: "USD", referenceNumber: "DDS-2025-CLOUD-001", recordedBy: "Procurement Officer", recordedAt: "2025-03-10T09:00:00Z" },
      status: "PENDING" as const,
    },
    {
      eventType: "AI_RANKING_GENERATED" as const,
      localPayload: { eventType: "AI_RANKING_GENERATED", tenderId: tender1.id, vendorIds: vendors1.map(v => v.id), vendorCount: vendors1.length, topVendorId: vendors1[0].id, topVendorName: "Nimbus Cloud Corp", evaluationHash: evalHash, scoringModelVersion: "v1.0", recordedBy: "ai-system", recordedAt: "2025-03-14T11:22:00Z" },
      status: "PENDING" as const,
    },
    {
      eventType: "HUMAN_DECISION_RECORDED" as const,
      localPayload: { eventType: "HUMAN_DECISION_RECORDED", tenderId: tender1.id, aiTopVendorId: vendors1[0].id, aiTopVendorName: "Nimbus Cloud Corp", selectedVendorId: vendors1[0].id, selectedVendorName: "Nimbus Cloud Corp", overrideUsed: false, decisionHash, recordedBy: "Procurement Officer", recordedAt: "2025-03-15T14:30:00Z" },
      status: "PENDING" as const,
    },
    {
      eventType: "DECISION_FINALIZED" as const,
      localPayload: { eventType: "DECISION_FINALIZED", tenderId: tender1.id, selectedVendorId: vendors1[0].id, selectedVendorName: "Nimbus Cloud Corp", aiTopVendorId: vendors1[0].id, aiTopVendorName: "Nimbus Cloud Corp", overrideUsed: false, decisionHash, recordedBy: "Procurement Officer", recordedAt: "2025-03-15T15:00:00Z" },
      status: "PENDING" as const,
    },
  ];

  for (const ev of auditEvents) {
    await prisma.hederaAuditEvent.create({
      data: { tenderId: tender1.id, ...ev, localPayload: ev.localPayload as object },
    });
  }

  // Tender 2: Override demo
  const tender2 = await prisma.tender.create({
    data: {
      title: "Cybersecurity Assessment & Penetration Testing",
      department: "Office of Information Security",
      category: "Security & Compliance",
      status: "FINALIZED",
      criteriaWeights: { price: 0.2, delivery: 0.15, experience: 0.35, compliance: 0.2, warranty: 0.1 },
      requiredCompliance: { iso27001: true, gdpr: false, soc2: false, localVendor: true },
      notes: "Annual security assessment. Vendor must have demonstrable government sector experience.",
    },
  });

  const vendors2 = await Promise.all([
    prisma.vendorProposal.create({ data: { tenderId: tender2.id, companyName: "SecureShield Partners", price: 95000, deliveryDays: 30, experienceScore: 9.5, complianceStatus: "FULL", warrantyScore: 8.0, proposalSummary: "Highest experience score. 15+ government security assessments. CREST certified." } }),
    prisma.vendorProposal.create({ data: { tenderId: tender2.id, companyName: "CyberProbe Inc", price: 72000, deliveryDays: 25, experienceScore: 7.0, complianceStatus: "FULL", warrantyScore: 7.5, proposalSummary: "Good value proposition. Certified team but less government-specific track record." } }),
    prisma.vendorProposal.create({ data: { tenderId: tender2.id, companyName: "GuardNet Solutions", price: 48000, deliveryDays: 20, experienceScore: 4.5, complianceStatus: "PARTIAL", warrantyScore: 5.5, proposalSummary: "Low cost, fast delivery, but limited compliance and experience in government context." } }),
  ]);

  const ranking2 = [
    { vendorId: vendors2[0].id, rank: 1, totalScore: 87.3, criterionScores: { price: 50, delivery: 50, experience: 100, compliance: 100, warranty: 78 } },
    { vendorId: vendors2[1].id, rank: 2, totalScore: 78.5, criterionScores: { price: 76, delivery: 67, experience: 70, compliance: 100, warranty: 72 } },
    { vendorId: vendors2[2].id, rank: 3, totalScore: 52.1, criterionScores: { price: 100, delivery: 100, experience: 30, compliance: 50, warranty: 40 } },
  ];
  const criterionScores2: Record<string, Record<string, number>> = {};
  ranking2.forEach(r => { criterionScores2[r.vendorId] = r.criterionScores; });

  const evalHash2 = sha256({ tenderId: tender2.id, ranking: ranking2, criterionScores: criterionScores2, reasoning: "SecureShield leads.", redFlags: [] });

  await prisma.aiEvaluation.create({
    data: {
      tenderId: tender2.id,
      ranking: ranking2 as object[],
      criterionScores: criterionScores2 as object,
      reasoning: "SecureShield Partners is the clear recommendation based on exceptional government experience (9.5/10) and full compliance. Despite higher cost, the 35% weight on experience heavily favors SecureShield. CyberProbe Inc. is a viable alternative at lower cost but with reduced government sector credibility. GuardNet Solutions carries compliance risk and insufficient experience for this sensitive engagement.",
      redFlags: [{ vendorId: vendors2[2].id, flag: "GuardNet Solutions has PARTIAL compliance and low experience score (4.5/10) — unsuitable for government security assessment without significant vetting.", severity: "HIGH" }],
      confidenceNotes: "High confidence. Experience scores are the dominant factor.",
      evaluationHash: evalHash2,
    },
  });

  const dHash2 = sha256({ tenderId: tender2.id, aiRecommendedVendorId: vendors2[0].id, selectedVendorId: vendors2[1].id, overrideUsed: true, overrideReason: "CyberProbe Inc. has an existing approved vendor relationship and demonstrated equivalent capability during informal evaluation. Budget constraints require the lower-cost option.", timestamp: new Date("2025-02-20T10:00:00Z").toISOString() });

  await prisma.procurementDecision.create({
    data: {
      tenderId: tender2.id,
      aiRecommendedVendorId: vendors2[0].id,
      selectedVendorId: vendors2[1].id,
      overrideUsed: true,
      overrideReason: "CyberProbe Inc. has an existing approved vendor relationship and demonstrated equivalent capability during informal evaluation. Budget constraints require the lower-cost option.",
      decisionHash: dHash2,
      finalizedAt: new Date("2025-02-20T11:30:00Z"),
    },
  });

  const auditEvents2 = [
    { eventType: "TENDER_CREATED" as const, localPayload: { eventType: "TENDER_CREATED", tenderId: tender2.id, title: tender2.title, department: tender2.department, category: tender2.category, procurementMethod: "Restricted Tender", estimatedBudget: 100000, currency: "USD", referenceNumber: "OIS-2025-SEC-002", recordedBy: "Security Officer", recordedAt: "2025-02-15T08:00:00Z" }, status: "PENDING" as const },
    { eventType: "AI_RANKING_GENERATED" as const, localPayload: { eventType: "AI_RANKING_GENERATED", tenderId: tender2.id, vendorIds: vendors2.map(v => v.id), vendorCount: vendors2.length, topVendorId: vendors2[0].id, topVendorName: "SecureShield Partners", evaluationHash: evalHash2, scoringModelVersion: "v1.0", recordedBy: "ai-system", recordedAt: "2025-02-18T14:00:00Z" }, status: "PENDING" as const },
    { eventType: "HUMAN_DECISION_RECORDED" as const, localPayload: { eventType: "HUMAN_DECISION_RECORDED", tenderId: tender2.id, aiTopVendorId: vendors2[0].id, aiTopVendorName: "SecureShield Partners", selectedVendorId: vendors2[1].id, selectedVendorName: "CyberProbe Inc", overrideUsed: true, overrideReason: "CyberProbe Inc. has an existing approved vendor relationship and demonstrated equivalent capability during informal evaluation. Budget constraints require the lower-cost option.", decisionHash: dHash2, recordedBy: "Procurement Officer", recordedAt: "2025-02-20T10:00:00Z" }, status: "PENDING" as const },
    { eventType: "DECISION_FINALIZED" as const, localPayload: { eventType: "DECISION_FINALIZED", tenderId: tender2.id, selectedVendorId: vendors2[1].id, selectedVendorName: "CyberProbe Inc", aiTopVendorId: vendors2[0].id, aiTopVendorName: "SecureShield Partners", overrideUsed: true, decisionHash: dHash2, recordedBy: "Chief Security Officer", recordedAt: "2025-02-20T11:30:00Z" }, status: "PENDING" as const },
  ];

  for (const ev of auditEvents2) {
    await prisma.hederaAuditEvent.create({
      data: { tenderId: tender2.id, ...ev, localPayload: ev.localPayload as object },
    });
  }

  // Tender 3: Active (in progress)
  const tender3 = await prisma.tender.create({
    data: {
      title: "Enterprise ERP System Replacement",
      department: "Ministry of Finance",
      category: "Software & SaaS",
      status: "OPEN",
      criteriaWeights: { price: 0.25, delivery: 0.1, experience: 0.3, compliance: 0.25, warranty: 0.1 },
      requiredCompliance: { iso27001: true, gdpr: true, soc2: true, localVendor: false },
      notes: "Full ERP replacement project. Multi-year support contract required.",
    },
  });

  await prisma.hederaAuditEvent.create({
    data: {
      tenderId: tender3.id,
      eventType: "TENDER_CREATED",
      localPayload: { eventType: "TENDER_CREATED", tenderId: tender3.id, title: tender3.title, department: tender3.department, category: tender3.category, recordedBy: "finance-admin", recordedAt: new Date().toISOString() } as object,
      status: "PENDING",
    },
  });

  console.log("✓ Seeded 3 tenders with full demo data");
  console.log(`  • ${tender1.id} — Cloud Infrastructure (FINALIZED, no override)`);
  console.log(`  • ${tender2.id} — Cybersecurity (FINALIZED, with override)`);
  console.log(`  • ${tender3.id} — ERP System (OPEN, in progress)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
