import Link from "next/link";
import {
  Shield,
  Zap,
  FileCheck2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  AlertTriangle,
  Hash,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Built on Hedera · No Solidity · ETHGlobal
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Procurement decisions,{" "}
              <span className="text-blue-400">proven on-chain.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8">
              AI helps evaluate vendor proposals. Humans make the final decision.{" "}
              <strong className="text-white">Hedera proves how that decision was made.</strong>
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/tenders/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Start a Tender <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tenders"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10 text-center">
            The problem with procurement today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROBLEMS.map(({ Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              How VendorRank AI works
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              A structured, auditable procurement workflow — every step verifiable on Hedera.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {STEPS.map(({ step, title, desc, hedera }) => (
              <div key={step} className="bg-white p-5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{desc}</p>
                {hedera && (
                  <span className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    {hedera}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hedera Services */}
      <section className="py-16 md:py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Hedera Services Used</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built with native Hedera SDK only — no Solidity, no smart contracts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HEDERA_SERVICES.map(({ name, icon: Icon, color, bg, points }) => (
              <div key={name} className="rounded-xl p-6 bg-slate-800 border border-slate-700">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-white mb-3 text-sm">{name}</h3>
                <ul className="space-y-2">
                  {points.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Hedera */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Why Hedera? Why not just a database?
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8 text-lg">
            A database can be modified. A Hedera topic cannot. When a procurement officer is
            accused of bias months after an award, VendorRank AI lets you produce an immutable,
            timestamped sequence of every decision — complete with AI reasoning hashes and
            human override reasons — that no one can alter retroactively.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { title: "Tamper-evident", desc: "HCS messages are ordered, timestamped, and hash-chained. Any modification is immediately detectable." },
              { title: "Explainable", desc: "Every AI score links back to a SHA-256 hash of the full evaluation JSON stored in your database." },
              { title: "Verifiable", desc: "Anyone with the topic ID can independently verify the audit trail on Mirror Node or HashScan." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-slate-200">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to see it in action?</h2>
          <p className="text-slate-500 mb-6">Run the full demo workflow in under 5 minutes.</p>
          <Link
            href="/tenders/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            Create Your First Tender <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            VendorRank AI · ETHGlobal Hedera Track
          </div>
          <div>Built with Hedera SDK · No Solidity</div>
        </div>
      </footer>
    </div>
  );
}

const PROBLEMS = [
  { Icon: Users, title: "Favoritism", desc: "Vendors with personal connections win despite inferior proposals", color: "text-red-500", bg: "bg-red-50" },
  { Icon: AlertTriangle, title: "Opaque Reasoning", desc: "No clear record of why a vendor was selected over others", color: "text-amber-500", bg: "bg-amber-50" },
  { Icon: FileCheck2, title: "Post-hoc Editing", desc: "Evaluation criteria change after proposals are received", color: "text-orange-500", bg: "bg-orange-50" },
  { Icon: Lock, title: "Weak Audit Trails", desc: "Databases can be modified. Paper trails get lost", color: "text-slate-500", bg: "bg-slate-100" },
];

const STEPS = [
  { step: "1", title: "Create Tender", desc: "Define criteria weights and compliance requirements", hedera: "HCS event logged" },
  { step: "2", title: "Add Vendors", desc: "Enter 2–5 vendor proposals with structured data", hedera: null },
  { step: "3", title: "AI Evaluation", desc: "Multi-criteria scoring with plain-English reasoning", hedera: "Hash + HCS event" },
  { step: "4", title: "Human Decision", desc: "Accept AI recommendation or override with justification", hedera: "HCS event logged" },
  { step: "5", title: "Finalize", desc: "Lock the decision and issue reviewer credentials", hedera: "HCS finalization" },
  { step: "6", title: "Audit Timeline", desc: "Full history fetched from Hedera Mirror Node", hedera: "Mirror Node read" },
];

const HEDERA_SERVICES = [
  {
    name: "Consensus Service (HCS)",
    icon: Hash,
    color: "text-blue-400",
    bg: "bg-blue-900/30",
    points: [
      "Structured JSON events on immutable topic",
      "Tender created → AI evaluated → Decision made → Finalized",
      "SHA-256 hashes link on-chain events to off-chain data",
      "Cannot be edited or deleted after submission",
    ],
  },
  {
    name: "Mirror Node API",
    icon: FileCheck2,
    color: "text-purple-400",
    bg: "bg-purple-900/30",
    points: [
      "Read HCS topic history via REST API",
      "Audit Timeline page fetches all messages",
      "Timestamps and sequence numbers verified",
      "Links to HashScan for independent verification",
    ],
  },
  {
    name: "Token Service (HTS)",
    icon: Shield,
    color: "text-teal-400",
    bg: "bg-teal-900/30",
    points: [
      "Non-fungible reviewer badge NFT",
      "Minted after procurement decision is finalized",
      "Credential for verified procurement reviewers",
      "On-chain proof of participation",
    ],
  },
];
