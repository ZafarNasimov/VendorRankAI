import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper";
import { TenderCard } from "@/components/tender/TenderCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TendersPage() {
  const tenders = await prisma.tender.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendors: { select: { id: true, companyName: true } },
      evaluation: { select: { id: true } },
      decision: { select: { id: true, finalizedAt: true } },
    },
  });

  return (
    <PageWrapper>
      <PageHeader
        title="Procurement Tenders"
        description="Manage vendor evaluations and procurement decisions"
        action={
          <Link href="/tenders/new">
            <Button>
              <Plus className="w-4 h-4" />
              New Tender
            </Button>
          </Link>
        }
      />

      {tenders.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No tenders yet"
          description="Create your first procurement tender to get started with AI-assisted vendor evaluation."
          action={
            <Link href="/tenders/new">
              <Button>
                <Plus className="w-4 h-4" />
                Create First Tender
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenders.map((tender) => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
