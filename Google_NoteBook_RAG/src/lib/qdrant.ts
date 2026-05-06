import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBEDDING_DIM } from "./embeddings";

let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (client) return client;
  const url = process.env.QDRANT_URL;
  if (!url) throw new Error("QDRANT_URL is not set");
  client = new QdrantClient({
    url,
    apiKey: process.env.QDRANT_API_KEY,
  });
  return client;
}

export interface StoredChunk {
  id: string;
  text: string;
  page?: number;
  index: number;
  source: string;
}

export async function ensureCollection(name: string): Promise<void> {
  const c = getClient();
  const exists = await c
    .getCollection(name)
    .then(() => true)
    .catch(() => false);
  if (exists) return;
  await c.createCollection(name, {
    vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
  });
}

export async function upsertChunks(
  collection: string,
  points: { id: string; vector: number[]; payload: StoredChunk }[]
): Promise<void> {
  const c = getClient();
  await c.upsert(collection, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload as unknown as Record<string, unknown>,
    })),
  });
}

export interface SearchHit {
  text: string;
  page?: number;
  source: string;
  score: number;
}

export async function searchSimilar(
  collection: string,
  vector: number[],
  k = 4
): Promise<SearchHit[]> {
  const c = getClient();
  const results = await c.search(collection, {
    vector,
    limit: k,
    with_payload: true,
  });
  return results.map((r) => {
    const payload = r.payload as unknown as StoredChunk;
    return {
      text: payload.text,
      page: payload.page,
      source: payload.source,
      score: r.score,
    };
  });
}

export async function deleteCollection(name: string): Promise<void> {
  const c = getClient();
  await c.deleteCollection(name).catch(() => {
    /* noop if missing */
  });
}
