/**
 * LLM client. Supports two OpenAI-compatible providers, switchable via
 * the LLM_PROVIDER env var:
 *   - "openrouter" (default) — many free models, but heavily shared
 *   - "groq"                  — separate free quota pool, very fast inference
 *
 * Both providers expose /v1/chat/completions in the OpenAI shape, so the
 * client body is identical and only the URL + auth + model change.
 */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: { message: { content: string } }[];
  error?: { message: string };
}

interface ProviderConfig {
  url: string;
  apiKey: string;
  model: string;
  extraHeaders?: Record<string, string>;
}

function resolveProvider(): ProviderConfig {
  const provider = (process.env.LLM_PROVIDER || "openrouter").toLowerCase();

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    return {
      url: GROQ_URL,
      apiKey,
      model: process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL,
    };
  }

  // openrouter
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  return {
    url: OPENROUTER_URL,
    apiKey,
    model: process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL,
    extraHeaders: {
      "HTTP-Referer":
        "https://github.com/shivam24bcs10251-sys/GenAI-Engineering",
      "X-Title": "Google NotebookLM RAG",
    },
  };
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const cfg = resolveProvider();

  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.extraHeaders || {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LLM chat failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as ChatResponse;
  if (json.error) throw new Error(json.error.message);
  return json.choices[0]?.message?.content ?? "";
}
