import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: string | undefined = body.question;
    const sessionId: string | undefined = body.sessionId;

    if (!question || !sessionId) {
      return NextResponse.json(
        { error: "question and sessionId are required" },
        { status: 400 }
      );
    }

    const result = await answerQuestion({
      question,
      collection: sessionId,
      k: 4,
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
