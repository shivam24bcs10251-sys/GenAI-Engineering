/**
 * Jina AI embeddings client.
 *
 * OpenRouter does not host embedding models, so we use Jina's free tier
 * (1M tokens) with `jina-embeddings-v2-base-en` (768-dim, retrieval-tuned).
 * Drop-in alternative: HuggingFace Inference API or Google text-embedding-004.
 */
const JINA_URL = "https://api.jina.ai/v1/embeddings";
const JINA_MODEL = "jina-embeddings-v2-base-en";
export const EMBEDDING_DIM = 768;

interface JinaResponse {
  data: { embedding: number[] }[];
}

async function callJina(
  inputs: string[],
  apiKey: string
): Promise<number[][]> {
  const res = await fetch(JINA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: JINA_MODEL, input: inputs }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Jina embeddings failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as JinaResponse;
  return json.data.map((d) => d.embedding);
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY is not set");

  // Jina accepts batches; keep batches modest to stay within payload limits.
  const BATCH = 32;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const embs = await callJina(batch, apiKey);
    out.push(...embs);
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embedDocuments([text]);
  return v;
}
