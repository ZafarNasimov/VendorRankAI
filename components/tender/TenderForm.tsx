"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import {
  FileText,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "IT Infrastructure",
  "Software & SaaS",
  "Professional Services",
  "Cloud & Hosting",
  "Security & Compliance",
  "Hardware & Equipment",
  "Consulting",
  "Logistics & Supply Chain",
  "Construction & Civil Works",
  "Healthcare & Medical",
  "Research & Development",
  "Other",
];

const PROCUREMENT_METHODS = [
  "Open Tender",
  "Restricted Tender",
  "Request for Quotation (RFQ)",
  "Framework Agreement",
  "Emergency Procurement",
  "Direct Award",
  "Competitive Dialogue",
];

const CONTRACT_TYPES = [
  "Fixed Price",
  "Time and Materials",
  "Milestone-Based",
  "Cost Plus",
  "Indefinite Delivery",
];

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"];

const WEIGHT_LABELS: Record<string, { label: string; description: string }> = {
  price:      { label: "Price / Cost",        description: "Total bid cost and value for money" },
  delivery:   { label: "Delivery Timeline",   description: "Speed of delivery or implementation" },
  experience: { label: "Experience & Track Record", description: "Relevant past performance" },
  compliance: { label: "Regulatory Compliance", description: "Certifications and legal requirements" },
  warranty:   { label: "Support & Warranty",  description: "Post-delivery support quality" },
};

const DEFAULT_WEIGHTS = { price: 0.3, delivery: 0.2, experience: 0.25, compliance: 0.15, warranty: 0.1 };
const DEFAULT_COMPLIANCE = { iso27001: false, gdpr: true, soc2: false, localVendor: false };

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  sublabel,
  step,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  step: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{step}</span>
        </div>
        <h2 className="font-semibold text-slate-800">{label}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
const SELECT = `${INPUT} appearance-none`;
const TEXTAREA = `${INPUT} resize-none`;

// ─── Main Form ────────────────────────────────────────────────────────────────

