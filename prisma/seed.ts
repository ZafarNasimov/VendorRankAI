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

  // ─── TENDER 4: SCANDAL MODE — Suspicious Override Demo ──────────────────────
  // AI recommends Vendor A (clear winner). Human picks Vendor C (worst score,
  // partial compliance, higher price). System flags HIGH risk override.
  const scandalTender = await prisma.tender.create({
    data: {
      title: "National Health Portal Infrastructure — SCANDAL MODE DEMO",
      referenceNumber: "MOH-2025-INFRA-SCANDAL",
      department: "Ministry of Health",
      category: "Cloud & Infrastructure",
      procurementMethod: "Open Tender",
      description: "Procurement of cloud infrastructure for the national health portal. All vendors must hold ISO 27001 and GDPR compliance. This tender is flagged as sensitive procurement.",
      estimatedBudget: 1800000,
      currency: "USD",
      status: "DECIDED",
      sensitiveProcurement: true,
      conflictDeclarationRequired: true,
      multiReviewRequired: true,
      criteriaWeights: {
        price: 0.25,
        delivery: 0.15,
        experience: 0.3,
        compliance: 0.2,
        warranty: 0.1,
      },
      requiredCompliance: { iso27001: true, gdpr: true, soc2: true, localVendor: false },
      notes: "DEMO SCENARIO: Shows override risk detection when human selection contradicts strong AI recommendation. Vendor C selected despite being ranked last with compliance issues.",
    },
  });

  const scandalVendors = await Promise.all([
    // Vendor A — AI top pick: strong compliance, competitive price, high experience
    prisma.vendorProposal.create({
      data: {
        tenderId: scandalTender.id,
        companyName: "ClearPath Health Cloud",
        registrationNumber: "CPH-2021-UK-4421",
        country: "United Kingdom",
        price: 1450000,
        deliveryDays: 60,
        experienceScore: 9.2,
        yearsInBusiness: 14,
        similarProjectsCount: 11,
        complianceStatus: "FULL",
        certificationsPresent: true,
        sanctionsDeclaration: true,
        conflictDeclaration: true,
        insurancePresent: true,
        financialStatementsAvailable: true,
        warrantyScore: 8.8,
        meetsTechnicalRequirements: true,
        supportPeriodMonths: 36,
        maintenanceIncluded: true,
        proposalSummary: "ClearPath specializes in health sector cloud deployments with 11 completed national health portal projects. ISO 27001, SOC2 Type II, and GDPR-ready infrastructure. Dedicated health sector team of 45 engineers.",
      },
    }),
    // Vendor B — solid but ranked second
    prisma.vendorProposal.create({
      data: {
        tenderId: scandalTender.id,
        companyName: "MedCloud Systems",
        registrationNumber: "MCS-2019-DE-8832",
        country: "Germany",
        price: 1380000,
        deliveryDays: 75,
        experienceScore: 8.0,
        yearsInBusiness: 9,
        similarProjectsCount: 7,
        complianceStatus: "FULL",
        certificationsPresent: true,
        sanctionsDeclaration: true,
        conflictDeclaration: true,
        insurancePresent: true,
        financialStatementsAvailable: true,
        warrantyScore: 7.5,
        meetsTechnicalRequirements: true,
        supportPeriodMonths: 24,
        maintenanceIncluded: true,
        proposalSummary: "German-based health cloud provider with strong EU data residency guarantees. Good compliance posture. Slightly higher delivery timeline and less UK-specific experience than top vendor.",
      },
    }),
    // Vendor C — HUMAN SELECTION: last place, partial compliance, NO sanctions declaration, overpriced
    prisma.vendorProposal.create({
      data: {
        tenderId: scandalTender.id,
        companyName: "Meridian Digital Ltd",
        registrationNumber: "MDL-2023-SG-1102",
        country: "Singapore",
        price: 1750000,
        deliveryDays: 110,
        experienceScore: 4.5,
        yearsInBusiness: 3,
        similarProjectsCount: 1,
        complianceStatus: "PARTIAL",
        certificationsPresent: false,
        sanctionsDeclaration: false, // ← MISSING
        conflictDeclaration: false,  // ← MISSING
        insurancePresent: false,
        financialStatementsAvailable: false,
        warrantyScore: 4.0,
        meetsTechnicalRequirements: false,
        supportPeriodMonths: 6,
        maintenanceIncluded: false,
        riskNotes: "Company incorporated 2022. Only 1 comparable project on record (not in health sector). No sanctions declaration submitted. Partial compliance only. Highest bid price in the field.",
        proposalSummary: "Emerging provider with competitive future roadmap. Limited public sector track record. Proposes a novel architecture not previously validated in health sector deployments.",
      },
    }),
  ]);

  const scandalRanking = [
    { vendorId: scandalVendors[0].id, rank: 1, totalScore: 89.4, criterionScores: { price: 78, delivery: 85, experience: 96, compliance: 100, warranty: 90 } },
    { vendorId: scandalVendors[1].id, rank: 2, totalScore: 81.2, criterionScores: { price: 85, delivery: 68, experience: 82, compliance: 100, warranty: 74 } },
    { vendorId: scandalVendors[2].id, rank: 3, totalScore: 34.8, criterionScores: { price: 30, delivery: 20, experience: 32, compliance: 40, warranty: 32 } },
  ];
  const scandalCriterionScores: Record<string, Record<string, number>> = {};
  scandalRanking.forEach((r) => { scandalCriterionScores[r.vendorId] = r.criterionScores; });

  const scandalEvalReasonig = `**ClearPath Health Cloud** is the clear AI recommendation with a composite score of 89.4 — the highest in this evaluation by a substantial margin. With 14 years in operation, 11 completed national health portal deployments, and full ISO 27001/SOC2/GDPR compliance, ClearPath represents the lowest-risk, highest-capability option for this sensitive health infrastructure tender.

**MedCloud Systems** ranks second at 81.2 and would be a defensible choice. Strong compliance posture and competitive pricing offset the slightly lower experience score. However, the 75-day delivery timeline and less health-sector-specific track record place it behind ClearPath on the dominant experience criterion.

**Meridian Digital Ltd** ranks last with a score of 34.8 — a significant distance from the field average. Critical concerns include: (1) only PARTIAL compliance, with no certifications present; (2) missing sanctions and conflict-of-interest declarations; (3) highest bid price at $1,750,000 despite weakest capability; (4) only 3 years in operation with a single comparable project not in the health sector; and (5) explicit non-compliance with the technical requirements. Award to this vendor would represent a material procurement risk.

The procurement committee should note the significant score disparity between ranked 1 (89.4) and ranked 3 (34.8). Any selection of Meridian Digital Ltd over ClearPath Health Cloud would require exceptional justification, independent legal review, and enhanced oversight given the sensitive nature of this procurement.`;

  const scandalEvalHash = sha256({
    tenderId: scandalTender.id,
    ranking: scandalRanking,
    criterionScores: scandalCriterionScores,
    reasoning: scandalEvalReasonig,
    redFlags: [],
  });

  await prisma.aiEvaluation.create({
    data: {
      tenderId: scandalTender.id,
      ranking: scandalRanking as object[],
      criterionScores: scandalCriterionScores as object,
      reasoning: scandalEvalReasonig,
      vendorInsights: {
        [scandalVendors[0].id]: {
          strengths: ["14 years sector experience with 11 national health portal references", "Full ISO 27001, SOC2, and GDPR compliance — zero certification risk", "Lowest delivery timeline with included 36-month support", "Competitive pricing below budget ceiling"],
          weaknesses: ["Slightly higher price than Vendor B ($1.45M vs $1.38M)"],
          riskLevel: "LOW",
          summaryNote: "Clear evaluation winner. Strong across all weighted criteria. Recommended without qualification.",
        },
        [scandalVendors[1].id]: {
          strengths: ["Full compliance posture", "Strong EU data residency guarantees", "Competitive pricing"],
          weaknesses: ["Longer delivery timeline (75 days)", "Less health-sector-specific UK track record"],
          riskLevel: "LOW",
          summaryNote: "Solid second-place option. Good compliance and pricing but weaker on the dominant experience criterion.",
        },
        [scandalVendors[2].id]: {
          strengths: ["Novel architecture proposal"],
          weaknesses: ["Highest bid price ($1.75M) — 20% above top vendor", "Only 3 years in operation — unproven at scale", "PARTIAL compliance — missing mandatory certifications", "Missing sanctions and conflict-of-interest declarations", "Does NOT meet technical requirements", "Only 1 comparable project, not in health sector", "6-month support period — well below tender standard", "No financial statements provided"],
          riskLevel: "HIGH",
          summaryNote: "Last-place ranking with score of 34.8/100. Selection of this vendor over #1 requires exceptional justification.",
        },
      } as object,
      whyTopVendorWon: "ClearPath Health Cloud achieved the highest composite score (89.4/100) by combining the strongest experience profile (11 national health portal references, 14 years), full regulatory compliance (ISO 27001, SOC2, GDPR), the fastest delivery timeline, and competitive pricing at $1.45M — well below budget. No other vendor matched this combination across the heavily-weighted experience and compliance criteria.",
      redFlags: [
        { vendorId: scandalVendors[2].id, flag: "Meridian Digital Ltd has PARTIAL compliance only — ISO 27001, SOC2, and GDPR certifications not confirmed. Mandatory for health data infrastructure.", severity: "HIGH" },
        { vendorId: scandalVendors[2].id, flag: "Meridian Digital Ltd has not submitted a sanctions/debarment declaration. Required due diligence step is missing.", severity: "HIGH" },
        { vendorId: scandalVendors[2].id, flag: "Meridian Digital Ltd does NOT meet stated technical requirements. Award without a technical remediation plan would be non-compliant.", severity: "HIGH" },
        { vendorId: scandalVendors[2].id, flag: "Meridian Digital Ltd bid ($1,750,000) is 20.7% above the top vendor and $300,000 above the field average. No value justification provided.", severity: "MEDIUM" },
        { vendorId: scandalVendors[2].id, flag: "Meridian Digital Ltd: only 3 years in operation, 1 comparable project (not health sector), no financial statements. Viability risk is HIGH.", severity: "HIGH" },
      ] as object[],
      confidenceNotes: "High confidence. Data is complete. Score disparity between Vendor A and Vendor C is statistically significant (gap: 54.6 points). Independent review recommended before any override of this recommendation.",
      evaluationHash: scandalEvalHash,
    },
  });

  // Human selects LAST PLACE vendor — Scandal Mode triggers HIGH RISK
  const scandalDecisionHash = sha256({
    tenderId: scandalTender.id,
    aiRecommendedVendorId: scandalVendors[0].id,
    selectedVendorId: scandalVendors[2].id,
    overrideUsed: true,
    overrideReason: "Meridian Digital has a strategic partnership agreement under review. Selection pending commercial review.",
    timestamp: new Date("2025-04-01T09:00:00Z").toISOString(),
  });

  await prisma.procurementDecision.create({
    data: {
      tenderId: scandalTender.id,
      aiRecommendedVendorId: scandalVendors[0].id,
      selectedVendorId: scandalVendors[2].id,
      overrideUsed: true,
      overrideReason: "Meridian Digital has a strategic partnership agreement under review. Selection pending commercial review.",
      overrideRiskLevel: "HIGH",
      overrideRiskReasons: [
        "Selected vendor scored 54.6 points below AI recommendation (34.8 vs 89.4) — a critical gap.",
        "AI-recommended vendor is fully compliant while the selected vendor has PARTIAL compliance and no certifications.",
        "Selected vendor is $300,000 more expensive ($1,750,000 vs $1,450,000) despite a significantly lower evaluation score.",
        "Selected vendor does NOT meet stated technical requirements; AI-recommended vendor does.",
        "Selected vendor has not submitted a sanctions/debarment declaration.",
        "Selected vendor has only 3 years of operation vs 14 years for AI recommendation.",
      ] as object,
      scoreGap: 54.6,
      complianceGapSummary: "ClearPath Health Cloud (FULL compliance) → Meridian Digital Ltd (PARTIAL compliance, no certifications, missing declarations)",
      decisionHash: scandalDecisionHash,
    },
  });

  await prisma.hederaAuditEvent.create({
    data: {
      tenderId: scandalTender.id,
      eventType: "TENDER_CREATED",
      localPayload: { eventType: "TENDER_CREATED", tenderId: scandalTender.id, title: scandalTender.title, department: scandalTender.department, category: scandalTender.category, procurementMethod: "Open Tender", estimatedBudget: 1800000, currency: "USD", referenceNumber: "MOH-2025-INFRA-SCANDAL", recordedBy: "health-procurement-admin", recordedAt: "2025-03-01T09:00:00Z" } as object,
      status: "PENDING",
    },
  });
  await prisma.hederaAuditEvent.create({
    data: {
      tenderId: scandalTender.id,
      eventType: "AI_RANKING_GENERATED",
      localPayload: { eventType: "AI_RANKING_GENERATED", tenderId: scandalTender.id, vendorIds: scandalVendors.map(v => v.id), vendorCount: 3, topVendorId: scandalVendors[0].id, topVendorName: "ClearPath Health Cloud", evaluationHash: scandalEvalHash, scoringModelVersion: "v1.0", recordedBy: "ai-system", recordedAt: "2025-03-28T14:00:00Z" } as object,
      status: "PENDING",
    },
  });
  await prisma.hederaAuditEvent.create({
    data: {
      tenderId: scandalTender.id,
      eventType: "HUMAN_DECISION_RECORDED",
      localPayload: { eventType: "HUMAN_DECISION_RECORDED", tenderId: scandalTender.id, aiTopVendorId: scandalVendors[0].id, aiTopVendorName: "ClearPath Health Cloud", selectedVendorId: scandalVendors[2].id, selectedVendorName: "Meridian Digital Ltd", overrideUsed: true, overrideRiskLevel: "HIGH", scoreGap: 54.6, overrideReason: "Meridian Digital has a strategic partnership agreement under review.", decisionHash: scandalDecisionHash, recordedBy: "Director of Procurement", recordedAt: "2025-04-01T09:00:00Z" } as object,
      status: "PENDING",
    },
  });

  console.log("✓ Seeded 4 tenders with full demo data");
  console.log(`  • ${tender1.id} — Cloud Infrastructure (FINALIZED, no override)`);
  console.log(`  • ${tender2.id} — Cybersecurity (FINALIZED, with override)`);
  console.log(`  • ${tender3.id} — ERP System (OPEN, in progress)`);
  console.log(`  • ${scandalTender.id} — Health Portal SCANDAL MODE (DECIDED, HIGH RISK override)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
