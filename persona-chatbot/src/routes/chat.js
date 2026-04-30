const express = require('express');
const OpenAI = require('openai');
const personas = require('../personas');

const router = express.Router();

const client = new OpenAI();

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
      model: process.env.MODEL || 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: persona.systemPrompt },
        ...messages
      ]
    });

    return res.json({ response: response.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI API error:', err);
    return res.status(500).json({
      message: 'The AI service is temporarily unavailable. Please try again.'
    });
  }
});

module.exports = router;
