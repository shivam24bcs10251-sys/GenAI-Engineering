# Persona-Based AI Chatbot — Scaler Academy

A conversational AI chatbot that lets you chat with three Scaler/InterviewBit personalities: **Anshuman Singh**, **Abhimanyu Saxena**, and **Kshitij Mishra**. Each persona has a distinct, research-backed system prompt with few-shot examples, chain-of-thought instructions, and carefully crafted constraints.

---

## Live Demo

**[https://genai-engineering.vercel.app/](https://genai-engineering.vercel.app/)**

---

## Screenshots

> Add screenshots of the chat interface here.

---

## Features

- Three distinct AI personas with authentic communication styles
- Persona switcher that resets the conversation on switch
- Suggestion chips per persona to get started quickly
- Typing indicator while waiting for a response
- Markdown rendering in assistant responses
- Graceful error handling for API failures
- Fully responsive — works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (ES Modules) |
| Backend | Node.js + Express |
| AI API | Anthropic API |
| Deployment | Vercel / Railway / Render |

---

## Project Structure

```
persona-chatbot/
├── src/
│   ├── server.js           # Express server, serves static files + API
│   ├── routes/
│   │   └── chat.js         # POST /api/chat route
│   └── personas/
│       ├── index.js        # Exports all personas
│       ├── anshuman.js     # Anshuman Singh system prompt + metadata
│       ├── abhimanyu.js    # Abhimanyu Saxena system prompt + metadata
│       └── kshitij.js      # Kshitij Mishra system prompt + metadata
├── public/
│   ├── index.html          # Main chat UI
│   ├── css/
│   │   └── styles.css      # All styles, responsive
│   └── js/
│       ├── app.js          # Main app logic (ES module)
│       └── api.js          # API call functions
├── .env.example            # Environment variable template
├── .gitignore
├── package.json
├── vercel.json             # Vercel deployment config
├── prompts.md              # All system prompts + design annotations
└── reflection.md           # 300–500 word project reflection
```

---

## Local Setup

### Prerequisites
- Node.js >= 18
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd persona-chatbot

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Start the development server
npm run dev

# 5. Open in browser
open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `PORT` | No | 3000 | Server port |
| `MODEL` | No | claude-sonnet-4-6 | Model to use |

**Never commit your `.env` file.** Use `.env.example` as the template.

---

## Deployment

### Vercel (recommended)

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` in Project Settings → Environment Variables
4. Deploy — the `vercel.json` handles routing automatically

### Railway / Render

1. Connect your GitHub repo
2. Set `ANTHROPIC_API_KEY` as an environment variable
3. Set start command to `npm start`
4. Deploy

---

## API Reference

### `POST /api/chat`

**Request body:**
```json
{
  "personaId": "anshuman",
  "messages": [
    { "role": "user", "content": "How should I learn DSA?" }
  ]
}
```

**Success response (200):**
```json
{ "response": "Okay, let me be direct..." }
```

**Error response (4xx / 5xx):**
```json
{ "message": "Human-readable error description" }
```

---

## Documentation

- [`prompts.md`](./prompts.md) — All three system prompts with inline annotations explaining every design decision
- [`reflection.md`](./reflection.md) — 300–500 word reflection on what worked, what GIGO taught, and what to improve
