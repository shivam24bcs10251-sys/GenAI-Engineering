# Google NotebookLM RAG

A self-hosted take on Google NotebookLM. Upload a PDF or plain-text file and
have a conversation with it — answers are grounded in the document, with the
LLM constrained to use only the retrieved chunks (no general-knowledge
fallthrough).

Built as **Assignment 03** for the GenAI Engineering course (Scaler Sem 4).

- **Live demo:** _(Vercel link — added once deployed)_
- **Source:** [`Google_NoteBook_RAG/`](https://github.com/shivam24bcs10251-sys/GenAI-Engineering/tree/main/Google_NoteBook_RAG)

---

## How it works

```
PDF / TXT  ─►  Parse  ─►  Chunk  ─►  Embed  ─►  Qdrant
                                                   │
                       User question  ─►  Embed ─►  search top-k
                                                   │
                                          Context + question
                                                   │
                                                 LLM (OpenRouter)
                                                   │
                                          Grounded answer + sources
```

Each upload is written to its own Qdrant collection (UUID-named), so different
documents and different users never share a search space.

The chat UI shows the actual chunks retrieved for every answer — collapsed
under each response — so a reader can verify the answer really does come from
the document.

## Tech stack

| Layer       | Choice                                                   | Notes                                                                              |
| ----------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router) + TypeScript + Tailwind          | Single deployable; API routes host the pipeline.                                   |
| Vector DB   | Qdrant Cloud (free tier)                                 | Cosine distance, 768-dim vectors.                                                  |
| Embeddings  | Jina AI · `jina-embeddings-v2-base-en` (768-d)           | OpenRouter does not offer embeddings, so a separate provider is needed. Jina's free tier (1 M tokens) is the cleanest fit. Easy swaps: HuggingFace Inference API, Google `text-embedding-004`. |
| LLM         | OpenRouter · `google/gemma-4-31b-it:free`                | Free Google instruct model. Configurable via `OPENROUTER_MODEL`.                   |
| PDF parsing | `pdf-parse`                                              | Lightweight; gives raw text + page-break offsets.                                  |
| Chunking    | LangChain `RecursiveCharacterTextSplitter` (1000 / 200) | Hierarchical separators keep paragraphs and sentences intact.                      |

### About the LLM choice (OpenRouter)

OpenRouter exposes an OpenAI-compatible chat-completions API with dozens of
models behind one key. Free models that work for this app (verified May 2026):

- `google/gemma-4-31b-it:free` — default
- `meta-llama/llama-3.3-70b-instruct:free`
- `qwen/qwen3-next-80b-a3b-instruct:free`
- `z-ai/glm-4.5-air:free`
- `nvidia/nemotron-nano-9b-v2:free`
- `nousresearch/hermes-3-llama-3.1-405b:free`

The free tier shifts over time. If a model returns `404 No endpoints found`,
it has been pulled — picking any other id from
[openrouter.ai/models?max_price=0](https://openrouter.ai/models?max_price=0)
is a one-line `.env` change.

OpenRouter does **not** host embedding models, which is why embeddings go
through Jina AI separately.

## Chunking strategy

`RecursiveCharacterTextSplitter` with:

- `chunk_size = 1000` characters
- `chunk_overlap = 200` characters
- separator hierarchy: `["\n\n", "\n", ". ", " ", ""]`

It tries to split on paragraph breaks first, then sentences, then whitespace,
and only falls back to mid-word splits as a last resort. The 20 % overlap
preserves context across chunk boundaries — important for questions whose
answers straddle two chunks.

For PDFs the parser also records byte offsets of each page boundary, so every
chunk is tagged with its source page number. The UI surfaces "page N" beside
each citation.

## Project layout

```
Google_NoteBook_RAG/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts   # POST: ingest + index a file
│   │   │   └── chat/route.ts     # POST: ask a question
│   │   ├── layout.tsx
│   │   ├── page.tsx              # chat UI
│   │   └── globals.css
│   └── lib/
│       ├── chunking.ts           # RecursiveCharacterTextSplitter
│       ├── pdf.ts                # pdf-parse wrapper with page offsets
│       ├── embeddings.ts         # Jina AI client
│       ├── llm.ts                # OpenRouter client
│       ├── qdrant.ts             # collection + upsert + search
│       └── rag.ts                # orchestration: index + answer
├── .env.example
├── package.json
└── next.config.ts
```

## Running locally

Three free accounts cover the external services:

| Service       | Sign up                                               | Value needed         |
| ------------- | ----------------------------------------------------- | -------------------- |
| Qdrant Cloud  | <https://cloud.qdrant.io>                             | Cluster URL + API key |
| Jina AI       | <https://jina.ai/?sui=apikey>                         | API key (`jina_…`)   |
| OpenRouter    | <https://openrouter.ai/keys>                          | API key (`sk-or-v1-…`) |

```bash
git clone https://github.com/shivam24bcs10251-sys/GenAI-Engineering.git
cd GenAI-Engineering/Google_NoteBook_RAG
npm install
cp .env.example .env.local       # fill in the four values
npm run dev
# open http://localhost:3000
```

The first request to a free OpenRouter model can take a few seconds while the
model warms up.

## Deploying to Vercel

1. Import the repo on Vercel.
2. Set **Root Directory** to `Google_NoteBook_RAG`.
3. Under **Environment Variables**, add the four keys from `.env.example`.
4. Deploy. Next.js is detected automatically.

The `/api/upload` route runs on the Node.js runtime (needed by `pdf-parse`)
with a 60 s timeout — fine on Vercel's hobby tier.

## Grounding

The system prompt sent to the LLM includes the retrieved chunks plus a strict
instruction:

> Answer ONLY using the provided context below. Do not use outside knowledge.
> If the context does not contain enough information, reply: "The document
> doesn't cover that."

If retrieval returns nothing, the API short-circuits and returns that same
fallback without ever calling the LLM. The retrieved chunks are also returned
to the client and rendered under each answer, so groundedness is verifiable.

## Submission checklist (Assignment 03)

- [x] GitHub repo, public
- [x] Full RAG pipeline: ingestion → chunking → embedding → storage → retrieval → generation
- [x] At least one chunking strategy implemented and documented
- [x] Vector DB (Qdrant) used for storage and retrieval
- [x] LLM constrained to retrieved context, not general knowledge
- [x] Handles unseen documents at upload time
- [ ] Live deployment link _(added once Vercel deploy is up)_
