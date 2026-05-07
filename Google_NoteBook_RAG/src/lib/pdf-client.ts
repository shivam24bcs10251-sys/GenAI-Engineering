"use client";

/**
 * Client-side PDF parsing with pdfjs-dist.
 *
 * Why client-side? Vercel serverless functions cap request bodies at ~4.5 MB,
 * which a typical academic paper or textbook will blow past. A 30 MB PDF
 * becomes ~200 KB of plain text once parsed, so we extract in the browser
 * and only ship the text to the API.
 *
 * pdfjs-dist is loaded via dynamic import so it never executes during the
 * server build, and the worker is loaded from a CDN to avoid bundler quirks.
 */

export interface ExtractedDoc {
  text: string;
  pageBreaks: number[];
  numPages: number;
}

type PdfjsLib = typeof import("pdfjs-dist");
let cached: PdfjsLib | null = null;

async function getPdfjs(): Promise<PdfjsLib> {
  if (cached) return cached;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.mjs`;
  cached = lib;
  return lib;
}

export async function extractPdfText(file: File): Promise<ExtractedDoc> {
  const lib = await getPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;

  const breaks: number[] = [];
  let acc = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const pageText = tc.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");

    if (acc.length > 0) breaks.push(acc.length);
    acc += pageText + "\n";
  }

  return { text: acc, pageBreaks: breaks, numPages: pdf.numPages };
}
