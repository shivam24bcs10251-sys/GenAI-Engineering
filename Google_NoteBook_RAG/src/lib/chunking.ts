import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface Chunk {
  text: string;
  index: number;
  page?: number;
}

/**
 * Chunking strategy: RecursiveCharacterTextSplitter.
 *
 * Splits on a hierarchy of separators ("\n\n", "\n", " ", "") so paragraphs
 * stay together when possible. chunk_size=1000 chars with 200-char overlap
 * keeps semantic continuity across boundaries — values that work well for
 * mixed prose + technical documents.
 */
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export async function chunkText(
  text: string,
  pageBreaks?: number[]
): Promise<Chunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const pieces = await splitter.splitText(text);

  return pieces.map((piece, i) => ({
    text: piece,
    index: i,
    page: pageBreaks ? findPageForOffset(text, piece, pageBreaks) : undefined,
  }));
}

function findPageForOffset(
  fullText: string,
  piece: string,
  pageBreaks: number[]
): number {
  const offset = fullText.indexOf(piece);
  if (offset < 0) return 1;
  const pageIndex = pageBreaks.findIndex((bp) => offset < bp);
  return pageIndex === -1 ? pageBreaks.length : pageIndex + 1;
}
