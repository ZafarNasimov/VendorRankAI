/**
 * AI-powered vendor field extraction from proposal document text.
 * Returns extracted fields with per-field confidence levels.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface ExtractedField<T = string> {
  value: T | null;
  confidence: "high" | "medium" | "low";
}

export interface ExtractedVendorFields {
  companyName: ExtractedField;
  registrationNumber: ExtractedField;
  country: ExtractedField;
  address: ExtractedField;
  contactPerson: ExtractedField;
  contactEmail: ExtractedField;
  contactPhone: ExtractedField;
  taxId: ExtractedField;
  price: ExtractedField<number>;
  currency: ExtractedField;
  deliveryDays: ExtractedField<number>;
  paymentTermsOffered: ExtractedField;
  discountTerms: ExtractedField;
  offerValidityDays: ExtractedField<number>;
  experienceScore: ExtractedField<number>;
  yearsInBusiness: ExtractedField<number>;
  similarProjectsCount: ExtractedField<number>;
  proposedTeamSize: ExtractedField<number>;
  keyPersonnelSummary: ExtractedField;
  referenceClients: ExtractedField;
  complianceStatus: ExtractedField<"FULL" | "PARTIAL" | "NONE">;
  warrantyScore: ExtractedField<number>;
  supportPeriodMonths: ExtractedField<number>;
  riskNotes: ExtractedField;
  proposalSummary: ExtractedField;
}

const SYSTEM_PROMPT = `You are a procurement data extraction assistant.
Extract structured vendor proposal information from document text.
Return ONLY a valid JSON object. No markdown, no prose outside JSON.
For each field include a "value" (null if not found) and "confidence" ("high", "medium", or "low").
Use "high" when the value is clearly and explicitly stated.
Use "medium" when you infer the value from context.
Use "low" when you are guessing or the value is ambiguous.`;

const USER_PROMPT_TEMPLATE = (text: string) => `
Extract vendor proposal fields from the following document text.

Return this exact JSON schema:
{
  "companyName": { "value": "string or null", "confidence": "high|medium|low" },
  "registrationNumber": { "value": "string or null", "confidence": "high|medium|low" },
  "country": { "value": "string or null", "confidence": "high|medium|low" },
  "address": { "value": "string or null", "confidence": "high|medium|low" },
  "contactPerson": { "value": "string or null", "confidence": "high|medium|low" },
  "contactEmail": { "value": "string or null", "confidence": "high|medium|low" },
  "contactPhone": { "value": "string or null", "confidence": "high|medium|low" },
  "taxId": { "value": "string or null", "confidence": "high|medium|low" },
  "price": { "value": number_or_null, "confidence": "high|medium|low" },
  "currency": { "value": "USD|EUR|GBP or null", "confidence": "high|medium|low" },
  "deliveryDays": { "value": integer_or_null, "confidence": "high|medium|low" },
  "paymentTermsOffered": { "value": "string or null", "confidence": "high|medium|low" },
  "discountTerms": { "value": "string or null", "confidence": "high|medium|low" },
  "offerValidityDays": { "value": integer_or_null, "confidence": "high|medium|low" },
  "experienceScore": { "value": float_0_to_10_or_null, "confidence": "high|medium|low" },
  "yearsInBusiness": { "value": integer_or_null, "confidence": "high|medium|low" },
  "similarProjectsCount": { "value": integer_or_null, "confidence": "high|medium|low" },
  "proposedTeamSize": { "value": integer_or_null, "confidence": "high|medium|low" },
  "keyPersonnelSummary": { "value": "string or null", "confidence": "high|medium|low" },
  "referenceClients": { "value": "string or null", "confidence": "high|medium|low" },
  "complianceStatus": { "value": "FULL|PARTIAL|NONE or null", "confidence": "high|medium|low" },
  "warrantyScore": { "value": float_0_to_10_or_null, "confidence": "high|medium|low" },
  "supportPeriodMonths": { "value": integer_or_null, "confidence": "high|medium|low" },
  "riskNotes": { "value": "string or null", "confidence": "high|medium|low" },
  "proposalSummary": { "value": "2-4 sentence summary of the proposal or null", "confidence": "high|medium|low" }
}

Notes:
- experienceScore: estimate 0-10 based on years in business and track record mentioned
- warrantyScore: estimate 0-10 based on support/warranty terms described
- complianceStatus: FULL if all required certs mentioned, PARTIAL if some, NONE if none mentioned
- proposalSummary: synthesize a concise summary from the document

Document text:
---
${text}
---`;

function getProvider(): "anthropic" | "openai" | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (explicit === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export async function extractVendorFieldsFromText(
  text: string
): Promise<ExtractedVendorFields> {
  const provider = getProvider();

  if (!provider) {
    throw new Error(
      "No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment."
    );
  }

  const userPrompt = USER_PROMPT_TEMPLATE(text);
  let raw = "{}";

  if (provider === "openai") {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });
    raw = response.choices[0]?.message?.content ?? "{}";
  } else {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.AI_MODEL || "claude-3-5-sonnet-20241022";
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = response.content[0];
    raw = block.type === "text" ? block.text : "{}";
    raw = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  }

  const parsed = JSON.parse(raw) as ExtractedVendorFields;
  return parsed;
}

/** Count how many fields were successfully extracted (non-null values). */
export function countExtracted(fields: ExtractedVendorFields): {
  total: number;
  extracted: number;
  highConfidence: number;
} {
  const entries = Object.values(fields) as ExtractedField<unknown>[];
  const extracted = entries.filter((f) => f.value !== null).length;
  const highConfidence = entries.filter(
    (f) => f.value !== null && f.confidence === "high"
  ).length;
  return { total: entries.length, extracted, highConfidence };
}
