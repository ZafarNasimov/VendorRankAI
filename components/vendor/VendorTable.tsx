import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StatusChip } from "@/components/ui/StatusChip";
import type { VendorProposal, VendorRankEntry } from "@/types/tender";

interface VendorTableProps {
  vendors: VendorProposal[];
  ranking?: VendorRankEntry[];
  aiTopVendorId?: string;
  selectedVendorId?: string;
}

const COMPLIANCE_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  FULL: { label: "Full Compliance", variant: "success" },
  PARTIAL: { label: "Partial", variant: "warning" },
  NONE: { label: "None", variant: "danger" },
};

export function VendorTable({
  vendors,
  ranking,
  aiTopVendorId,
  selectedVendorId,
}: VendorTableProps) {
  const rankMap = new Map(ranking?.map((r) => [r.vendorId, r]));

  // Sort by rank if available
  const sorted = ranking
    ? [...vendors].sort((a, b) => {
        const ra = rankMap.get(a.id)?.rank ?? 99;
        const rb = rankMap.get(b.id)?.rank ?? 99;
        return ra - rb;
      })
    : vendors;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {ranking && (
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">
                Rank
              </th>
            )}
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Vendor
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Price
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Delivery
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Experience
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Compliance
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Warranty
            </th>
            {ranking && (
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Score
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((v) => {
            const rank = rankMap.get(v.id);
            const isTop = v.id === aiTopVendorId;
            const isSelected = v.id === selectedVendorId;

            return (
              <tr
                key={v.id}
                className={`transition-colors ${
                  isSelected
                    ? "bg-emerald-50"
                    : isTop
                    ? "bg-purple-50/50"
                    : "hover:bg-slate-50"
                }`}
              >
                {ranking && (
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold ${
                        rank?.rank === 1
                          ? "bg-purple-600 text-white"
                          : rank?.rank === 2
                          ? "bg-slate-700 text-white"
                          : rank?.rank === 3
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {rank?.rank ?? "—"}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div>
                      <span className="font-medium text-slate-800 block">
                        {v.companyName}
                      </span>
                      {(v.country || v.contactPerson) && (
                        <span className="text-xs text-slate-400">
                          {[v.country, v.contactPerson].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {isTop && <StatusChip type="ai-recommended" />}
                      {isSelected && <StatusChip type="selected" />}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {formatCurrency(v.price)}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {v.deliveryDays}d
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <ScoreBar
                      score={v.experienceScore * 10}
                      size="sm"
                      showValue={false}
                      className="w-16"
                    />
                    <span className="text-xs text-slate-500 w-8 text-right">
                      {v.experienceScore}/10
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={COMPLIANCE_BADGE[v.complianceStatus]?.variant ?? "default"}
                  >
                    {COMPLIANCE_BADGE[v.complianceStatus]?.label ?? v.complianceStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-center">
                    <ScoreBar
                      score={v.warrantyScore * 10}
                      size="sm"
                      showValue={false}
                      className="w-16"
                    />
                    <span className="text-xs text-slate-500 w-8 text-right">
                      {v.warrantyScore}/10
                    </span>
                  </div>
                </td>
                {ranking && (
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-sm font-bold ${
                        rank?.rank === 1 ? "text-purple-700" : "text-slate-700"
                      }`}
                    >
                      {rank?.totalScore ?? "—"}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
