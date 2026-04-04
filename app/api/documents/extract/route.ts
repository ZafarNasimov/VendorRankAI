import { NextRequest } from "next/server";
import { extractTextFromBuffer, truncateForAI } from "@/services/documentExtractionService";
import { extractVendorFieldsFromText, countExtracted } from "@/services/vendorAutofillService";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["application/pdf", "text/plain"];

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid multipart request" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No file uploaded. Send a 'file' field." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: `Unsupported file type '${file.type}'. Upload a PDF or .txt file.` },
      { status: 415 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` },
      { status: 413 }
    );
  }

  // 1. Extract raw text from the document
  let extractedText: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    extractedText = await extractTextFromBuffer(buffer, file.type);
  } catch (err) {
    console.error("[extract] Text extraction failed:", err);
    return Response.json(
      { error: "Failed to extract text from document. Ensure the PDF contains selectable text (not scanned images)." },
      { status: 422 }
    );
  }

  if (!extractedText.trim()) {
    return Response.json(
      { error: "No readable text found in this document. The PDF may contain only scanned images." },
      { status: 422 }
    );
  }

  // 2. Truncate for AI and run field extraction
  const textForAI = truncateForAI(extractedText);
  let fields;
  try {
    fields = await extractVendorFieldsFromText(textForAI);
  } catch (err) {
    console.error("[extract] AI extraction failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "AI extraction failed" },
      { status: 503 }
    );
  }

  const stats = countExtracted(fields);

  return Response.json({
    fields,
    stats,
    fileName: file.name,
    characterCount: extractedText.length,
  });
}
