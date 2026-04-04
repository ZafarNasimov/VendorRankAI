import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  AccountId,
  Client,
} from "@hashgraph/sdk";

let _client: Client | null = null;

function getClient(): Client {
  if (_client) return _client;

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error("Hedera credentials not configured");
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

export interface BadgeMintResult {
  tokenId: string;
  serialNumber: number;
  transactionId: string;
}

export async function createBadgeToken(
  supplyKey: PrivateKey
): Promise<string> {
  const client = getClient();
  const operatorAccountId = process.env.HEDERA_ACCOUNT_ID!;

  const txn = new TokenCreateTransaction()
    .setTokenName("VendorRank Procurement Reviewer")
    .setTokenSymbol("VRBADGE")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10000)
    .setTreasuryAccountId(AccountId.fromString(operatorAccountId))
    .setSupplyKey(supplyKey)
    .freezeWith(client);

  const signedTxn = await txn.sign(
    PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY!)
  );
  const response = await signedTxn.execute(client);
  const receipt = await response.getReceipt(client);

  const tokenId = receipt.tokenId;
  if (!tokenId) throw new Error("Token creation failed — no tokenId in receipt");

  return tokenId.toString();
}

export async function mintReviewerBadge(
  tokenId: string,
  metadata: string
): Promise<BadgeMintResult> {
  const client = getClient();
  const supplyKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY!);

  // HTS NFT metadata is capped at 100 bytes per entry.
  // Store a compact URI reference; full metadata lives in the DB.
  const metaBytes = Buffer.from(metadata, "utf8");
  const safeMetadata = metaBytes.length <= 100 ? metaBytes : metaBytes.subarray(0, 100);

  const txn = new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([safeMetadata])
    .freezeWith(client);

  const signedTxn = await txn.sign(supplyKey);
  const response = await signedTxn.execute(client);
  const receipt = await response.getReceipt(client);

  const serials = receipt.serials;
  const serial = serials[0]?.toNumber() ?? 0;

  return {
    tokenId,
    serialNumber: serial,
    transactionId: response.transactionId.toString(),
  };
}
