# VendorRank AI

> **Explainable procurement decisions with tamper-evident audit trails on Hedera.**

[![Hedera](https://img.shields.io/badge/Hedera-Testnet-blue)](https://hedera.com)
[![ETHGlobal](https://img.shields.io/badge/ETHGlobal-Hedera%20Track-purple)](https://ethglobal.com)
[![No Solidity](https://img.shields.io/badge/No%20Solidity-Native%20SDK-teal)](https://docs.hedera.com)

---

## The Core Pitch

> "AI helps analyze vendor proposals. Humans make the final decision. **Hedera proves how that decision was made.**"

---

## Problem

Public procurement is plagued by favoritism, opaque reasoning, post-hoc criteria changes, and weak audit trails. When a vendor challenges an award, there is rarely a tamper-evident record of how the decision was actually made.

---

## Solution

VendorRank AI provides a structured, end-to-end procurement workflow where:

- **AI** provides explainable multi-criteria scoring and plain-English reasoning per vendor
- **Humans** make the final call — accepting or overriding the AI recommendation with mandatory written justification
- **Hedera** permanently records every decision event in sequence, with cryptographic integrity
- **Report** generates a printable procurement decision document for the official record

---

## Architecture

```
Next.js 16 (App Router) + TypeScript + Tailwind CSS
PostgreSQL + Prisma ORM v7

Services:
  aiEvaluationService        → OpenAI / Anthropic (auto-detect from env keys)
  vendorAutofillService      → AI field extraction from uploaded documents
  documentExtractionService  → pdf-parse (PDF + plain text)
  hederaAgentService         → Agent Kit-style tool registry (high-level facade)
  hederaConsensusService     → @hashgraph/sdk (HCS write — used by agentService)
  mirrorNodeService          → Mirror Node REST API (read)
  badgeService               → @hashgraph/sdk (HTS optional)
  hashingService             → SHA-256 (crypto module)
  overrideRiskService        → deterministic override risk scoring
  procurementScoringService  → normalized weighted scoring
```

---

## Workflow (8 steps)

```
Create Tender → Add Vendors → AI Evaluation → Human Decision → Finalize → Report → Audit Trail → Badge
```

1. **Create Tender** — multi-section form: basic info, financial terms, compliance requirements, evaluation weights
2. **Add Vendors** — 5-tab wizard (company, commercial, compliance, technical, supporting docs); supports PDF/TXT upload with AI autofill
3. **AI Evaluation** — weighted multi-criteria scoring with per-criterion scores, plain-English reasoning, red flag detection
4. **Human Decision** — reviewer selects vendor; override requires written justification
5. **Finalize** — locks decision on Hedera; reviewer name + role recorded on-chain
6. **Report** — print-ready procurement decision document (7 sections)
7. **Audit Timeline** — chronological HCS events; toggle between local DB and Hedera Mirror Node
8. **Reviewer Badge** — optional HTS NFT credential for the reviewing officer

---

## Hedera Services Used

### 1. Hedera Consensus Service (HCS)
Writes structured JSON audit events to an immutable topic:

| Event | What's recorded |
|-------|----------------|
| `TENDER_CREATED` | Tender title, department, criteria weights |
| `AI_RANKING_GENERATED` | Vendor ranking, SHA-256 evaluation hash, top vendor |
| `HUMAN_DECISION_RECORDED` | Selected vendor, override flag, override reason, reviewer name |
| `DECISION_FINALIZED` | Final decision lock, reviewer role |
| `BADGE_ISSUED` | NFT token ID + serial number reference |

### 2. Mirror Node API
The Audit Timeline page reads all HCS messages from:
```
GET /api/v1/topics/{topicId}/messages
```
Decoded, parsed, and rendered with links to HashScan for independent verification.

### 3. Hedera Token Service (HTS) — Optional
Mints a `VendorRank Procurement Reviewer` NFT badge (NonFungibleUnique) after decision finalization. Reviewer credential — no financial value. Metadata stored within 100-byte HTS limit using compact URI format.

---

## Setup

### Prerequisites
- Node.js 18+, pnpm, PostgreSQL
- Hedera Testnet account: https://portal.hedera.com
- OpenAI or Anthropic API key (at least one recommended)

### Install
```bash
pnpm install
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### Database
```bash
pnpm db:push      # create / migrate tables
pnpm db:generate  # regenerate Prisma client after schema changes
pnpm db:seed      # load demo tenders (optional)
```

### Run
```bash
pnpm dev
# Open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `HEDERA_ACCOUNT_ID` | For live HCS | Testnet account ID (e.g. `0.0.12345`) |
| `HEDERA_PRIVATE_KEY` | For live HCS | DER-encoded private key |
| `HEDERA_NETWORK` | No | `testnet` (default) |
| `HEDERA_TOPIC_ID` | For live HCS | Set after `init-topic` |
| `HEDERA_TOKEN_ID` | For badges | Set after `create-badge-token` |
| `OPENAI_API_KEY` | Recommended | AI evaluation + document extraction |
| `ANTHROPIC_API_KEY` | Alternative | Used if OpenAI key not present |
| `AI_PROVIDER` | No | Force `openai` or `anthropic` |
| `AI_MODEL` | No | Default: `gpt-4o-mini` (OpenAI) |
| `NEXT_PUBLIC_MIRROR_NODE_URL` | No | Default: Hedera testnet mirror node |

**AI provider selection:** The app auto-detects which AI provider to use from available keys. Set `AI_PROVIDER=openai` or `AI_PROVIDER=anthropic` to force a specific one. If neither key is set, the scoring service falls back to deterministic rule-based scoring.

---

## Hedera Agent Kit

VendorRank AI follows the **Hedera Agent Kit** pattern: a registry of composable "agent tools", each corresponding to one meaningful Hedera operation. The implementation lives in `services/hederaAgentService.ts`.

### What Hedera Agent Kit provides

[Hedera Agent Kit](https://github.com/hedera-dev/hedera-agent-kit) is a TypeScript library that wraps `@hashgraph/sdk` into a set of named, schema-validated tools that any AI agent framework (LangChain, Vercel AI SDK, OpenAI function calling) can invoke by name. Each tool takes a typed input, executes one Hedera operation, and returns a structured result.

### How it maps to VendorRank AI

| Agent Kit tool concept | VendorRank AI implementation | Hedera operation |
|---|---|---|
| `ensure_audit_topic` | `ensureAuditTopic()` | `TopicCreateTransaction` |
| `record_tender_created` | `recordTenderCreated()` | `TopicMessageSubmitTransaction` |
| `record_ai_ranking` | `recordAiRanking()` | `TopicMessageSubmitTransaction` |
| `record_human_decision` | `recordHumanDecision()` | `TopicMessageSubmitTransaction` |
| `record_decision_finalized` | `recordDecisionFinalized()` | `TopicMessageSubmitTransaction` |
| `hts_mint_nft` | `mintReviewerBadge()` in `badgeService.ts` | `TokenMintTransaction` |
| `mirror_get_topic_messages` | `getMessages()` in `mirrorNodeService.ts` | Mirror Node REST |

### Why this architecture matters

Each tool function in `hederaAgentService.ts` is:
- **Stateless** — no shared mutable state between calls
- **Schema-typed** — input interfaces enforce what the AI must supply
- **Swap-compatible** — the function signatures are intentionally compatible with Agent Kit's tool registry, so dropping in `HederaAgentKit.executeTool("record_tender_created", input)` replaces the direct SDK call with no changes to callers

This means the AI evaluation agent (in `aiEvaluationService.ts`) could call `recordAiRanking` directly as part of its tool set — the evaluation and the Hedera write happen in the same agent turn, ensuring the on-chain record is always in sync with the evaluation result.

---

## Security

### Private key handling
- `HEDERA_PRIVATE_KEY` and `HEDERA_ACCOUNT_ID` are read only in `hederaConsensusService.ts` and `badgeService.ts` — both server-only modules never imported into client components
- `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are consumed only in `aiEvaluationService.ts` and `vendorAutofillService.ts` — server-side API routes; never exposed to the browser
- No API keys are interpolated into client bundles. The `NEXT_PUBLIC_` prefix is used only for the Mirror Node URL, which is a public endpoint

### Document upload validation
`app/api/documents/extract/route.ts` enforces:
- **MIME type allowlist**: only `application/pdf` and `text/plain` are accepted (HTTP 415 otherwise)
- **File size cap**: 10 MB hard limit (HTTP 413 otherwise)
- Files are read into a `Buffer` in-process; they are never written to disk or stored
- Extracted text is truncated before being sent to the AI (`truncateForAI` in `documentExtractionService.ts`) to prevent prompt injection via oversized documents

### Input validation
All API routes use Zod schemas at the boundary:
- `validators/decisionSchema.ts` — decision recording and finalization
- Field-level length limits prevent oversized inputs from reaching the database or Hedera messages

### Role awareness and override accountability
- Override risk is assessed deterministically server-side from `overrideRiskService.ts` — the client cannot supply a risk level that overrides the computed one
- The override reason and computed risk level (`LOW`/`MEDIUM`/`HIGH`) are written to Hedera HCS, creating a non-deletable accountability record
- HIGH-risk overrides require longer justification (2000-char limit) and show a red warning UI — the reviewer is visually informed before confirming

### Audit integrity
- SHA-256 hashes of the evaluation JSON and decision payload are computed in `hashingService.ts` before being stored in the database and written to HCS
- Any post-hoc modification of the database records would produce a hash mismatch detectable by re-hashing the stored JSON
- The Hedera sequence number provides ordering guarantees: events cannot be inserted between existing messages

---

## Key Features

### Document Upload + AI Autofill
Vendors can upload a PDF or plain text proposal document. The AI extracts structured fields (company name, price, delivery, certifications, etc.) with per-field confidence levels (`high`/`medium`/`low`). Extracted fields pre-fill the vendor form — humans review and confirm before saving.

### Explainability Panel
Every vendor receives a full enterprise-style breakdown:
- A weighted total score (0–100) with per-criterion score bars
- Per-vendor strengths and weaknesses extracted by the AI
- Plain-English explanation of why the top vendor won (`whyTopVendorWon`)
- Red flags for mandatory requirement failures (severity-tagged)
- Full AI reasoning (collapsible), compliance failures, and decision support guidance

Scoring weights are set by the procurement team before evaluation — the AI cannot change them.

### Override Risk Detection (Scandal Mode)
When a reviewer selects a vendor that differs from the AI recommendation, the system:
- Computes a `LOW`/`MEDIUM`/`HIGH` override risk score deterministically from vendor data
- Shows a side-by-side comparison table (AI pick vs. human pick) across all criteria
- Lists numbered risk reasons (score gap, compliance mismatch, technical failure, etc.)
- Requires a longer written justification for HIGH-risk overrides
- Records the risk level and reasons permanently on Hedera HCS

### Hash-Chained Audit Trail
The SHA-256 hash of the full evaluation JSON is included in the `AI_RANKING_GENERATED` HCS message. The SHA-256 hash of the decision (vendor ID + override flag + reason + timestamp) is included in `HUMAN_DECISION_RECORDED`. This creates an off-chain/on-chain link: you can verify the evaluation or decision hasn't changed by re-hashing.

### Override Enforcement
The UI requires a written justification when the human selects a vendor that differs from the AI recommendation. This text is mandatory, non-skippable, and written directly into the HCS message — not just stored in the application database.

### Beautiful Printable Decision Report
The `/report` page generates a formal procurement memo (8 sections) with:
1. Cover page with dark gov-style header, status badge, and override risk badge
2. Tender summary — procurement metadata, financial terms, mandatory certifications
3. Evaluation criteria — visual weight bars
4. Vendor comparison — headline score cards + full table with compliance badges
5. AI evaluation summary — `whyTopVendorWon`, per-vendor strengths/weaknesses, evaluation hash
6. Procurement decision — override banner (color-coded by risk level), AI vs human comparison, justification, risk reasons
7. Risk & compliance notes — red flags with severity tags
8. Hedera audit trail — events table + integrity hash, HashScan links, signature blocks

**Download as PDF** via the "Download PDF" button (html2canvas + jsPDF multi-page), or use the browser print dialog. Print CSS ensures backgrounds, table borders, and color-coded sections render correctly on paper.

---

## Project Structure

```
app/
  tenders/
    new/              Tender creation form
    [id]/
      page.tsx        Tender detail + progress tracker
      vendors/        Vendor list + add vendor form
      evaluate/       AI evaluation dashboard
      decision/       Human decision review
      finalize/       Decision lock + Hedera submission
      report/         Print-ready decision report
      audit/          HCS audit timeline

components/
  tender/             TenderForm, TenderCard
  vendor/             VendorForm (5-tab wizard), VendorTable, DocumentUpload
  evaluation/         EvaluationPanel (ranked cards, comparison table)
  audit/              AuditTimeline (event cards, integrity summary)
  ui/                 Card, Button, Badge, StatusChip, ScoreBar, PrintButton

services/
  hederaAgentService.ts      Agent Kit-compatible tool registry (high-level facade)
  hederaConsensusService.ts  Raw @hashgraph/sdk HCS calls
  mirrorNodeService.ts       Mirror Node REST reads
  badgeService.ts            HTS NFT minting
  aiEvaluationService.ts     AI scoring + vendor insights
  vendorAutofillService.ts   AI field extraction from document text
  documentExtractionService.ts  pdf-parse wrapper
  overrideRiskService.ts     Deterministic override risk assessment
  hashingService.ts          SHA-256 hashing
  procurementScoringService.ts  Weighted normalized scoring

types/
  tender.ts           VendorProposal, AiEvaluation, CriteriaWeights, etc.
  hedera.ts           HCS event payload types
```

---

## Demo Flow (5 minutes)

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the full step-by-step script.

**Summary:**
1. Create a tender with realistic criteria weights
2. Upload a vendor PDF — watch AI autofill the form
3. Add 2 more vendors manually
4. Run AI Evaluation — point to scores, reasoning, red flags
5. Override the AI recommendation with a written justification
6. Finalize — show Hedera transaction ID
7. Audit Timeline — toggle to Mirror Node, show override reason on Hedera
8. View Report — show print-ready decision document

---

## Limitations (Hackathon Scope)

- No authentication (single-user demo)
- Hedera testnet ~3–5s transaction finality
- Mirror Node ~5–10s propagation delay
- AI evaluation adds ~2–4s latency (fallback scoring is instant)
- PDF extraction quality depends on PDF structure (text-based PDFs only)

---

## License

MIT — ETHGlobal Hedera Track