export function TenderForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    // A
    title: "",
    referenceNumber: "",
    department: "",
    category: CATEGORIES[0],
    procurementMethod: PROCUREMENT_METHODS[0],
    description: "",
    submissionDeadline: "",
    contractStartDate: "",
    contractEndDate: "",
    // B
    estimatedBudget: "",
    currency: "USD",
    contractType: CONTRACT_TYPES[0],
    paymentTerms: "",
    bidBondRequired: false,
    performanceGuaranteeRequired: false,
    // C
    criteriaWeights: { ...DEFAULT_WEIGHTS },
    minimumPassingScore: "",
    // D
    requiredCompliance: { ...DEFAULT_COMPLIANCE },
    mandatoryCertifications: "",
    technicalRequirements: "",
    deliverables: "",
    // E
    conflictDeclarationRequired: true,
    sensitiveProcurement: false,
    multiReviewRequired: false,
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateWeight(key: string, value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setForm((f) => ({
      ...f,
      criteriaWeights: {
        ...f.criteriaWeights,
        [key]: Math.min(1, Math.max(0, num / 100)),
      },
    }));
  }

  const totalWeight = Object.values(form.criteriaWeights).reduce((s, v) => s + v, 0);
  const weightOk = Math.abs(totalWeight - 1) <= 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weightOk) {
      toast.error("Evaluation weights must total exactly 100%");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        referenceNumber: form.referenceNumber || undefined,
        department: form.department,
        category: form.category,
        procurementMethod: form.procurementMethod || undefined,
        description: form.description || undefined,
        submissionDeadline: form.submissionDeadline
          ? new Date(form.submissionDeadline).toISOString()
          : undefined,
        contractStartDate: form.contractStartDate
          ? new Date(form.contractStartDate).toISOString()
          : undefined,
        contractEndDate: form.contractEndDate
          ? new Date(form.contractEndDate).toISOString()
          : undefined,
        estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : undefined,
        currency: form.currency,
        contractType: form.contractType || undefined,
        paymentTerms: form.paymentTerms || undefined,
        bidBondRequired: form.bidBondRequired,
        performanceGuaranteeRequired: form.performanceGuaranteeRequired,
        criteriaWeights: form.criteriaWeights,
        minimumPassingScore: form.minimumPassingScore
          ? parseFloat(form.minimumPassingScore)
          : undefined,
        requiredCompliance: form.requiredCompliance,
        mandatoryCertifications: form.mandatoryCertifications || undefined,
        technicalRequirements: form.technicalRequirements || undefined,
        deliverables: form.deliverables || undefined,
        conflictDeclarationRequired: form.conflictDeclarationRequired,
        sensitiveProcurement: form.sensitiveProcurement,
        multiReviewRequired: form.multiReviewRequired,
        notes: form.notes || undefined,
      };

      const res = await fetch("/api/tenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err.error));
      }

      const { tender } = await res.json();
      toast.success("Tender created — logged to Hedera audit trail");
      router.push(`/tenders/${tender.id}/vendors`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tender");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Section A: Basic Information ── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={FileText}
            step="Section A"
            label="Basic Tender Information"
            sublabel="Core identification and scheduling details for this procurement"
          />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Tender Title" required className="md:col-span-2">
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={INPUT}
                placeholder="e.g. Cloud Infrastructure Services 2025"
              />
            </Field>
            <Field label="Reference / Procurement ID" hint="Optional internal reference number">
              <input
                type="text"
                value={form.referenceNumber}
                onChange={(e) => set("referenceNumber", e.target.value)}
                className={INPUT}
                placeholder="e.g. DDS-2025-001"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Department / Agency" required>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className={INPUT}
                placeholder="e.g. Ministry of Finance"
              />
            </Field>
            <Field label="Procurement Category" required>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={SELECT}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Procurement Method">
              <select
                value={form.procurementMethod}
                onChange={(e) => set("procurementMethod", e.target.value)}
                className={SELECT}
              >
                {PROCUREMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Scope / Description" hint="Describe the goods, services, or works being procured">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={TEXTAREA}
              placeholder="Provide a summary of the procurement scope, key deliverables, and purpose..."
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Submission Deadline">
              <input
                type="datetime-local"
                value={form.submissionDeadline}
                onChange={(e) => set("submissionDeadline", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Expected Contract Start">
              <input
                type="date"
                value={form.contractStartDate}
                onChange={(e) => set("contractStartDate", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Expected Contract End">
              <input
                type="date"
                value={form.contractEndDate}
                onChange={(e) => set("contractEndDate", e.target.value)}
                className={INPUT}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* ── Section B: Budget & Commercial ── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={DollarSign}
            step="Section B"
            label="Budget & Commercial Terms"
            sublabel="Financial envelope, contract structure, and commercial requirements"
          />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Estimated Budget" className="md:col-span-2" hint="Indicative budget ceiling for this tender">
              <div className="flex gap-2">
                <select
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  className="w-24 border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.estimatedBudget}
                  onChange={(e) => set("estimatedBudget", e.target.value)}
                  className={`${INPUT} flex-1`}
                  placeholder="0"
                />
              </div>
            </Field>
            <Field label="Contract Type">
              <select
                value={form.contractType}
                onChange={(e) => set("contractType", e.target.value)}
                className={SELECT}
              >
                {CONTRACT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Payment Terms" hint="e.g. Net 30, milestone-based, 50% upfront">
            <input
              type="text"
              value={form.paymentTerms}
              onChange={(e) => set("paymentTerms", e.target.value)}
              className={INPUT}
              placeholder="e.g. Net 30 days from invoice"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={form.bidBondRequired}
                onChange={(e) => set("bidBondRequired", e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Bid Bond Required</span>
                <p className="text-xs text-slate-400 mt-0.5">Vendors must submit a bid security bond</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={form.performanceGuaranteeRequired}
                onChange={(e) => set("performanceGuaranteeRequired", e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Performance Guarantee Required</span>
                <p className="text-xs text-slate-400 mt-0.5">Awarded vendor must provide a performance guarantee</p>
              </div>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* ── Section C: Evaluation Model ── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={BarChart3}
            step="Section C"
            label="Evaluation Model"
            sublabel="Define how vendor proposals will be scored and ranked by the AI evaluation engine"
          />
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Weight inputs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Criteria Weights</p>
                <p className="text-xs text-slate-400 mt-0.5">Weights must total exactly 100%</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                weightOk
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {weightOk
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <AlertTriangle className="w-4 h-4" />
                }
                {Math.round(totalWeight * 100)}% / 100%
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(form.criteriaWeights).map(([key, val]) => {
                const meta = WEIGHT_LABELS[key];
                const pct = Math.round(val * 100);
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-48 flex-shrink-0">
                      <p className="text-sm font-medium text-slate-700">{meta?.label ?? key}</p>
                      <p className="text-xs text-slate-400">{meta?.description ?? ""}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={pct}
                        onChange={(e) => updateWeight(key, e.target.value)}
                        className="flex-1 accent-blue-600"
                      />
                      <div className="flex items-center gap-1 w-20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={pct}
                          onChange={(e) => updateWeight(key, e.target.value)}
                          className="w-14 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual bar */}
            <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden flex">
              {Object.entries(form.criteriaWeights).map(([key, val], i) => {
                const colors = ["bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-emerald-500", "bg-teal-500"];
                return (
                  <div
                    key={key}
                    className={`${colors[i]} transition-all duration-200`}
                    style={{ width: `${val * 100}%` }}
                    title={`${WEIGHT_LABELS[key]?.label}: ${Math.round(val * 100)}%`}
                  />
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              {Object.entries(form.criteriaWeights).map(([key, val], i) => {
                const colors = ["text-blue-600", "text-purple-600", "text-amber-600", "text-emerald-600", "text-teal-600"];
                return (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${["bg-blue-500","bg-purple-500","bg-amber-500","bg-emerald-500","bg-teal-500"][i]}`} />
                    <span className={`text-xs font-medium ${colors[i]}`}>
                      {WEIGHT_LABELS[key]?.label} {Math.round(val * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Field
            label="Minimum Passing Score"
            hint="Vendors scoring below this threshold will be flagged (0–100). Leave blank to disable."
          >
            <div className="flex items-center gap-2 w-40">
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={form.minimumPassingScore}
                onChange={(e) => set("minimumPassingScore", e.target.value)}
                className={INPUT}
                placeholder="e.g. 60"
              />
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
          </Field>
        </CardBody>
      </Card>

      {/* ── Section D: Compliance & Requirements ── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={ShieldCheck}
            step="Section D"
            label="Compliance & Requirements"
            sublabel="Mandatory certifications, technical requirements, and scope deliverables"
          />
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Required Certifications / Compliance</p>
            <p className="text-xs text-slate-400 mb-3">Vendors not meeting mandatory requirements will be flagged automatically</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(form.requiredCompliance).map(([key, val]) => (
                <label key={key} className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border transition-colors ${val ? "bg-blue-50 border-blue-300 text-blue-800" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        requiredCompliance: { ...f.requiredCompliance, [key]: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold uppercase">
                    {key === "localVendor" ? "Local Vendor" : key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Field label="Additional Mandatory Certifications" hint="List any certifications not covered above">
            <input
              type="text"
              value={form.mandatoryCertifications}
              onChange={(e) => set("mandatoryCertifications", e.target.value)}
              className={INPUT}
              placeholder="e.g. CREST, PCI-DSS, NIST CSF"
            />
          </Field>

          <Field label="Technical Requirements" hint="Key technical specifications vendors must satisfy">
            <textarea
              rows={3}
              value={form.technicalRequirements}
              onChange={(e) => set("technicalRequirements", e.target.value)}
              className={TEXTAREA}
              placeholder="e.g. Must support Kubernetes, 99.9% SLA, multi-region deployment..."
            />
          </Field>

          <Field label="Deliverables" hint="Expected outputs and deliverables from the contract">
            <textarea
              rows={3}
              value={form.deliverables}
              onChange={(e) => set("deliverables", e.target.value)}
              className={TEXTAREA}
              placeholder="e.g. Migration plan, production deployment, 12 months support..."
            />
          </Field>
        </CardBody>
      </Card>

      {/* ── Section E: Governance ── */}
      <Card>
        <CardHeader>
          <SectionHeader
            icon={Settings2}
            step="Section E"
            label="Governance & Risk Controls"
            sublabel="Procurement oversight, conflict-of-interest, and risk classification"
          />
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                key: "conflictDeclarationRequired" as const,
                label: "Conflict-of-Interest Declaration Required",
                desc: "All evaluators must declare any conflicts",
              },
              {
                key: "sensitiveProcurement" as const,
                label: "Sensitive Procurement",
                desc: "Requires elevated scrutiny and additional oversight",
              },
              {
                key: "multiReviewRequired" as const,
                label: "Multi-Reviewer Committee Required",
                desc: "Decision must be reviewed by multiple officers",
              },
            ].map(({ key, label, desc }) => (
              <label key={key} className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${form[key] ? "bg-blue-50 border-blue-200" : "border-slate-200 hover:bg-slate-50"}`}>
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          <Field label="Internal Reviewer Notes" hint="Notes visible only to procurement team members">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={TEXTAREA}
              placeholder="Any internal notes, special instructions, or escalation contacts..."
            />
          </Field>
        </CardBody>
      </Card>

      {/* ── Hedera info ── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-teal-50 border border-teal-200 text-sm text-teal-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Upon creation, a <strong>TENDER_CREATED</strong> event will be submitted to the Hedera
          Consensus Service, establishing a tamper-evident audit trail for this procurement.
        </p>
      </div>

      {/* ── Submit ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {weightOk
            ? <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4 inline" /> Evaluation weights valid</span>
            : <span className="text-red-500 font-medium flex items-center gap-1"><AlertTriangle className="w-4 h-4 inline" /> Weights must total 100%</span>
          }
        </p>
        <Button type="submit" loading={loading} size="lg" disabled={!weightOk}>
          Create Tender &amp; Continue →
        </Button>
      </div>
    </form>
  );
}
