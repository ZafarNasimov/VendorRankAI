"use client";

import { useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

interface PrintButtonProps {
  variant?: "print" | "pdf" | "both";
  reportTitle?: string;
}

export function PrintButton({ variant = "both", reportTitle = "Procurement-Report" }: PrintButtonProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handlePdfDownload() {
    setPdfLoading(true);
    try {
      // Dynamically import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Target the report document area (exclude toolbar)
      const reportEl = document.getElementById("report-document");
      if (!reportEl) {
        console.error("PDF generation failed: #report-document element not found");
        return;
      }

      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Scale to fit A4 width
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      // Multi-page: split into A4 pages
      let position = 0;
      let page = 0;

      while (position < scaledHeight) {
        if (page > 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          -position,
          pdfWidth,
          scaledHeight,
          undefined,
          "FAST"
        );

        position += pdfHeight;
        page++;
      }

      const fileName = `${reportTitle.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      {(variant === "print" || variant === "both") && (
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      )}
      {(variant === "pdf" || variant === "both") && (
        <button
          onClick={handlePdfDownload}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          {pdfLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {pdfLoading ? "Generating PDF…" : "Download PDF"}
        </button>
      )}
    </div>
  );
}
