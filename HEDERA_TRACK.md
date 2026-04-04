# Why VendorRank AI Fits the Hedera Track

## Track: "No Solidity Allowed — Build with Hedera SDKs"

---

## Requirement Checklist

### ✅ Use only the Hedera JavaScript/TypeScript SDK

All Hedera interactions use `@hashgraph/sdk`:

```typescript
// services/hederaConsensusService.ts
import {
  Client, TopicCreateTransaction, TopicMessageSubmitTransaction,
  TopicId, PrivateKey, AccountId, TopicInfoQuery,
} from "@hashgraph/sdk";

// services/badgeService.ts
import {
  TokenCreateTransaction, TokenMintTransaction,
  TokenType, TokenSupplyType, PrivateKey,
} from "@hashgraph/sdk";
```

No other blockchain libraries. No EVM. No Solidity. Zero `.sol` files.

---

### ✅ No Solidity, No Smart Contracts

This project contains no Solidity files. The entire application logic lives in:
- TypeScript services on the Next.js backend
- Hedera native transactions (HCS, HTS)
- Mirror Node REST API calls

---

### ✅ At Least Two Native Hedera Services

Three services are used:

| Service | Usage | File |
|---------|-------|------|
| **HCS** | Write audit events at each workflow step | `services/hederaConsensusService.ts` |
| **Mirror Node** | Read audit history independently from app DB | `services/mirrorNodeService.ts` |
| **HTS** | Mint reviewer NFT badge (NonFungibleUnique) | `services/badgeService.ts` |

---

### ✅ Coherent End-to-End User Experience

Not a collection of scripts or demos. A complete procurement platform with 8 steps:

| Step | Page | Description |
|------|------|-------------|
| 1 | `/tenders/new` | Multi-section tender creation with criteria weights |
| 2 | `/tenders/[id]/vendors` | 5-tab vendor wizard with PDF upload + AI autofill |
| 3 | `/tenders/[id]/evaluate` | AI evaluation dashboard with ranked comparison |
| 4 | `/tenders/[id]/decision` | Human decision with optional override + justification |
| 5 | `/tenders/[id]/finalize` | Lock decision, submit to Hedera, record reviewer role |
| 6 | `/tenders/[id]/report` | Print-ready procurement decision document |
| 7 | `/tenders/[id]/audit` | HCS audit timeline with Mirror Node toggle |
| 8 | `/tenders/[id]/finalize` | Mint HTS reviewer badge NFT |

---

### ✅ Mirror Node Integration

`services/mirrorNodeService.ts` queries:
```
GET /api/v1/topics/{topicId}/messages
```

The Audit Timeline page has a live toggle between:
- **Local Database** — events stored in PostgreSQL
- **Hedera Mirror Node** — events sourced live from testnet

This toggle is the demo's most compelling moment: it proves the audit trail is not in the application owner's control once written.

---

## HCS Message Schema

Every event follows this deterministic base schema:

```typescript
interface HcsEventPayload {
  eventType: HcsEventType;
  tenderId: string;
  recordedBy: string;  // reviewer name + role from UI
  recordedAt: string;  // ISO 8601
}
```

Event-specific payloads add verifiable data:

### `TENDER_CREATED`
```typescript
{
  tenderTitle: string;
  department: string;
  criteriaWeights: CriteriaWeights;  // price, delivery, experience, compliance, warranty
}
```

### `AI_RANKING_GENERATED`
```typescript
{
  vendorIds: string[];
  vendorCount: number;
  topVendorId: string;
  topVendorName: string;
  evaluationHash: string;     // SHA-256 of full evaluation JSON
  scoringModelVersion: string;
}
```

### `HUMAN_DECISION_RECORDED`
```typescript
{
  aiTopVendorId: string;
  aiTopVendorName: string;
  selectedVendorId: string;
  selectedVendorName: string;
  overrideUsed: boolean;
  overrideReason?: string;    // mandatory when overrideUsed = true
  decisionHash: string;       // SHA-256 of decision record
}
```

### `DECISION_FINALIZED`
```typescript
{
  selectedVendorId: string;
  selectedVendorName: string;
  aiTopVendorId?: string;
  aiTopVendorName?: string;
  overrideUsed: boolean;
  decisionHash: string;
}
```

### `BADGE_ISSUED`
```typescript
{
  tokenId: string;
  serialNumber: number;
  reviewerName: string;
}
```

---

## Hash Chaining

Two SHA-256 hashes link on-chain events to off-chain data:

**Evaluation hash** (`AI_RANKING_GENERATED`):
```
SHA-256(JSON.stringify({ tenderId, evaluationId, vendorCount, rankingSummary, timestamp }))
```
Stored in the HCS message. Re-hash the evaluation record to verify nothing changed.

**Decision hash** (`HUMAN_DECISION_RECORDED`):
```
SHA-256(JSON.stringify({ tenderId, aiRecommendedVendorId, selectedVendorId, overrideUsed, overrideReason, timestamp }))
```
Stored in both the HCS message and the application database. Mismatch = tampered record.

---

## HTS Badge Metadata

HTS NFT metadata is capped at 100 bytes. VendorRank uses a compact URI format:
```
vrb:badge:<12-char-tenderId>:<reviewerName up to 28 chars>
```
The full badge record (tender ID, reviewer name, token ID, serial number) is stored in the application database, linked by the compact on-chain reference.

---

## Why This Is a Good Fit for the Track

The Hedera track looks for products where the blockchain **genuinely justifies itself**. VendorRank AI is that product:

| Property needed | How Hedera provides it |
|----------------|----------------------|
| Immutable event log | HCS topics — messages cannot be edited or deleted |
| Ordered sequence | HCS sequence numbers — event order is provable |
| Trusted timestamps | HCS consensus timestamps — not application server time |
| Independent verification | Mirror Node — anyone can read without trusting the app |
| Tamper detection | SHA-256 hashes in HCS messages link to off-chain data |
| Reviewer credentials | HTS NFT — non-financial, non-transferable (demo scope) |

None of these require Solidity. HCS is exactly the right primitive for an audit log.

---

## Code Locations

| Component | File |
|-----------|------|
| HCS client setup | `services/hederaConsensusService.ts` — `getClient()` |
| Topic creation | `services/hederaConsensusService.ts` — `createAuditTopic()` |
| Message submission | `services/hederaConsensusService.ts` — `submitAuditMessage()` |
| Mirror Node fetch | `services/mirrorNodeService.ts` — `fetchTopicMessages()` |
| Mirror Node parse | `services/mirrorNodeService.ts` — `parseTopicMessages()` |
| HTS token creation | `services/badgeService.ts` — `createBadgeToken()` |
| HTS badge mint | `services/badgeService.ts` — `mintReviewerBadge()` |
| Init topic API | `app/api/hedera/init-topic/route.ts` |
| Mint badge API | `app/api/hedera/mint-badge/route.ts` |
| Audit timeline page | `app/tenders/[id]/audit/page.tsx` |
| HCS event types | `types/hedera.ts` |
