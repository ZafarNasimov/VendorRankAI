import { z } from "zod";

export const recordDecisionSchema = z.object({
  tenderId: z.string().min(1),
  selectedVendorId: z.string().min(1),
  overrideUsed: z.boolean(),
  overrideReason: z.string().max(1000).optional(),
  reviewerName: z.string().min(2).max(100).optional(),
});

export const finalizeDecisionSchema = z.object({
  tenderId: z.string().min(1),
  reviewerName: z.string().min(2).max(100),
});

export type RecordDecisionInput = z.infer<typeof recordDecisionSchema>;
export type FinalizeDecisionInput = z.infer<typeof finalizeDecisionSchema>;
