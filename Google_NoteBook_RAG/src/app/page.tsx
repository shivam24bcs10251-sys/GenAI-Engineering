"use client";

import { useRef, useState } from "react";
import { extractPdfText } from "@/lib/pdf-client";

interface SourceHit {
  text: string;
  page?: number;
  source: string;
  score: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceHit[];
}

interface SessionInfo {
  sessionId: string;
  filename: string;
  chunks: number;
}

export default function Home() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    setUploadStatus("Reading file…");
    setMessages([]);
    setSession(null);

    try {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      let text: string;
      let pageBreaks: number[] | undefined;

      if (isPdf) {
        setUploadStatus("Parsing PDF in your browser…");
        const parsed = await extractPdfText(file);
        text = parsed.text;
        pageBreaks = parsed.pageBreaks;
      } else {
        text = await file.text();
      }

      if (!text.trim()) {
        throw new Error("Could not extract any text from the file");
      }

      setUploadStatus("Indexing — chunking, embedding, writing to Qdrant…");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, pageBreaks, filename: file.name }),
      });

      const raw = await res.text();
      let data: { sessionId?: string; filename?: string; chunks?: number; error?: string };
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Server returned a non-JSON response (${res.status}): ${raw.slice(0, 200)}`
        );
      }
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSession({
        sessionId: data.sessionId!,
        filename: data.filename!,
        chunks: data.chunks!,
      });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadStatus(null);
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !input.trim() || asking) return;

    const question = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setAsking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          sessionId: session.sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Chat failed";
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Google NotebookLM <span className="text-blue-400">RAG</span>
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Upload a PDF or .txt and chat with it. Answers come strictly from your
          document — chunked, embedded with Jina, stored in Qdrant, generated
          via the configured LLM provider.
        </p>
      </header>

      {!session && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="mb-2 text-base font-medium">1. Upload a document</h2>
          <p className="mb-4 text-sm text-neutral-400">
            Pick a PDF or plain-text file. The system will chunk, embed, and
            index it into a fresh Qdrant collection just for this session.
            PDF text is extracted in your browser, so large files are fine.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
            className="block w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500 disabled:opacity-50"
          />
          {uploadStatus && (
            <p className="mt-3 text-sm text-blue-300">{uploadStatus}</p>
          )}
          {uploadError && (
            <p className="mt-3 text-sm text-red-400">{uploadError}</p>
          )}
        </section>
      )}

      {session && (
        <section className="flex flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm">
            <div>
              <span className="text-neutral-400">Loaded:</span>{" "}
              <span className="font-medium">{session.filename}</span>
              <span className="ml-2 text-neutral-500">
                · {session.chunks} chunks
              </span>
            </div>
            <button
              onClick={() => {
                setSession(null);
                setMessages([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800"
            >
              Upload another
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {messages.length === 0 && (
              <p className="rounded-lg border border-dashed border-neutral-800 px-4 py-6 text-center text-sm text-neutral-500">
                Ask anything about your document. Try: &quot;Summarise the main
                topics&quot; or &quot;What does it say about X?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {asking && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm text-neutral-400">
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={handleAsk}
            className="mt-2 flex gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the document…"
              disabled={asking}
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={asking || !input.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </section>
      )}

      <footer className="mt-6 border-t border-neutral-900 pt-4 text-xs text-neutral-500">
        Built with Next.js · Qdrant · Jina embeddings · Groq / OpenRouter ·{" "}
        <a
          href="https://github.com/shivam24bcs10251-sys/GenAI-Engineering"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-neutral-300"
        >
          source
        </a>
      </footer>
    </main>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-neutral-800 bg-neutral-900/40 text-neutral-100"
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.sources && message.sources.length > 0 && (
          <details className="mt-3 border-t border-neutral-800 pt-2 text-xs text-neutral-400">
            <summary className="cursor-pointer select-none hover:text-neutral-200">
              {message.sources.length} source chunk
              {message.sources.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-2 space-y-2">
              {message.sources.map((s, i) => (
                <li
                  key={i}
                  className="rounded border border-neutral-800 bg-neutral-950/60 p-2"
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">
                    Chunk {i + 1}
                    {s.page ? ` · page ${s.page}` : ""} · score{" "}
                    {s.score.toFixed(3)}
                  </div>
                  <div className="line-clamp-4 text-neutral-300">{s.text}</div>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
