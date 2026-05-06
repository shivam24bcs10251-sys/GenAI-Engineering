# Google NotebookLM RAG

A miniature, self-hosted version of Google NotebookLM. Upload a PDF (or plain
text file) and have a conversation with it. Answers are grounded in the
document — the LLM is forced to use only the retrieved chunks, not its own
knowledge.

> Assignment 03 — GenAI Engineering · Scaler Semester 4 / Term 2

**Live demo:** _(deployed to Vercel — link goes here once deployed)_
**Repo:** https://github.com/shivam24bcs10251-sys/GenAI-Engineering/tree/main/Google_NoteBook_RAG

---

## What it does

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

Every upload gets its own Qdrant collection (UUID), so multiple users / docs
never bleed into each other's search space.

## Tech stack

| Layer       | Choice                                                   | Why                                                                               |
| ----------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Framework   | **Next.js 15** (App Router) + TypeScript + Tailwind      | Single deployable, API routes for the pipeline, easy Vercel deploy.               |
| Vector DB   | **Qdrant Cloud** (free tier)                             | Required by the assignment. Cosine distance, 768-dim vectors.                     |
| Embeddings  | **Jina AI** — `jina-embeddings-v2-base-en` (768-d)       | OpenRouter does **not** offer embeddings. Jina's free tier (1 M tokens) is the cleanest drop-in. Alternatives: HuggingFace Inference API, Google `text-embedding-004`. |
| LLM         | **OpenRouter** — `google/gemini-2.0-flash-exp:free`      | Free, fast, capable. Swap via `OPENROUTER_MODEL` env var if rate-limited.         |
| PDF parsing | `pdf-parse`                                              | Lightweight, gives raw text + page boundaries.                                    |
| Chunking    | LangChain `RecursiveCharacterTextSplitter` (1000 / 200) | Hierarchical separator strategy keeps paragraphs intact.                          |

### About OpenRouter and the model choice

OpenRouter exposes an **OpenAI-compatible chat-completions API** with dozens of
models behind a single key. Free models that work well for this app (May 2026):

- `google/gemini-2.0-flash-exp:free` ← **default**, best balance of speed + quality
- `meta-llama/llama-3.3-70b-instruct:free`
- `deepseek/deepseek-chat-v3.1:free`
- `qwen/qwen-2.5-72b-instruct:free`

If a model is rate-limited or removed from the free tier, set
`OPENROUTER_MODEL` in `.env.local` to any other id from
[openrouter.ai/models](https://openrouter.ai/models).

OpenRouter does **not** host embedding models, so embeddings are handled
separately by Jina AI (free tier).

## Chunking strategy

`RecursiveCharacterTextSplitter` with:

- `chunk_size = 1000` characters
- `chunk_overlap = 200` characters
- separator hierarchy: `["\n\n", "\n", ". ", " ", ""]`

It tries to split on paragraph breaks first, then sentences, then whitespace,
and only falls back to mid-word splits as a last resort. The 20 % overlap
preserves context across chunk boundaries — important for questions that
straddle two chunks.

For PDFs the parser also records byte offsets of each page boundary, so every
chunk is tagged with its source page number and the UI can show "page 4" next
to a citation.

## Running locally

### 1. Prerequisites — three free accounts

| Service       | Sign up                                                     | What you copy                |
| ------------- | ----------------------------------------------------------- | ---------------------------- |
| Qdrant Cloud  | https://cloud.qdrant.io (create a free 1 GB cluster)        | Cluster URL + API key        |
| Jina AI       | https://jina.ai/?sui=apikey                                 | API key (`jina_…`)           |
| OpenRouter    | https://openrouter.ai/keys                                  | API key (`sk-or-v1-…`)       |

### 2. Install

```bash
git clone https://github.com/shivam24bcs10251-sys/GenAI-Engineering.git
cd GenAI-Engineering/Google_NoteBook_RAG
npm install
```

### 3. Configure

```bash
cp .env.example .env.local
# fill in the four values
```

### 4. Run

```bash
npm run dev
# open http://localhost:3000
```

Upload any PDF, ask questions. First request to a free OpenRouter model can
take a few seconds while the model warms up.

## Deploying to Vercel

1. Push this folder to your GitHub repo (already done if you cloned it).
2. On Vercel: **New Project → Import** the repo. Set the **Root Directory** to
   `Google_NoteBook_RAG`.
3. Under **Environment Variables**, add the four keys from `.env.example`.
4. Deploy. Vercel detects Next.js automatically.

> The `/api/upload` route runs on the Node.js runtime (needed by `pdf-parse`)
> with a 60 s timeout. Hobby-tier Vercel projects support this out of the box.

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

## Grounding the answer

The system prompt includes the retrieved chunks and the explicit instruction:

> Answer ONLY using the provided context below. Do not use outside knowledge.
> If the context does not contain enough information, reply: "The document
> doesn't cover that."

The UI also shows the actual chunks the model saw (collapsed under each
answer) so you can verify the answer is grounded.
