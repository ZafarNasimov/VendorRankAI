import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  AccountId,
  TopicInfoQuery,
  TransactionId,
  Timestamp,
} from "@hashgraph/sdk";
import type { HcsEventPayload } from "@/types/hedera";

let _client: Client | null = null;

function getClient(): Client {
  if (_client) return _client;

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error(
      "HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in environment variables"
    );
  }

  const client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet();

  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringDer(privateKey)
  );

  _client = client;
  return _client;
}

/**
 * Build a TransactionId with validStart set to 10 seconds in the past.
 * This guards against minor clock skew between the local machine and
 * the Hedera network (avoids INVALID_TRANSACTION_START).
 */
function makeTransactionId(): TransactionId {
  const accountId = process.env.HEDERA_ACCOUNT_ID!;
  // 10 seconds back in nanoseconds — safely within the 3-minute valid window
  const nowMs = Date.now() - 10_000;
  const seconds = Math.floor(nowMs / 1000);
  const nanos = (nowMs % 1000) * 1_000_000;
  return TransactionId.withValidStart(
    AccountId.fromString(accountId),
    new Timestamp(seconds, nanos)
  );
}

export async function createAuditTopic(memo: string): Promise<string> {
  const client = getClient();

  const txn = new TopicCreateTransaction()
    .setTransactionId(makeTransactionId())
    .setTopicMemo(memo);

  const response = await txn.execute(client);
  const receipt = await response.getReceipt(client);

  const topicId = receipt.topicId;
  if (!topicId) throw new Error("Failed to create HCS topic — no topicId in receipt");

  return topicId.toString();
}

export interface SubmitResult {
  transactionId: string;
  topicId: string;
  status: string;
}

export async function submitAuditMessage(
  topicId: string,
  payload: HcsEventPayload
): Promise<SubmitResult> {
  const client = getClient();

  const message = JSON.stringify(payload);

  const txn = new TopicMessageSubmitTransaction()
    .setTransactionId(makeTransactionId())
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message);

  const response = await txn.execute(client);
  const receipt = await response.getReceipt(client);

  return {
    transactionId: response.transactionId.toString(),
    topicId,
    status: receipt.status.toString(),
  };
}

export async function getTopicInfo(topicId: string): Promise<{
  topicId: string;
  memo: string;
  sequenceNumber: string;
}> {
  const client = getClient();

  const info = await new TopicInfoQuery()
    .setTopicId(TopicId.fromString(topicId))
    .execute(client);

  return {
    topicId: info.topicId.toString(),
    memo: info.topicMemo,
    sequenceNumber: info.sequenceNumber.toString(),
  };
}

export function isHederaConfigured(): boolean {
  return !!(process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY);
}
