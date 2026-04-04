"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors print:hidden"
    >
      <Printer className="w-4 h-4" />
      Print / Export PDF
    </button>
  );
}
