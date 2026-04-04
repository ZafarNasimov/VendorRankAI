import type { MirrorNodeMessage, TimelineEvent, HcsEventPayload, HcsEventType } from "@/types/hedera";

const MIRROR_BASE =
  process.env.NEXT_PUBLIC_MIRROR_NODE_URL ||
  "https://testnet.mirrornode.hedera.com";

export async function fetchTopicMessages(
  topicId: string,
  limit = 100
): Promise<MirrorNodeMessage[]> {
  const url = `${MIRROR_BASE}/api/v1/topics/${topicId}/messages?limit=${limit}&order=asc`;

  const res = await fetch(url, { next: { revalidate: 30 } });

  if (!res.ok) {
    throw new Error(
      `Mirror Node returned ${res.status} for topic ${topicId}`
    );
  }

  const data = await res.json();
  return (data.messages ?? []) as MirrorNodeMessage[];
}

export function parseTopicMessages(
  messages: MirrorNodeMessage[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const msg of messages) {
    try {
      const decoded = Buffer.from(msg.message, "base64").toString("utf8");
      const payload = JSON.parse(decoded) as HcsEventPayload;

      events.push({
        sequenceNumber: msg.sequence_number,
        consensusTimestamp: msg.consensus_timestamp,
        eventType: payload.eventType as HcsEventType,
        payload,
        topicId: msg.topic_id,
      });
    } catch {
      // Skip malformed messages
    }
  }

  return events;
}

export async function getTimelineForTopic(
  topicId: string
): Promise<TimelineEvent[]> {
  const messages = await fetchTopicMessages(topicId);
  return parseTopicMessages(messages);
}

export function formatConsensusTimestamp(timestamp: string): string {
  // Mirror Node returns timestamp as "1234567890.123456789" (seconds.nanoseconds)
  const seconds = parseFloat(timestamp);
  return new Date(seconds * 1000).toISOString();
}
