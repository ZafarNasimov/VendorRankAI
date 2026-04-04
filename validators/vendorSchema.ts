import { z } from "zod";

export const createVendorSchema = z.object({
  tenderId: z.string().min(1),
  // Section A
  companyName: z.string().min(2).max(200),
  registrationNumber: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  contactPerson: z.string().max(150).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional(),
  taxId: z.string().max(100).optional(),
  // Section B
  price: z.number().positive(),
  currency: z.string().max(10).optional(),
  deliveryDays: z.number().int().positive(),
  paymentTermsOffered: z.string().max(200).optional(),
  discountTerms: z.string().max(200).optional(),
  offerValidityDays: z.number().int().positive().optional(),
  // Section C
  experienceScore: z.number().min(0).max(10),
  yearsInBusiness: z.number().int().min(0).optional(),
  similarProjectsCount: z.number().int().min(0).optional(),
  proposedTeamSize: z.number().int().min(1).optional(),
  keyPersonnelSummary: z.string().max(500).optional(),
  referenceClients: z.string().max(500).optional(),
  // Section D
  complianceStatus: z.enum(["FULL", "PARTIAL", "NONE"]),
  certificationsPresent: z.boolean().optional(),
  sanctionsDeclaration: z.boolean().optional(),
  conflictDeclaration: z.boolean().optional(),
  insurancePresent: z.boolean().optional(),
  financialStatementsAvailable: z.boolean().optional(),
  // Section E
  warrantyScore: z.number().min(0).max(10),
  meetsTechnicalRequirements: z.boolean().optional(),
  supportPeriodMonths: z.number().int().min(0).optional(),
  maintenanceIncluded: z.boolean().optional(),
  riskNotes: z.string().max(1000).optional(),
  proposalSummary: z.string().max(2000).optional(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
