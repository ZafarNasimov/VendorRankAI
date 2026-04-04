import { z } from "zod";

export const criteriaWeightsSchema = z.object({
  price: z.number().min(0).max(1),
  delivery: z.number().min(0).max(1),
  experience: z.number().min(0).max(1),
  compliance: z.number().min(0).max(1),
  warranty: z.number().min(0).max(1),
});

export const requiredComplianceSchema = z.object({
  iso27001: z.boolean(),
  gdpr: z.boolean(),
  soc2: z.boolean(),
  localVendor: z.boolean(),
});

export const createTenderSchema = z.object({
  // Section A
  title: z.string().min(3).max(200),
  referenceNumber: z.string().max(50).optional(),
  department: z.string().min(2).max(150),
  category: z.string().min(2).max(100),
  procurementMethod: z.string().optional(),
  description: z.string().max(2000).optional(),
  submissionDeadline: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  contractStartDate: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  contractEndDate: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  // Section B
  estimatedBudget: z.number().positive().optional(),
  currency: z.string().max(10).optional(),
  contractType: z.string().optional(),
  paymentTerms: z.string().max(200).optional(),
  bidBondRequired: z.boolean().optional(),
  performanceGuaranteeRequired: z.boolean().optional(),
  // Section C
  criteriaWeights: criteriaWeightsSchema,
  minimumPassingScore: z.number().min(0).max(100).optional(),
  // Section D
  requiredCompliance: requiredComplianceSchema,
  mandatoryCertifications: z.string().max(500).optional(),
  technicalRequirements: z.string().max(2000).optional(),
  deliverables: z.string().max(2000).optional(),
  // Section E
  conflictDeclarationRequired: z.boolean().optional(),
  sensitiveProcurement: z.boolean().optional(),
  multiReviewRequired: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
