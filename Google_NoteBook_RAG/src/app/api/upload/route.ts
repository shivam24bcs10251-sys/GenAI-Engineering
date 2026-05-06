import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { parsePdf } from "@/lib/pdf";
import { indexDocument } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name || "document";
    const isPdf =
      file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");

    let text: string;
    let pageBreaks: number[] | undefined;

    if (isPdf) {
      const parsed = await parsePdf(buffer);
      text = parsed.text;
      pageBreaks = parsed.pageBreaks;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract any text from the file" },
        { status: 400 }
      );
    }

    const collection = `doc_${uuidv4().replace(/-/g, "")}`;

    const result = await indexDocument({
      text,
      pageBreaks,
      source: name,
      collection,
    });

    return NextResponse.json({
      sessionId: collection,
      filename: name,
      chunks: result.chunks,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
