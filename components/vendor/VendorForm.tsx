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
} from "lucide-react";

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

function ScoreSelector({ label, hint, value, onChange }: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void;
}) {
  const num = parseFloat(value) || 0;
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          type="range" min="0" max="10" step="0.5"
          value={num}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-blue-600"
        />
        <div className="flex items-center gap-1 w-20">
          <input
            type="number" min="0" max="10" step="0.5"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-14 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
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

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyAutofill(draft: FlatVendorDraft) {
    setForm((f) => ({
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
      ...(draft.experienceScore    !== undefined && { experienceScore: draft.experienceScore }),
      ...(draft.yearsInBusiness    !== undefined && { yearsInBusiness: draft.yearsInBusiness }),
      ...(draft.similarProjectsCount !== undefined && { similarProjectsCount: draft.similarProjectsCount }),
      ...(draft.proposedTeamSize   !== undefined && { proposedTeamSize: draft.proposedTeamSize }),
      ...(draft.keyPersonnelSummary !== undefined && { keyPersonnelSummary: draft.keyPersonnelSummary }),
      ...(draft.referenceClients   !== undefined && { referenceClients: draft.referenceClients }),
      ...(draft.complianceStatus   !== undefined && { complianceStatus: draft.complianceStatus }),
      ...(draft.warrantyScore      !== undefined && { warrantyScore: draft.warrantyScore }),
      ...(draft.supportPeriodMonths !== undefined && { supportPeriodMonths: draft.supportPeriodMonths }),
      ...(draft.riskNotes          !== undefined && { riskNotes: draft.riskNotes }),
      ...(draft.proposalSummary    !== undefined && { proposalSummary: draft.proposalSummary }),
    }));
    setShowUpload(false);
    setOpen(true);
    setSection(0);
  }

  function close() {
    setOpen(false);
    setShowUpload(false);
    setSection(0);
    setForm({ ...DEFAULT_FORM });
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

              <ScoreSelector
                label="Experience Score (used in AI evaluation)"
                hint="Rate this vendor's relevant experience and track record (0 = none, 10 = exceptional)"
                value={form.experienceScore}
                onChange={(v) => set("experienceScore", v)}
              />

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
                <p className="text-sm font-medium text-slate-700 mb-2">Overall Compliance Status</p>
                <div className="flex gap-3">
                  {(["FULL", "PARTIAL", "NONE"] as const).map((s) => (
                    <label
                      key={s}
                      className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors flex-1 justify-center ${
                        form.complianceStatus === s
                          ? s === "FULL" ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : s === "PARTIAL" ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio" className="sr-only" value={s}
                        checked={form.complianceStatus === s}
                        onChange={() => set("complianceStatus", s)}
                      />
                      {s === "FULL" ? "Compliant" : s === "PARTIAL" ? "Partially Compliant" : "Non-Compliant"}
                    </label>
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

              <ScoreSelector
                label="Support & Warranty Score (used in AI evaluation)"
                hint="Rate the quality of post-delivery support and warranty offering (0 = poor, 10 = excellent)"
                value={form.warrantyScore}
                onChange={(v) => set("warrantyScore", v)}
              />

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

              <Field label="Proposal Summary" hint="Key differentiators and overall value proposition">
                <textarea
                  rows={4} value={form.proposalSummary}
                  onChange={(e) => set("proposalSummary", e.target.value)}
                  className={TEXTAREA}
                  placeholder="Summarize the vendor's approach, unique strengths, and why they are well-suited for this tender..."
                />
              </Field>
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
