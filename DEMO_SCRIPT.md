# VendorRank AI — Demo Script (5 minutes)

## Before the Demo

- App running at `localhost:3000`
- Browser open to the tenders list
- Have a sample vendor PDF ready (any text-based PDF works — a simple supplier profile or pricing sheet)
- Optional: Hedera testnet configured with `HEDERA_TOPIC_ID`

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

## STEP 5 — AI Evaluation (45 seconds)

**Navigate to:** `/tenders/[id]/evaluate`

**Click "Run AI Evaluation"**

**While it runs:** "The AI is applying the exact weights we defined — price 30%, delivery 20%, and so on. It doesn't decide what matters. It applies the weights the team decided."

**When results appear:**

**Point to the score table:** "Each vendor gets a per-criterion score and a weighted total."

**Point to the top vendor:** "Vendor 1 scores highest on the weighted model — balanced across all criteria."

**Point to QuickHost's red flag:** "Partial compliance flagged here. For a government contract with mandatory ISO 27001 and SOC 2 requirements, this is a disqualifying finding."

**Point to the SHA-256 hash:** "This hash is a fingerprint of this entire evaluation. It goes into the Hedera message. If anyone changes the evaluation data later, the hash won't match."

---

## STEP 6 — Human Override (30 seconds)

**Navigate to:** `/tenders/[id]/decision`

**Say:** "The AI recommends Vendor 1. But I'm going to demonstrate an override."

**Select Vendor 2 (Stratus Systems)**

**A justification box appears automatically**

**Say:** "Notice the form requires a written justification — it's mandatory, not optional. This text will go directly into the Hedera message."

**Type:** `Stratus Systems holds an existing approved vendor relationship with demonstrated on-site delivery in this region. Budget constraints for FY2025 favor the lower-cost option given equivalent compliance posture.`

**Set reviewer name:** `Sarah Chen` / Role: `Head of Procurement`

**Click "Record Decision & Continue"**

**Say:** "The override reason — Sarah's name, her role, and the full justification — are now in an HCS message on Hedera. No one can delete or edit that."

---

## STEP 7 — Finalize (15 seconds)

**Navigate to:** `/tenders/[id]/finalize`

**Say:** "The summary card shows exactly what happened — AI said Vendor 1, Sarah chose Vendor 2, here's the written reason."

**Set name:** `James Okafor` / Role: `Procurement Officer`

**Click "Finalize & Record on Hedera"**

**When the tx appears:** "This is the transaction ID on Hedera testnet. The decision is now locked."

---

## STEP 8 — View Report (20 seconds)

**Click "View Report"**

**Say:** "This is the official procurement decision document — printable, self-contained. It includes the tender details, vendor comparison, scores, the AI recommendation, the override justification, and the Hedera transaction hashes for verification."

**Scroll through** the 7 sections quickly.

**Say:** "This is what you submit to the auditor. Every claim in this document is backed by an on-chain hash."

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
