import { v4 as uuidv4 } from "uuid";
import { chunkText } from "./chunking";
import { embedDocuments, embedQuery } from "./embeddings";
import {
  ensureCollection,
  upsertChunks,
  searchSimilar,
  type SearchHit,
} from "./qdrant";
import { chat } from "./llm";

export interface IndexResult {
  collection: string;
  chunks: number;
}

/**
 * End-to-end ingestion: chunk → embed → upsert to Qdrant.
 * `collection` isolates each upload so users don't pollute each other's
 * search space.
 */
export async function indexDocument(params: {
  text: string;
  pageBreaks?: number[];
  source: string;
  collection: string;
}): Promise<IndexResult> {
  const { text, pageBreaks, source, collection } = params;

  const chunks = await chunkText(text, pageBreaks);
  if (chunks.length === 0) {
    throw new Error("Document produced no chunks (empty content?)");
  }

  await ensureCollection(collection);

  const vectors = await embedDocuments(chunks.map((c) => c.text));

  const points = chunks.map((c, i) => ({
    id: uuidv4(),
    vector: vectors[i],
    payload: {
      id: `${collection}:${c.index}`,
      text: c.text,
      page: c.page,
      index: c.index,
      source,
    },
  }));

  await upsertChunks(collection, points);

  return { collection, chunks: chunks.length };
}

export interface AnswerResult {
  answer: string;
  sources: SearchHit[];
}

/**
 * Retrieve top-k chunks from the collection and ask the LLM to answer
 * strictly from that context. Returns the answer plus the cited chunks.
 */
export async function answerQuestion(params: {
  question: string;
  collection: string;
  k?: number;
}): Promise<AnswerResult> {
  const { question, collection, k = 4 } = params;

  const queryVec = await embedQuery(question);
  const hits = await searchSimilar(collection, queryVec, k);

  if (hits.length === 0) {
    return {
      answer:
        "I couldn't find anything relevant in the uploaded document to answer that.",
      sources: [],
    };
  }

  const contextBlock = hits
    .map((h, i) => {
      const pageTag = h.page ? ` (page ${h.page})` : "";
      return `[Chunk ${i + 1}${pageTag}]\n${h.text}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt = `You are a careful research assistant answering questions about a single document the user uploaded.

Rules:
- Answer ONLY using the provided context below. Do not use outside knowledge.
- If the context does not contain enough information, reply: "The document doesn't cover that."
- When useful, cite the chunk number in square brackets, e.g. [Chunk 2].
- Be concise and direct. Use bullet points for lists.

Context from the document:
${contextBlock}`;

  const answer = await chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ]);

  return { answer, sources: hits };
}
