"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { DocumentUpload } from "@/components/vendor/DocumentUpload";
import type { FlatVendorDraft } from "@/components/vendor/DocumentUpload";
import {
  Plus,
  Building2,
  DollarSign,
  Award,
  ShieldCheck,
  Settings2,
  ChevronLeft,
  ChevronRight,
  X,
  FileUp,
  Zap,
  Unlock,
} from "lucide-react";

// ─── AI extraction field indicator ────────────────────────────────────────────

// Fields that are considered "AI-owned" when extracted from documents
const AI_LOCKABLE_FIELDS = new Set([
  "warrantyScore", "proposalSummary", "meetsTechnicalRequirements",
]);

function AiExtractedBadge({
  fieldKey,
  aiExtracted,
  overridden,
  onOverride,
}: {
  fieldKey: string;
  aiExtracted: Set<string>;
  overridden: Set<string>;
  onOverride: (key: string) => void;
}) {
  if (!aiExtracted.has(fieldKey)) return null;
  if (overridden.has(fieldKey)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
        <Unlock className="w-3 h-3" /> Overriding AI extraction
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
      <Zap className="w-3 h-3" />
      AI extracted
      <button
        type="button"
        onClick={() => onOverride(fieldKey)}
        className="text-purple-500 hover:text-purple-700 underline ml-0.5"
      >
        Override
      </button>
    </span>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"];
const COUNTRIES = [
  "United States", "United Kingdom", "Germany", "France", "Singapore",
  "UAE", "Canada", "Australia", "India", "Japan", "Other",
];

const SECTIONS = [
  { id: "A", label: "Identity",    Icon: Building2,   desc: "Company & contact" },
  { id: "B", label: "Commercial",  Icon: DollarSign,  desc: "Pricing & terms" },
  { id: "C", label: "Capability",  Icon: Award,       desc: "Experience & team" },
  { id: "D", label: "Compliance",  Icon: ShieldCheck, desc: "Legal & certificates" },
  { id: "E", label: "Technical",   Icon: Settings2,   desc: "Fit & proposal" },
];

const DEFAULT_FORM = {
  // A
  companyName: "", registrationNumber: "", country: "", address: "",
  contactPerson: "", contactEmail: "", contactPhone: "", taxId: "",
  // B
  price: "", currency: "USD", deliveryDays: "",
  paymentTermsOffered: "", discountTerms: "", offerValidityDays: "",
  // C
  experienceScore: "7", yearsInBusiness: "", similarProjectsCount: "",
  proposedTeamSize: "", keyPersonnelSummary: "", referenceClients: "",
  // D
  complianceStatus: "FULL" as "FULL" | "PARTIAL" | "NONE",
  certificationsPresent: false, sanctionsDeclaration: false,
  conflictDeclaration: false, insurancePresent: false,
  financialStatementsAvailable: false,
  // E
  warrantyScore: "7", meetsTechnicalRequirements: false,
  supportPeriodMonths: "", maintenanceIncluded: false,
  riskNotes: "", proposalSummary: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
const SELECT = `${INPUT} appearance-none`;
const TEXTAREA = `${INPUT} resize-none`;

function Field({ label, required, hint, children, className = "" }: {
  label: string; required?: boolean; hint?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
      checked ? "bg-blue-50 border-blue-200" : "border-slate-200 hover:bg-slate-50"
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
    </label>
  );
}

function ScoreSelector({ label, hint, value, onChange, locked = false }: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; locked?: boolean;
}) {
  const num = parseFloat(value) || 0;
  return (
    <Field label={label} hint={hint}>
      <div className={`flex items-center gap-3 ${locked ? "opacity-60 pointer-events-none select-none" : ""}`}>
        <div className="flex items-center gap-1 w-20">
          <input
            type="number" min="0" max="10" step="0.5"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={locked}
            className="w-14 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <span className="text-sm text-slate-500">/10</span>
        </div>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${num >= 8 ? "bg-emerald-500" : num >= 5 ? "bg-amber-500" : "bg-red-400"}`}
          style={{ width: `${num * 10}%` }}
        />
      </div>
    </Field>
  );
}

/** Compute an experience score (0–10) from three raw inputs */
function computeExperienceScore(
  yearsInBusiness: string,
  similarProjectsCount: string,
  proposedTeamSize: string
): number {
  const years = parseInt(yearsInBusiness) || 0;
  const projects = parseInt(similarProjectsCount) || 0;
  const team = parseInt(proposedTeamSize) || 0;

  // Years: 0=0pts, 1-2=1, 3-5=2, 6-10=3, 11-20=4, 20+=5  (max 5)
  const yearPts =
    years === 0 ? 0 :
    years <= 2  ? 1 :
    years <= 5  ? 2 :
    years <= 10 ? 3 :
    years <= 20 ? 4 : 5;

  // Projects: 0=0, 1-2=1, 3-5=2, 6-10=3, 11+=3  (max 3)
  const projectPts =
    projects === 0 ? 0 :
    projects <= 2  ? 1 :
    projects <= 5  ? 2 : 3;

  // Team size: 0=0, 1-3=0.5, 4-10=1, 11-20=1.5, 21+=2  (max 2)
  const teamPts =
    team === 0  ? 0  :
    team <= 3   ? 0.5 :
    team <= 10  ? 1  :
    team <= 20  ? 1.5 : 2;

  return Math.min(10, Math.round((yearPts + projectPts + teamPts) * 10) / 10);
}

function ExperienceBar({ yearsInBusiness, similarProjectsCount, proposedTeamSize }: {
  yearsInBusiness: string;
  similarProjectsCount: string;
  proposedTeamSize: string;
}) {
  const score = computeExperienceScore(yearsInBusiness, similarProjectsCount, proposedTeamSize);
  const hasAnyInput = yearsInBusiness || similarProjectsCount || proposedTeamSize;

  const color = score >= 8 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-red-400";
  const label = score >= 8 ? "Strong" : score >= 5 ? "Moderate" : score > 0 ? "Limited" : "—";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Computed from inputs below</span>
        {hasAnyInput && (
          <span className={`text-sm font-semibold ${score >= 8 ? "text-emerald-600" : score >= 5 ? "text-amber-600" : "text-red-500"}`}>
            {score.toFixed(1)} / 10 · {label}
          </span>
        )}
        {!hasAnyInput && (
          <span className="text-sm text-slate-400">Fill in fields below</span>
        )}
      </div>
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
        <div className="flex flex-col items-center gap-1">
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all"
              style={{ width: `${Math.min(100, (parseInt(yearsInBusiness) || 0) / 20 * 100)}%` }} />
          </div>
          <span>Years in Business</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all"
              style={{ width: `${Math.min(100, (parseInt(similarProjectsCount) || 0) / 10 * 100)}%` }} />
          </div>
          <span>Similar Projects</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-400 transition-all"
              style={{ width: `${Math.min(100, (parseInt(proposedTeamSize) || 0) / 20 * 100)}%` }} />
          </div>
          <span>Team Size</span>
        </div>
      </div>
    </div>
  );
}

/** Derive compliance status from the 5 toggle checkboxes */
function deriveComplianceStatus(
  certificationsPresent: boolean,
  sanctionsDeclaration: boolean,
  conflictDeclaration: boolean,
  insurancePresent: boolean,
  financialStatementsAvailable: boolean
): "FULL" | "PARTIAL" | "NONE" {
  const count = [certificationsPresent, sanctionsDeclaration, conflictDeclaration, insurancePresent, financialStatementsAvailable]
    .filter(Boolean).length;
  if (count === 5) return "FULL";
  if (count >= 1) return "PARTIAL";
  return "NONE";
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface VendorFormProps {
  tenderId: string;
  onAdded: () => void;
}

export function VendorForm({ tenderId, onAdded }: VendorFormProps) {
  const [open, setOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [section, setSection] = useState(0); // 0–4
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  // Track which fields were populated by AI document extraction
  const [aiExtracted, setAiExtracted] = useState<Set<string>>(new Set());
  const [overridden, setOverridden] = useState<Set<string>>(new Set());

  function handleOverride(fieldKey: string) {
    setOverridden((prev) => new Set([...prev, fieldKey]));
  }

  function isFieldLocked(fieldKey: string) {
    return AI_LOCKABLE_FIELDS.has(fieldKey) && aiExtracted.has(fieldKey) && !overridden.has(fieldKey);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Auto-compute experience score from contributing inputs
      if (key === "yearsInBusiness" || key === "similarProjectsCount" || key === "proposedTeamSize") {
        next.experienceScore = String(computeExperienceScore(
          key === "yearsInBusiness" ? String(value) : next.yearsInBusiness,
          key === "similarProjectsCount" ? String(value) : next.similarProjectsCount,
          key === "proposedTeamSize" ? String(value) : next.proposedTeamSize,
        ));
      }
      // Auto-compute compliance status from checkboxes
      if (["certificationsPresent","sanctionsDeclaration","conflictDeclaration","insurancePresent","financialStatementsAvailable"].includes(key)) {
        next.complianceStatus = deriveComplianceStatus(
          key === "certificationsPresent" ? Boolean(value) : next.certificationsPresent,
          key === "sanctionsDeclaration" ? Boolean(value) : next.sanctionsDeclaration,
          key === "conflictDeclaration" ? Boolean(value) : next.conflictDeclaration,
          key === "insurancePresent" ? Boolean(value) : next.insurancePresent,
          key === "financialStatementsAvailable" ? Boolean(value) : next.financialStatementsAvailable,
        );
      }
      return next;
    });
  }

  function applyAutofill(draft: FlatVendorDraft) {
    // Track which AI-lockable fields were extracted
    const extracted = new Set<string>();
    for (const field of AI_LOCKABLE_FIELDS) {
      if (draft[field as keyof FlatVendorDraft] !== undefined) {
        extracted.add(field);
      }
    }
    setAiExtracted(extracted);
    setOverridden(new Set()); // reset overrides on new extraction

    setForm((f) => {
      const next = {
        ...f,
        ...(draft.companyName        !== undefined && { companyName: draft.companyName }),
        ...(draft.registrationNumber !== undefined && { registrationNumber: draft.registrationNumber }),
        ...(draft.country            !== undefined && { country: draft.country }),
        ...(draft.address            !== undefined && { address: draft.address }),
        ...(draft.contactPerson      !== undefined && { contactPerson: draft.contactPerson }),
        ...(draft.contactEmail       !== undefined && { contactEmail: draft.contactEmail }),
        ...(draft.contactPhone       !== undefined && { contactPhone: draft.contactPhone }),
        ...(draft.taxId              !== undefined && { taxId: draft.taxId }),
        ...(draft.price              !== undefined && { price: draft.price }),
        ...(draft.currency           !== undefined && { currency: draft.currency }),
        ...(draft.deliveryDays       !== undefined && { deliveryDays: draft.deliveryDays }),
        ...(draft.paymentTermsOffered !== undefined && { paymentTermsOffered: draft.paymentTermsOffered }),
        ...(draft.discountTerms      !== undefined && { discountTerms: draft.discountTerms }),
        ...(draft.offerValidityDays  !== undefined && { offerValidityDays: draft.offerValidityDays }),
        ...(draft.yearsInBusiness    !== undefined && { yearsInBusiness: draft.yearsInBusiness }),
        ...(draft.similarProjectsCount !== undefined && { similarProjectsCount: draft.similarProjectsCount }),
        ...(draft.proposedTeamSize   !== undefined && { proposedTeamSize: draft.proposedTeamSize }),
        ...(draft.keyPersonnelSummary !== undefined && { keyPersonnelSummary: draft.keyPersonnelSummary }),
        ...(draft.referenceClients   !== undefined && { referenceClients: draft.referenceClients }),
        ...(draft.warrantyScore      !== undefined && { warrantyScore: draft.warrantyScore }),
        ...(draft.supportPeriodMonths !== undefined && { supportPeriodMonths: draft.supportPeriodMonths }),
        ...(draft.riskNotes          !== undefined && { riskNotes: draft.riskNotes }),
        ...(draft.proposalSummary    !== undefined && { proposalSummary: draft.proposalSummary }),
      };
      // Recompute experience score from extracted inputs (ignore AI-extracted raw score)
      next.experienceScore = String(computeExperienceScore(
        next.yearsInBusiness, next.similarProjectsCount, next.proposedTeamSize
      ));
      // Recompute compliance status from extracted compliance status hint
      // (AI-extracted complianceStatus is used as a hint to set checkboxes, then derived)
      if (draft.complianceStatus === "FULL") {
        next.certificationsPresent = true;
        next.sanctionsDeclaration = true;
        next.conflictDeclaration = true;
        next.insurancePresent = true;
        next.financialStatementsAvailable = true;
      } else if (draft.complianceStatus === "PARTIAL") {
        next.certificationsPresent = true;
      }
      next.complianceStatus = deriveComplianceStatus(
        next.certificationsPresent,
        next.sanctionsDeclaration,
        next.conflictDeclaration,
        next.insurancePresent,
        next.financialStatementsAvailable,
      );
      return next;
    });
    setShowUpload(false);
    setOpen(true);
    setSection(0);
  }

  function close() {
    setOpen(false);
    setShowUpload(false);
    setSection(0);
    setForm({ ...DEFAULT_FORM });
    setAiExtracted(new Set());
    setOverridden(new Set());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        tenderId,
        companyName: form.companyName,
        registrationNumber: form.registrationNumber || undefined,
        country: form.country || undefined,
        address: form.address || undefined,
        contactPerson: form.contactPerson || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        taxId: form.taxId || undefined,
        price: parseFloat(form.price),
        currency: form.currency,
        deliveryDays: parseInt(form.deliveryDays),
        paymentTermsOffered: form.paymentTermsOffered || undefined,
        discountTerms: form.discountTerms || undefined,
        offerValidityDays: form.offerValidityDays ? parseInt(form.offerValidityDays) : undefined,
        experienceScore: parseFloat(form.experienceScore),
        yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness) : undefined,
        similarProjectsCount: form.similarProjectsCount ? parseInt(form.similarProjectsCount) : undefined,
        proposedTeamSize: form.proposedTeamSize ? parseInt(form.proposedTeamSize) : undefined,
        keyPersonnelSummary: form.keyPersonnelSummary || undefined,
        referenceClients: form.referenceClients || undefined,
        complianceStatus: form.complianceStatus,
        certificationsPresent: form.certificationsPresent,
        sanctionsDeclaration: form.sanctionsDeclaration,
        conflictDeclaration: form.conflictDeclaration,
        insurancePresent: form.insurancePresent,
        financialStatementsAvailable: form.financialStatementsAvailable,
        warrantyScore: parseFloat(form.warrantyScore),
        meetsTechnicalRequirements: form.meetsTechnicalRequirements,
        supportPeriodMonths: form.supportPeriodMonths ? parseInt(form.supportPeriodMonths) : undefined,
        maintenanceIncluded: form.maintenanceIncluded,
        riskNotes: form.riskNotes || undefined,
        proposalSummary: form.proposalSummary || undefined,
      };

      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? JSON.stringify(err.error));
      }

      toast.success(`${form.companyName} added`);
      close();
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setLoading(false);
    }
  }

  // ── Upload / autofill panel (shown before the form) ─────────────────────────
  if (showUpload) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Upload Proposal Document</p>
          <button
            onClick={() => setShowUpload(false)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
        <DocumentUpload onAutofill={applyAutofill} />
        <p className="text-xs text-center text-slate-400">
          Or{" "}
          <button
            className="text-blue-600 hover:underline"
            onClick={() => { setShowUpload(false); setOpen(true); }}
          >
            fill in the form manually
          </button>
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex gap-3">
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="flex-1 border-dashed"
        >
          <Plus className="w-4 h-4" />
          Add Vendor Manually
        </Button>
        <Button
          onClick={() => setShowUpload(true)}
          variant="outline"
          className="flex-1 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
        >
          <FileUp className="w-4 h-4" />
          Upload &amp; Autofill
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-blue-200 shadow-md">
      {/* Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">New Vendor Proposal</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {form.companyName || "Complete all sections to register this vendor"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { close(); setShowUpload(true); }}
              className="hidden sm:flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <FileUp className="w-3.5 h-3.5" /> Upload doc
            </button>
            <button
              type="button"
              onClick={close}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {SECTIONS.map(({ id, label, Icon }, idx) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                section === idx
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardBody className="space-y-4">

          {/* ── Section A: Supplier Identity ── */}
          {section === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Section A — Supplier Identity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Company Legal Name" required className="md:col-span-2">
                  <input
                    required type="text" value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    className={INPUT} placeholder="e.g. Acme Cloud Solutions Ltd."
                  />
                </Field>

                <Field label="Company Registration Number">
                  <input
                    type="text" value={form.registrationNumber}
                    onChange={(e) => set("registrationNumber", e.target.value)}
                    className={INPUT} placeholder="e.g. 12345678"
                  />
                </Field>

                <Field label="Country of Registration">
                  <select
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    className={SELECT}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>

                <Field label="Registered Address" className="md:col-span-2">
                  <input
                    type="text" value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    className={INPUT} placeholder="Street, City, Country"
                  />
                </Field>

                <Field label="Contact Person">
                  <input
                    type="text" value={form.contactPerson}
                    onChange={(e) => set("contactPerson", e.target.value)}
                    className={INPUT} placeholder="Full name"
                  />
                </Field>

                <Field label="Tax / VAT ID">
                  <input
                    type="text" value={form.taxId}
                    onChange={(e) => set("taxId", e.target.value)}
                    className={INPUT} placeholder="e.g. GB123456789"
                  />
                </Field>

                <Field label="Contact Email">
                  <input
                    type="email" value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    className={INPUT} placeholder="procurement@vendor.com"
                  />
                </Field>

                <Field label="Contact Phone">
                  <input
                    type="tel" value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    className={INPUT} placeholder="+1 555 000 0000"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── Section B: Commercial Offer ── */}
          {section === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Section B — Commercial Offer</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Bid Price" required hint="Total contract value for this proposal">
                  <div className="flex gap-2">
                    <select
                      value={form.currency}
                      onChange={(e) => set("currency", e.target.value)}
                      className="w-24 border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input
                      required type="number" min="0" step="1000"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      className={`${INPUT} flex-1`} placeholder="250000"
                    />
                  </div>
                </Field>

                <Field label="Delivery Timeline" required hint="Calendar days from contract award to completion">
                  <div className="flex items-center gap-2">
                    <input
                      required type="number" min="1"
                      value={form.deliveryDays}
                      onChange={(e) => set("deliveryDays", e.target.value)}
                      className={INPUT} placeholder="90"
                    />
                    <span className="text-sm text-slate-500 whitespace-nowrap">days</span>
                  </div>
                </Field>

                <Field label="Payment Terms Offered" hint="e.g. Net 30, milestone-based">
                  <input
                    type="text" value={form.paymentTermsOffered}
                    onChange={(e) => set("paymentTermsOffered", e.target.value)}
                    className={INPUT} placeholder="e.g. Net 30 days from invoice"
                  />
                </Field>

                <Field label="Offer Validity" hint="How many days this bid remains valid">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="1" value={form.offerValidityDays}
                      onChange={(e) => set("offerValidityDays", e.target.value)}
                      className={INPUT} placeholder="90"
                    />
                    <span className="text-sm text-slate-500 whitespace-nowrap">days</span>
                  </div>
                </Field>

                <Field label="Discount Terms" className="md:col-span-2" hint="Any volume discounts, early payment discounts, etc.">
                  <input
                    type="text" value={form.discountTerms}
                    onChange={(e) => set("discountTerms", e.target.value)}
                    className={INPUT} placeholder="e.g. 5% discount for 2-year contract"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── Section C: Capability & Experience ── */}
          {section === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Section C — Capability &amp; Experience</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Experience Score <span className="text-xs text-slate-400 font-normal">(used in AI evaluation)</span></span>
                  <AiExtractedBadge fieldKey="experienceScore" aiExtracted={aiExtracted} overridden={overridden} onOverride={handleOverride} />
                </div>
                <ExperienceBar
                  yearsInBusiness={form.yearsInBusiness}
                  similarProjectsCount={form.similarProjectsCount}
                  proposedTeamSize={form.proposedTeamSize}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Years in Business">
                  <input
                    type="number" min="0" value={form.yearsInBusiness}
                    onChange={(e) => set("yearsInBusiness", e.target.value)}
                    className={INPUT} placeholder="e.g. 12"
                  />
                </Field>

                <Field label="Similar Projects Completed">
                  <input
                    type="number" min="0" value={form.similarProjectsCount}
                    onChange={(e) => set("similarProjectsCount", e.target.value)}
                    className={INPUT} placeholder="e.g. 8"
                  />
                </Field>

                <Field label="Proposed Team Size">
                  <input
                    type="number" min="1" value={form.proposedTeamSize}
                    onChange={(e) => set("proposedTeamSize", e.target.value)}
                    className={INPUT} placeholder="e.g. 5"
                  />
                </Field>
              </div>

              <Field label="Key Personnel Summary" hint="Names and roles of the proposed delivery team">
                <textarea
                  rows={2} value={form.keyPersonnelSummary}
                  onChange={(e) => set("keyPersonnelSummary", e.target.value)}
                  className={TEXTAREA}
                  placeholder="e.g. Jane Smith (Project Manager, PMP), John Lee (Lead Architect, 10 yrs)..."
                />
              </Field>

              <Field label="Reference Clients" hint="Relevant past clients or projects in this sector">
                <textarea
                  rows={2} value={form.referenceClients}
                  onChange={(e) => set("referenceClients", e.target.value)}
                  className={TEXTAREA}
                  placeholder="e.g. Ministry of Health (2023), City of Dublin (2022)..."
                />
              </Field>
            </div>
          )}

          {/* ── Section D: Compliance & Legal ── */}
          {section === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Section D — Compliance &amp; Legal</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">Overall Compliance Status <span className="text-xs text-slate-400 font-normal">(derived from boxes below)</span></p>
                </div>
                <div className="flex gap-3 pointer-events-none select-none">
                  {(["FULL", "PARTIAL", "NONE"] as const).map((s) => (
                    <div
                      key={s}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium flex-1 justify-center transition-colors ${
                        form.complianceStatus === s
                          ? s === "FULL" ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : s === "PARTIAL" ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {s === "FULL" ? "Compliant" : s === "PARTIAL" ? "Partially Compliant" : "Non-Compliant"}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle
                  checked={form.certificationsPresent}
                  onChange={(v) => set("certificationsPresent", v)}
                  label="Required Certifications Present"
                  desc="All mandatory certifications are held and current"
                />
                <Toggle
                  checked={form.sanctionsDeclaration}
                  onChange={(v) => set("sanctionsDeclaration", v)}
                  label="Sanctions/Debarment Declaration Signed"
                  desc="Confirms no active sanctions or debarment orders"
                />
                <Toggle
                  checked={form.conflictDeclaration}
                  onChange={(v) => set("conflictDeclaration", v)}
                  label="Conflict-of-Interest Declaration Signed"
                  desc="No conflict of interest declared by the vendor"
                />
                <Toggle
                  checked={form.insurancePresent}
                  onChange={(v) => set("insurancePresent", v)}
                  label="Insurance Coverage Confirmed"
                  desc="Adequate professional/liability insurance in place"
                />
                <Toggle
                  checked={form.financialStatementsAvailable}
                  onChange={(v) => set("financialStatementsAvailable", v)}
                  label="Financial Statements Available"
                  desc="Audited financials provided for last 2+ years"
                />
              </div>
            </div>
          )}

          {/* ── Section E: Technical Fit & Proposal ── */}
          {section === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Section E — Technical Fit &amp; Proposal</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">Support & Warranty Score (used in AI evaluation)</span>
                  <AiExtractedBadge fieldKey="warrantyScore" aiExtracted={aiExtracted} overridden={overridden} onOverride={handleOverride} />
                </div>
                <ScoreSelector
                  label=""
                  hint="Rate the quality of post-delivery support and warranty offering (0 = poor, 10 = excellent)"
                  value={form.warrantyScore}
                  onChange={(v) => !isFieldLocked("warrantyScore") && set("warrantyScore", v)}
                  locked={isFieldLocked("warrantyScore")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Support Period" hint="Duration of included support post-delivery">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" value={form.supportPeriodMonths}
                      onChange={(e) => set("supportPeriodMonths", e.target.value)}
                      className={INPUT} placeholder="12"
                    />
                    <span className="text-sm text-slate-500 whitespace-nowrap">months</span>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Toggle
                  checked={form.meetsTechnicalRequirements}
                  onChange={(v) => set("meetsTechnicalRequirements", v)}
                  label="Meets All Technical Requirements"
                  desc="Vendor confirms full technical compliance"
                />
                <Toggle
                  checked={form.maintenanceIncluded}
                  onChange={(v) => set("maintenanceIncluded", v)}
                  label="Ongoing Maintenance Included"
                  desc="Maintenance and updates included in bid price"
                />
              </div>

              <Field label="Risk Notes" hint="Known risks, limitations, or caveats with this proposal">
                <textarea
                  rows={2} value={form.riskNotes}
                  onChange={(e) => set("riskNotes", e.target.value)}
                  className={TEXTAREA}
                  placeholder="e.g. Requires 2-week data migration window; third-party licensing risk..."
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Proposal Summary
                  </label>
                  <AiExtractedBadge fieldKey="proposalSummary" aiExtracted={aiExtracted} overridden={overridden} onOverride={handleOverride} />
                </div>
                <p className="text-xs text-slate-400 mb-1.5">Key differentiators and overall value proposition</p>
                <textarea
                  rows={4} value={form.proposalSummary}
                  onChange={(e) => !isFieldLocked("proposalSummary") && set("proposalSummary", e.target.value)}
                  disabled={isFieldLocked("proposalSummary")}
                  className={`${TEXTAREA} disabled:bg-slate-50 disabled:text-slate-400`}
                  placeholder="Summarize the vendor's approach, unique strengths, and why they are well-suited for this tender..."
                />
              </div>
            </div>
          )}
        </CardBody>

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {SECTIONS.map((_, idx) => (
              <button
                key={idx} type="button" onClick={() => setSection(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${idx === section ? "bg-blue-600" : "bg-slate-300"}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {section > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setSection((s) => s - 1)}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            {section < SECTIONS.length - 1 ? (
              <Button type="button" size="sm" onClick={() => setSection((s) => s + 1)}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" loading={loading}>
                <Plus className="w-4 h-4" /> Add Vendor
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}
