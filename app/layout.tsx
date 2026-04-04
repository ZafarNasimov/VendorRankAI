import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "VendorRank AI — Transparent Procurement",
  description:
    "AI-assisted vendor evaluation with tamper-evident audit trails on Hedera. Built for public-sector procurement transparency.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1">{children}</div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              fontSize: "14px",
              borderRadius: "8px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#f8fafc" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#f8fafc" },
            },
          }}
        />
      </body>
    </html>
  );
}
