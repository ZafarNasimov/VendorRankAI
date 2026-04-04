"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Breadcrumbs } from "@/components/layout/Header";
import { VendorForm } from "@/components/vendor/VendorForm";
import { VendorTable } from "@/components/vendor/VendorTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, ArrowRight } from "lucide-react";
import type { VendorProposal } from "@/types/tender";

export default function VendorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorProposal[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadVendors() {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendors?tenderId=${id}`);
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, [id]);

  const canProceed = vendors.length >= 2;

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: "Tenders", href: "/tenders" },
          { label: "Tender", href: `/tenders/${id}` },
          { label: "Vendors" },
        ]}
      />

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Proposals</h1>
          <p className="text-slate-500 mt-1">
            Add 2–5 vendor proposals. You need at least 2 to run the AI
            evaluation.
          </p>
        </div>
        {canProceed && (
          <Button
            size="lg"
            onClick={() => router.push(`/tenders/${id}/evaluate`)}
          >
            Run AI Evaluation <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
        ) : vendors.length > 0 ? (
          <Card>
            <VendorTable vendors={vendors} />
          </Card>
        ) : (
          <EmptyState
            icon={Users}
            title="No vendors yet"
            description="Add at least 2 vendor proposals to proceed with AI evaluation."
          />
        )}

        {vendors.length < 5 && (
          <VendorForm tenderId={id} onAdded={loadVendors} />
        )}

        {vendors.length >= 5 && (
          <p className="text-sm text-center text-slate-400">
            Maximum of 5 vendors reached.
          </p>
        )}

        {canProceed && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => router.push(`/tenders/${id}/evaluate`)}
            >
              Continue to AI Evaluation <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
