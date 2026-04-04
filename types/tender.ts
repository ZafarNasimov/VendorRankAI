export interface CriteriaWeights {
  price: number;
  delivery: number;
  experience: number;
  compliance: number;
  warranty: number;
}

export interface RequiredCompliance {
  iso27001: boolean;
  gdpr: boolean;
  soc2: boolean;
  localVendor: boolean;
}

export type TenderStatus =
  | "DRAFT"
  | "OPEN"
  | "EVALUATED"
  | "DECIDED"
  | "FINALIZED";

export interface Tender {
  id: string;
  title: string;
  referenceNumber?: string | null;
  department: string;
  category: string;
  procurementMethod?: string | null;
  description?: string | null;
  submissionDeadline?: Date | string | null;
  contractStartDate?: Date | string | null;
  contractEndDate?: Date | string | null;
  estimatedBudget?: number | null;
  currency?: string | null;
  contractType?: string | null;
  paymentTerms?: string | null;
  bidBondRequired?: boolean;
  performanceGuaranteeRequired?: boolean;
  criteriaWeights: CriteriaWeights;
  minimumPassingScore?: number | null;
  requiredCompliance: RequiredCompliance;
  mandatoryCertifications?: string | null;
  technicalRequirements?: string | null;
  deliverables?: string | null;
  conflictDeclarationRequired?: boolean;
  sensitiveProcurement?: boolean;
  multiReviewRequired?: boolean;
  notes?: string | null;
  status: TenderStatus;
  hcsTopicId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  vendors?: VendorProposal[];
  evaluation?: AiEvaluation | null;
  decision?: ProcurementDecision | null;
}

export interface VendorProposal {
  id: string;
  tenderId: string;
  // Section A
  companyName: string;
  registrationNumber?: string | null;
  country?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  taxId?: string | null;
  // Section B
  price: number;
  currency?: string | null;
  deliveryDays: number;
  paymentTermsOffered?: string | null;
  discountTerms?: string | null;
  offerValidityDays?: number | null;
  // Section C
  experienceScore: number;
  yearsInBusiness?: number | null;
  similarProjectsCount?: number | null;
  proposedTeamSize?: number | null;
  keyPersonnelSummary?: string | null;
  referenceClients?: string | null;
  // Section D
  complianceStatus: "FULL" | "PARTIAL" | "NONE";
  certificationsPresent?: boolean;
  sanctionsDeclaration?: boolean;
  conflictDeclaration?: boolean;
  insurancePresent?: boolean;
  financialStatementsAvailable?: boolean;
  // Section E
  warrantyScore: number;
  meetsTechnicalRequirements?: boolean;
  supportPeriodMonths?: number | null;
  maintenanceIncluded?: boolean;
  riskNotes?: string | null;
  proposalSummary?: string | null;
  createdAt: Date | string;
}

export interface VendorRankEntry {
  vendorId: string;
  rank: number;
  totalScore: number;
  criterionScores: Record<string, number>;
}

export interface RedFlag {
  vendorId: string;
  flag: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface AiEvaluation {
  id: string;
  tenderId: string;
  ranking: VendorRankEntry[];
  criterionScores: Record<string, Record<string, number>>;
  reasoning: string;
  redFlags: RedFlag[];
  confidenceNotes?: string | null;
  evaluationHash: string;
  createdAt: Date | string;
}

export interface ProcurementDecision {
  id: string;
  tenderId: string;
  aiRecommendedVendorId: string;
  selectedVendorId: string;
  overrideUsed: boolean;
  overrideReason?: string | null;
  decisionHash: string;
  finalizedAt?: Date | string | null;
  createdAt: Date | string;
  aiRecommendedVendor?: VendorProposal;
  selectedVendor?: VendorProposal;
}
