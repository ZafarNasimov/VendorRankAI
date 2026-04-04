# VendorRank AI — Demo Script (5 minutes)

## Before the Demo

- App running at `localhost:3000`
- Browser open to the tenders list
- Have a sample vendor PDF ready (any text-based PDF works — a simple supplier profile or pricing sheet)
- Optional: Hedera testnet configured with `HEDERA_TOPIC_ID`
- **Scandal Mode tender pre-seeded:** `pnpm db:seed` loads the "National Health Portal Infrastructure — SCANDAL MODE DEMO" tender showing a HIGH-risk override (AI recommends ClearPath Health Cloud, human picks Meridian Digital Ltd — the worst-scoring vendor)

---

## STEP 1 — Tenders List (15 seconds)

**Show:** The tenders dashboard. Point to the TenderCard progress steps.

**Say:** "Each procurement tender moves through a defined workflow — vendors, evaluation, decision, finalization. The progress tracker shows exactly where each tender is. The status is also written to Hedera at each step."

---

## STEP 2 — Create Tender (45 seconds)

**Navigate to:** `/tenders/new`

**Say:** "I'll create a realistic procurement tender. Notice the form is structured into sections — this isn't a freeform text box."

**Fill in:**
- **Title:** `Cloud Infrastructure Services — Q2 2025`
- **Ref number:** `DDS-2025-042`
- **Department:** `Department of Digital Services`
- **Category:** `Cloud & Hosting`
- **Procurement method:** `Open Tender`
- **Budget:** `350,000` / `USD`
- **Description:** `Provision of managed cloud infrastructure including compute, storage, and CDN for the national digital services platform.`
- **Mandatory certifications:** `ISO 27001, SOC 2 Type II`
- **Criteria weights:** Price 30%, Delivery 20%, Experience 25%, Compliance 15%, Support 10%

**Say:** "The criteria weights are set by the procurement team before any vendor submits. The AI cannot change them. Once this tender is created, those weights are written to Hedera — you can't retroactively adjust them to favor a particular vendor."

**Click "Create Tender"**

---

## STEP 3 — Add Vendor via Document Upload (60 seconds)

**Navigate to:** `/tenders/[id]/vendors`

**Click "Add Vendor"**

**Say:** "Vendors can fill in the form manually, or they can upload a proposal document and let AI extract the fields."

**Click "Upload a document instead"**

**Upload the sample PDF**

**Say:** "The AI is reading the document and extracting structured fields — company name, pricing, delivery timeline, certifications, years of experience."

**When results appear:**
- Point to the confidence badges (green = high confidence, amber = medium)
- **Say:** "Each extracted field shows a confidence level. The reviewer sees exactly what the AI found and decides what to accept."

**Click "Autofill Form"**, show the populated form tabs

**Say:** "The form is pre-filled but the reviewer must still confirm it — the human stays in the loop."

**Click through tabs**, adjust any values, **click "Save Proposal"**

---

## STEP 4 — Add Two More Vendors (30 seconds)

**Add Vendor 2:** Stratus Systems
- Price: `248,000`, Delivery: `75 days`, Experience: `7.5/10`
- Compliance: Full, ISO 27001 ✓, SOC 2 ✓

**Add Vendor 3:** QuickHost Solutions
- Price: `195,000`, Delivery: `45 days`, Experience: `5.5/10`
- Compliance: **Partial** (no SOC 2)

**Say:** "Partial compliance is an important signal. Watch how the AI handles it."

---

## STEP 5 — AI Evaluation + Explainability Panel (60 seconds)

**Navigate to:** `/tenders/[id]/evaluate`

**Click "Run AI Evaluation"**

**While it runs:** "The AI is applying the exact weights we defined — price 30%, delivery 20%, and so on. It doesn't decide what matters. It applies the weights the team decided."

**When results appear:**

**Point to the top vendor spotlight:** "The AI explains in plain English *why* the top vendor won — not just a number, but reasoning grounded in the data."

**Expand a vendor card:** "Each vendor gets a strengths/weaknesses breakdown. Green bars are where they performed well. Red flags are mandatory failures."

**Point to the weighted score table:** "Per-criterion scores, weighted contribution, and color-coded bars. You can see exactly how the final score was constructed."

**Point to QuickHost's red flag:** "Partial compliance flagged here. For a government contract with mandatory ISO 27001 and SOC 2 requirements, this is a disqualifying finding."

**Point to the SHA-256 hash:** "This hash is a fingerprint of this entire evaluation. It goes into the Hedera message. If anyone changes the evaluation data later, the hash won't match."

---

## STEP 6 — Human Override + Scandal Mode (60 seconds)

**Navigate to:** `/tenders/[id]/decision`

**Say:** "The AI recommends Vendor 1. But I'm going to demonstrate an override — and specifically show the Scandal Mode detector."

**Select Vendor 2 (Stratus Systems)**

**The Override Risk panel appears**

**Say:** "The moment I select a different vendor, the system computes an override risk score in real time. This one is LOW — Stratus is a reasonable alternative."

**Point to the comparison table:** "This table puts the AI pick and my pick side by side across every scoring dimension so there's no ambiguity about what I'm choosing."

**(Optional — for maximum impact):** Navigate to the pre-seeded Scandal Mode tender instead

