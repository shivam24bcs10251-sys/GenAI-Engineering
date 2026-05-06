/**
 * OpenRouter chat client (OpenAI-compatible API).
 *
 * Model is configurable via OPENROUTER_MODEL. Default is Google's Gemma 4
 * (free tier). If a model is removed from the free tier or rate-limits you,
 * swap to any other id from https://openrouter.ai/models — see README for
 * a list of currently-working free options.
 */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-4-31b-it:free";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  
}

interface ChatResponse {
  choices: { message: { content: string } }[];
  error?: { message: string };
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://github.com/shivam24bcs10251-sys/GenAI-Engineering",
      "X-Title": "Google NotebookLM RAG",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenRouter chat failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as ChatResponse;
  if (json.error) throw new Error(json.error.message);
  return json.choices[0]?.message?.content ?? "";
}
