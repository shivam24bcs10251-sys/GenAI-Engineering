const express = require('express');
const OpenAI = require('openai');
const personas = require('../personas');

const router = express.Router();

// Groq is OpenAI-compatible — just a different base URL
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

router.post('/chat', async (req, res) => {
  const { personaId, messages } = req.body;

  if (!personaId) {
    return res.status(400).json({ message: 'personaId is required.' });
  }

  if (!Array.isArray(messages)) {
    return res.status(400).json({ message: 'messages must be an array.' });
  }

  const persona = personas[personaId];
  if (!persona) {
    return res.status(400).json({ message: `Unknown persona: "${personaId}".` });
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: persona.systemPrompt },
        ...messages
      ]
    });

    return res.json({ response: response.choices[0].message.content });
  } catch (err) {
    console.error('Groq API error:', err.message);
    return res.status(500).json({
      message: 'The AI service is temporarily unavailable. Please try again.'
    });
  }
});

module.exports = router;
