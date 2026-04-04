/**
 * PDF text extraction service.
 * Uses pdf-parse (Node.js only — never import this in client components).
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (mimeType === "application/pdf") {
    // pdf-parse v2: class-based API { PDFParse }
    // Listed in serverExternalPackages in next.config.ts to keep it server-side only.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text ?? "";
  }

  throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF or plain text file.`);
}

export function truncateForAI(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  // Keep first 10k and last 2k — proposals often have key data at start and end
  const head = text.slice(0, 10000);
  const tail = text.slice(-2000);
  return `${head}\n\n[...document truncated for extraction...]\n\n${tail}`;
}
