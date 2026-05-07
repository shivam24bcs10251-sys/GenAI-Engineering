import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { indexDocument } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

interface UploadBody {
  text?: string;
  pageBreaks?: number[];
  filename?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UploadBody;
    const text = (body.text || "").trim();
    const filename = body.filename || "document";
    const pageBreaks = body.pageBreaks;

    if (!text) {
      return NextResponse.json(
        { error: "No text content provided" },
        { status: 400 }
      );
    }

    const collection = `doc_${uuidv4().replace(/-/g, "")}`;

    const result = await indexDocument({
      text,
      pageBreaks,
      source: filename,
      collection,
    });

    return NextResponse.json({
      sessionId: collection,
      filename,
      chunks: result.chunks,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