**Say:** "Let me show you the extreme case — this tender is pre-seeded with a worst-case scenario."

**On the Scandal Mode tender, navigate to decision, the risk panel shows HIGH in red**

**Say:** "High risk. The system is telling the reviewer — loudly — that they're about to select a vendor with a 54-point score gap, partial compliance, no sanctions declaration, and the highest price. All six risk reasons are listed."

**Point to the red "HIGH RISK OVERRIDE" banner:** "This banner, this justification requirement, and this entire risk assessment go on Hedera permanently. The accountability is on-chain."

**Back on the main tender — Select Vendor 2 (Stratus Systems)**

**Type justification:** `Stratus Systems holds an existing approved vendor relationship with demonstrated on-site delivery in this region. Budget constraints for FY2025 favor the lower-cost option given equivalent compliance posture.`

**Set reviewer name:** `Sarah Chen` / Role: `Head of Procurement`

**Click "Record Decision & Continue"**

**Say:** "The override reason, risk level, and the full justification are now in an HCS message on Hedera. No one can delete or edit that."

---

## STEP 7 — Finalize (15 seconds)

**Navigate to:** `/tenders/[id]/finalize`

**Say:** "The summary card shows exactly what happened — AI said Vendor 1, Sarah chose Vendor 2, here's the written reason."

**Set name:** `James Okafor` / Role: `Procurement Officer`

**Click "Finalize & Record on Hedera"**

**When the tx appears:** "This is the transaction ID on Hedera testnet. The decision is now locked."

---

## STEP 8 — View Report + PDF Download (30 seconds)

**Click "View Report"**

**Say:** "This is the official procurement decision document — 8 sections, formal procurement memo style. It's designed to be submitted to an auditor or published as part of the public procurement record."

**Scroll through the sections:**
- "Section 1: tender metadata. Section 2: criteria weights — set before evaluation, immutable."
- "Section 3: full vendor comparison table."
- "Section 4: AI evaluation — including the plain-English explanation of why the top vendor won."
- "Section 5: the decision — override banner color-coded by risk level, AI vs human comparison, justification."
- "Section 6: red flags. Section 7: Hedera audit trail with transaction IDs. Section 8: signature blocks."

**Click "Download PDF"**

**Say:** "This generates a real PDF client-side — not a browser screenshot, but a properly formatted multi-page document. This is what goes in the official file."

---

## STEP 9 — Audit Timeline (30 seconds)

**Navigate to:** `/tenders/[id]/audit`

**Say:** "This is the payoff."

**Show the local events**, then **click "Hedera Mirror Node"** toggle.

**Say:** "We just switched from our database to data fetched live from `testnet.mirrornode.hedera.com`. These messages are not coming from our server. They come from the Hedera network."

**Point to the override event:** "Here's Sarah's override, with the full justification, timestamped, sequenced. This is what you show when a losing vendor challenges the decision."

**Click the HashScan link:** "And anyone — the vendor, the public, a regulator — can verify this independently on HashScan."

---

## STEP 10 — Reviewer Badge (15 seconds, optional)

**Go back to Finalize, click "Mint Reviewer Badge (HTS)"**

**Say:** "Optionally, we can mint a non-financial NFT credential via Hedera Token Service — proof that Sarah and James participated in this procurement decision. No Solidity. Pure native HTS."

---

## Closing Line

"VendorRank AI uses HCS for the immutable audit trail, Mirror Node to read that trail independently, and HTS for reviewer credentials. No Solidity. No smart contracts. Just the tools Hedera built for this exact use case — ordered, timestamped, tamper-evident records."

---

## For Judges — Technical Architecture Notes

### Hedera Agent Kit pattern

`services/hederaAgentService.ts` implements a **Hedera Agent Kit-compatible tool registry**:

```typescript
// Each function is a typed "agent tool" — stateless, schema-validated, swap-compatible
recordTenderCreated(topicId, { tenderId, title, criteriaWeights, ... })
recordAiRanking(topicId, { topVendorId, evaluationHash, rankedVendors, ... })
recordHumanDecision(topicId, { selectedVendorId, overrideUsed, overrideRiskLevel, ... })
recordDecisionFinalized(topicId, { reviewerName, finalDecisionHash })
```

These functions have the same semantics as Hedera Agent Kit tool calls. Replacing the body with `HederaAgentKit.executeTool(toolName, input)` requires no changes to callers. The AI evaluation agent (`aiEvaluationService.ts`) could call `recordAiRanking` in the same agent turn that produces the evaluation — writing the on-chain record atomically with the decision.

### Override risk — why it matters

The `assessOverrideRisk` function in `overrideRiskService.ts` runs **deterministically** from vendor data. The client cannot manipulate the risk level — it is computed server-side, written to the database, and written to Hedera HCS alongside the override reason. A corrupt procurement officer cannot record a LOW risk assessment for a HIGH risk override.

### Security model

- No private keys in client bundles (`NEXT_PUBLIC_` prefix only on the Mirror Node URL)
- Document uploads: MIME type allowlist + 10 MB cap + in-memory only (no disk writes)
- All API inputs validated with Zod at the route boundary
- SHA-256 hash chain: evaluation hash → decision hash → finalization hash, all written to HCS
