import type { VendorProposal, CriteriaWeights, VendorRankEntry } from "@/types/tender";

interface ScoredVendor {
  vendorId: string;
  companyName: string;
  scores: {
    price: number;
    delivery: number;
    experience: number;
    compliance: number;
    warranty: number;
  };
  totalScore: number;
}

// Normalize a value so that lowest cost → highest score
function normalizeInverse(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.round(((max - value) / (max - min)) * 100);
}

// Normalize a value so that highest → highest score
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.round(((value - min) / (max - min)) * 100);
}

const COMPLIANCE_SCORE: Record<string, number> = {
  FULL: 100,
  PARTIAL: 50,
  NONE: 0,
};

export function scoreVendors(
  vendors: VendorProposal[],
  weights: CriteriaWeights
): { scored: ScoredVendor[]; ranking: VendorRankEntry[] } {
  if (vendors.length === 0) return { scored: [], ranking: [] };

  const prices = vendors.map((v) => v.price);
  const deliveries = vendors.map((v) => v.deliveryDays);
  const experiences = vendors.map((v) => v.experienceScore);
  const warranties = vendors.map((v) => v.warrantyScore);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDelivery = Math.min(...deliveries);
  const maxDelivery = Math.max(...deliveries);
  const minExp = Math.min(...experiences);
  const maxExp = Math.max(...experiences);
  const minWarranty = Math.min(...warranties);
  const maxWarranty = Math.max(...warranties);

  const scored: ScoredVendor[] = vendors.map((v) => {
    const scores = {
      price: normalizeInverse(v.price, minPrice, maxPrice),
      delivery: normalizeInverse(v.deliveryDays, minDelivery, maxDelivery),
      experience: normalize(v.experienceScore, minExp, maxExp),
      compliance: COMPLIANCE_SCORE[v.complianceStatus] ?? 0,
      warranty: normalize(v.warrantyScore, minWarranty, maxWarranty),
    };

    const totalScore =
      scores.price * weights.price +
      scores.delivery * weights.delivery +
      scores.experience * weights.experience +
      scores.compliance * weights.compliance +
      scores.warranty * weights.warranty;

    return {
      vendorId: v.id,
      companyName: v.companyName,
      scores,
      totalScore: Math.round(totalScore * 10) / 10,
    };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);

  const ranking: VendorRankEntry[] = scored.map((s, idx) => ({
    vendorId: s.vendorId,
    rank: idx + 1,
    totalScore: s.totalScore,
    criterionScores: s.scores,
  }));

  return { scored, ranking };
}
