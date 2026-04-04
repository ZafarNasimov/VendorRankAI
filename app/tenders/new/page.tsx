import { PageWrapper } from "@/components/layout/PageWrapper";
import { Breadcrumbs } from "@/components/layout/Header";
import { TenderForm } from "@/components/tender/TenderForm";

export default function NewTenderPage() {
  return (
    <PageWrapper className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Tenders", href: "/tenders" },
          { label: "New Tender" },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create Procurement Tender</h1>
        <p className="text-slate-500 mt-1">
          Complete all required sections below. Each tender is assigned a unique ID and
          logged to the Hedera Consensus Service upon submission.
        </p>
      </div>
      <TenderForm />
    </PageWrapper>
  );
}
