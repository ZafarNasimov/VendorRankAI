# VendorRank AI — Judge-Facing Pitch

## One-liner

Transparent, AI-assisted government procurement with a tamper-evident audit trail on Hedera — no Solidity, no smart contracts.

---

## The Problem (10 seconds)

Government procurement is the world's largest corruption surface. Billions in contracts are awarded every year with no verifiable record of how the decision was made. A database can be edited. Paper trails get lost. Post-hoc justifications are easy to fabricate.

---

## The Solution (20 seconds)

VendorRank AI is a procurement platform that:

1. Accepts structured vendor proposals (form + PDF upload with AI autofill)
2. Uses AI to generate explainable, weighted vendor rankings
3. Requires humans to approve or override with mandatory written justification
4. Writes every decision event permanently to Hedera HCS
5. Generates a print-ready decision report with on-chain verification references
6. Provides a live audit timeline sourced directly from Hedera Mirror Node

The result: a procurement record no one can edit after the fact.

---

## Why Hedera (30 seconds)

This product's value proposition **depends** on the blockchain:

- The AI evaluation is hashed (SHA-256) and the hash goes on Hedera. You cannot change the evaluation retroactively — the hash won't match.
- The override reason is inside an HCS message. You cannot delete that message.
- The final decision is on Hedera. No admin with database access can quietly change it months later.
- The audit timeline toggle shows data sourced from the Hedera network, not the application database.

Without Hedera, this is just procurement software. **With Hedera, it's a proof system.**

---

## Track Fit

| Requirement | Implementation |
|-------------|---------------|
| Hedera JS/TS SDK only | ✅ `@hashgraph/sdk` throughout, zero EVM |
| No Solidity | ✅ No `.sol` files, no smart contracts |
| ≥ 2 native services | ✅ HCS + Mirror Node + HTS (3 services) |
| Coherent end-to-end UX | ✅ 8-step procurement workflow |
| Mirror Node usage | ✅ Audit Timeline reads live from Mirror Node with toggle |
| Demoable in 5 min | ✅ See DEMO_SCRIPT.md |

---

## What Makes This Different from a CRUD App

### 1. The override is enforced and permanent
When a procurement officer overrides the AI recommendation, the UI requires a written justification. That text is not just stored in a database — it is submitted as an HCS message body. It cannot be edited or deleted.

### 2. Hash chaining links off-chain AI to on-chain proof
- SHA-256 of the full evaluation JSON → in `AI_RANKING_GENERATED` HCS message
- SHA-256 of the decision record → in `HUMAN_DECISION_RECORDED` HCS message

Anyone can re-hash the stored evaluation data and verify it matches what was recorded on Hedera.

### 3. The audit trail has a different source of truth
Toggle to "Hedera Mirror Node" on the audit page. The data is fetched from `https://testnet.mirrornode.hedera.com/api/v1/topics/{topicId}/messages` — not from the application's PostgreSQL. Even if the application is compromised or the database is edited, the Mirror Node data is independent.

### 4. Document intelligence reduces capture risk
Vendors upload PDF proposals. AI extracts structured fields with confidence scores. The extracted data is shown transparently before autofill — the reviewer decides what to accept. This reduces the chance that informal persuasion bypasses the structured scoring criteria.

---

## The "Aha" Moment for Judges

Navigate to the Audit Timeline page. Toggle from "Local Database" to "Hedera Mirror Node". The data changes source from PostgreSQL to the Hedera network. The override reason — including the full justification text — is right there, timestamped, sequenced, and hash-linked to the AI evaluation.

*That* is why Hedera matters here. The audit trail is not in the application owner's control once written.

---

## Technical Highlights

- **Zero Solidity** — HCS, Mirror Node, HTS via native SDK only
- **SHA-256 hash chaining** — evaluation hash and decision hash link on-chain events to off-chain data
- **Override enforcement** — written justification is mandatory and goes directly into the HCS payload
- **Mirror Node live read** — audit page switches data source from PostgreSQL to Hedera network
- **PDF extraction pipeline** — `pdf-parse` → AI field extraction → confidence-scored autofill
- **Dual AI provider** — auto-detects OpenAI or Anthropic from available env keys; falls back to deterministic scoring if neither is configured
- **Print-ready decision report** — 7-section document with Hedera transaction references for the official record
- **Production-grade stack** — Next.js 16, Prisma 7, TypeScript strict mode

---

## Who Needs This

- Government procurement offices (primary)
- Public-sector grant committees
- University vendor selection boards
- NGO supplier selection processes
- Enterprise vendor review boards subject to audit

This is not a crypto product. It is a **governance product** that uses Hedera as its integrity layer.
