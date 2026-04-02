const express = require('express');
const OpenAI = require('openai');
const db = require('../db');

const router = express.Router();

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'http://localhost:5173',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Boba POS Assistant',
  },
});

const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

async function loadMenuContext() {
  const [categoriesResult, drinksResult, toppingsResult] = await Promise.all([
    db.query('SELECT category_id, category_name FROM drink_category WHERE is_active = true ORDER BY category_id'),
    db.query(`
      SELECT d.drink_id, d.drink_name, d.base_price, dc.category_name
      FROM drink d
      JOIN drink_category dc ON d.category_id = dc.category_id
      WHERE dc.is_active = true
      ORDER BY d.category_id, d.drink_name
    `),
    db.query('SELECT topping_id, topping_name, topping_price FROM topping ORDER BY topping_id'),
  ]);

  return [
    'Categories:',
    ...categoriesResult.rows.map((category) => `- ${category.category_id}: ${category.category_name}`),
    '',
    'Drinks:',
    ...drinksResult.rows.map(
      (drink) => `- ${drink.drink_name} (${drink.category_name}) - $${Number(drink.base_price).toFixed(2)}`
    ),
    '',
    'Toppings:',
    ...toppingsResult.rows.map(
      (topping) => `- ${topping.topping_name} - $${Number(topping.topping_price).toFixed(2)}`
    ),
  ].join('\n');
}

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not set' });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    const menuContext = await loadMenuContext();

    const chatMessages = [
      {
        role: 'system',
        //NOTE TO ANGELA LATER, can make chatbot see ordering trends in the future and suggest most popular sales and stuff
        content: `You are the personal assistant for the Reveille Boba ordering app.\n\nUse the menu data below as your source of truth when answering questions about drinks, categories, prices, and toppings. Keep answers concise and helpful. If the user asks for something not on the menu, say so clearly. If the user asks about ordering, explain the customer flow in the app.\n\nMenu data:\n${menuContext}`,
      },
      ...messages
        .filter((message) => message && typeof message.content === 'string')
        .slice(-10)
        .map((message) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        })),
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages: chatMessages,
      temperature: 0.3,
      max_tokens: 500,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || 'I could not generate a response right now.';

    res.json({ reply });
  } catch (error) {
    console.error('Assistant route error:', error);
    res.status(500).json({ error: 'Assistant request failed' });
  }
});

module.exports = router;