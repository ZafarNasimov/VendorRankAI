"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ExtractedVendorFields, ExtractedField } from "@/services/vendorAutofillService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlatVendorDraft = Partial<{
  companyName: string;
  registrationNumber: string;
  country: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  taxId: string;
  price: string;
  currency: string;
  deliveryDays: string;
  paymentTermsOffered: string;
  discountTerms: string;
  offerValidityDays: string;
  experienceScore: string;
  yearsInBusiness: string;
  similarProjectsCount: string;
  proposedTeamSize: string;
  keyPersonnelSummary: string;
  referenceClients: string;
  complianceStatus: "FULL" | "PARTIAL" | "NONE";
  warrantyScore: string;
  supportPeriodMonths: string;
  riskNotes: string;
  proposalSummary: string;
}>;

interface DocumentUploadProps {
  onAutofill: (draft: FlatVendorDraft) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confidenceBadge(confidence: "high" | "medium" | "low") {
  const map = {
    high:   { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "High" },
    medium: { cls: "bg-amber-100 text-amber-700 border-amber-200",       label: "Review" },
    low:    { cls: "bg-red-100 text-red-700 border-red-200",             label: "Uncertain" },
  };
  const { cls, label } = map[confidence];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function flattenFields(fields: ExtractedVendorFields): FlatVendorDraft {
  const str = (f: ExtractedField | undefined) =>
    f?.value != null ? String(f.value) : undefined;
  const comp = (f: ExtractedField<"FULL" | "PARTIAL" | "NONE"> | undefined) =>
    f?.value ?? undefined;

  return {
    companyName:         str(fields.companyName),
    registrationNumber:  str(fields.registrationNumber),
    country:             str(fields.country),
    address:             str(fields.address),
    contactPerson:       str(fields.contactPerson),
    contactEmail:        str(fields.contactEmail),
    contactPhone:        str(fields.contactPhone),
    taxId:               str(fields.taxId),
    price:               fields.price?.value != null ? String(fields.price.value) : undefined,
    currency:            str(fields.currency),
    deliveryDays:        fields.deliveryDays?.value != null ? String(fields.deliveryDays.value) : undefined,
    paymentTermsOffered: str(fields.paymentTermsOffered),
    discountTerms:       str(fields.discountTerms),
    offerValidityDays:   fields.offerValidityDays?.value != null ? String(fields.offerValidityDays.value) : undefined,
    experienceScore:     fields.experienceScore?.value != null ? String(fields.experienceScore.value) : undefined,
    yearsInBusiness:     fields.yearsInBusiness?.value != null ? String(fields.yearsInBusiness.value) : undefined,
    similarProjectsCount: fields.similarProjectsCount?.value != null ? String(fields.similarProjectsCount.value) : undefined,
    proposedTeamSize:    fields.proposedTeamSize?.value != null ? String(fields.proposedTeamSize.value) : undefined,
    keyPersonnelSummary: str(fields.keyPersonnelSummary),
    referenceClients:    str(fields.referenceClients),
    complianceStatus:    comp(fields.complianceStatus as ExtractedField<"FULL" | "PARTIAL" | "NONE">),
    warrantyScore:       fields.warrantyScore?.value != null ? String(fields.warrantyScore.value) : undefined,
    supportPeriodMonths: fields.supportPeriodMonths?.value != null ? String(fields.supportPeriodMonths.value) : undefined,
    riskNotes:           str(fields.riskNotes),
    proposalSummary:     str(fields.proposalSummary),
  };
}

// ─── Preview row ──────────────────────────────────────────────────────────────

function PreviewRow({ label, field }: { label: string; field: ExtractedField<unknown> | undefined }) {
  if (!field || field.value == null) return null;
  const display = String(field.value);
  if (!display.trim()) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 flex-1 break-words">{display}</span>
      {confidenceBadge(field.confidence)}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentUpload({ onAutofill }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "extracting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [fields, setFields] = useState<ExtractedVendorFields | null>(null);
  const [stats, setStats] = useState<{ total: number; extracted: number; highConfidence: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  async function processFile(file: File) {
    setFileName(file.name);
    setStatus("extracting");
    setErrorMsg("");
    setFields(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Extraction failed");
      }

      setFields(data.fields);
      setStats(data.stats);
      setStatus("done");
      setShowPreview(true);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleApply() {
    if (!fields) return;
    onAutofill(flattenFields(fields));
  }

  function reset() {
    setStatus("idle");
    setErrorMsg("");
    setFileName("");
    setFields(null);
    setStats(null);
    setShowPreview(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden">
      {/* Drop zone / status */}
      {status === "idle" && (
        <div
          className={`p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragOver ? "bg-blue-50 border-blue-300" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drop a proposal document here, or{" "}
              <span className="text-blue-600 hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF or plain text · up to 10 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>
      )}

      {status === "extracting" && (
        <div className="p-6 flex items-center gap-4">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700">Extracting fields from document…</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{fileName}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Extraction failed</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={reset} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {status === "done" && fields && stats && (
        <div>
          {/* Summary bar */}
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-emerald-800 truncate">{fileName}</p>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {stats.extracted} / {stats.total} fields extracted
                &nbsp;·&nbsp;
                {stats.highConfidence} high confidence
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? "Hide" : "Preview"}
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button onClick={reset} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confidence legend */}
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              AI extraction is not always accurate. Review all values — especially those marked{" "}
              <strong>Review</strong> or <strong>Uncertain</strong> — before saving.
            </span>
          </div>

          {/* Extracted fields preview */}
          {showPreview && (
            <div className="px-4 py-3 max-h-72 overflow-y-auto">
              <PreviewRow label="Company Name"     field={fields.companyName} />
              <PreviewRow label="Registration No." field={fields.registrationNumber} />
              <PreviewRow label="Country"          field={fields.country} />
              <PreviewRow label="Contact Person"   field={fields.contactPerson} />
              <PreviewRow label="Email"            field={fields.contactEmail} />
              <PreviewRow label="Phone"            field={fields.contactPhone} />
              <PreviewRow label="Bid Price"        field={fields.price} />
              <PreviewRow label="Currency"         field={fields.currency} />
              <PreviewRow label="Delivery (days)"  field={fields.deliveryDays} />
              <PreviewRow label="Payment Terms"    field={fields.paymentTermsOffered} />
              <PreviewRow label="Offer Valid (days)" field={fields.offerValidityDays} />
              <PreviewRow label="Experience Score" field={fields.experienceScore} />
              <PreviewRow label="Years in Business" field={fields.yearsInBusiness} />
              <PreviewRow label="Similar Projects" field={fields.similarProjectsCount} />
              <PreviewRow label="Team Size"        field={fields.proposedTeamSize} />
              <PreviewRow label="Key Personnel"    field={fields.keyPersonnelSummary} />
              <PreviewRow label="Reference Clients" field={fields.referenceClients} />
              <PreviewRow label="Compliance"       field={fields.complianceStatus} />
              <PreviewRow label="Warranty Score"   field={fields.warrantyScore} />
              <PreviewRow label="Support Period"   field={fields.supportPeriodMonths} />
              <PreviewRow label="Risk Notes"       field={fields.riskNotes} />
              <PreviewRow label="Proposal Summary" field={fields.proposalSummary} />
            </div>
          )}

          {/* CTA */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Values will pre-fill the vendor form. You can edit everything before saving.
            </p>
            <Button size="sm" onClick={handleApply}>
              <Zap className="w-4 h-4" />
              Autofill Form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
