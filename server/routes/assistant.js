// Import Express to create routes
const express = require('express');

// Import OpenAI client (used with OpenRouter here)
const OpenAI = require('openai');

// Import database connection
const db = require('../db');

// Create a new router instance
const router = express.Router();

// Get API key from environment variables
const apiKey = process.env.OPENROUTER_API_KEY;

// Initialize OpenAI client configured for OpenRouter
const openai = new OpenAI({
  apiKey,

  // OpenRouter base URL instead of OpenAI default
  baseURL: 'https://openrouter.ai/api/v1',

  // Required headers for OpenRouter (identifies your app)
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'http://localhost:5173',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Boba POS Assistant',
  },
});

// Choose which model to use (default fallback if env var not set)
const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

/**
 * Load menu data from the database and format it into a readable string.
 * This will be injected into the system prompt so the AI can answer questions
 * about drinks, categories, and toppings.
 */
async function loadMenuContext() {

  // Run all queries in parallel for efficiency
  const [categoriesResult, drinksResult, toppingsResult] = await Promise.all([

    // Get active drink categories
    db.query(
      'SELECT category_id, category_name FROM drink_category WHERE is_active = true ORDER BY category_id'
    ),

    // Get drinks and join with category names
    db.query(`
      SELECT d.drink_id, d.drink_name, d.base_price, dc.category_name
      FROM drink d
      JOIN drink_category dc ON d.category_id = dc.category_id
      WHERE dc.is_active = true
      ORDER BY d.category_id, d.drink_name
    `),

    // Get all toppings
    db.query(
      'SELECT topping_id, topping_name, topping_price FROM topping ORDER BY topping_id'
    ),
  ]);

  // Build a formatted string describing the full menu
  return [
    'Categories:',

    // Format categories
    ...categoriesResult.rows.map(
      (category) => `- ${category.category_id}: ${category.category_name}`
    ),

    '',

    'Drinks:',

    // Format drinks with category and price
    ...drinksResult.rows.map(
      (drink) =>
        `- ${drink.drink_name} (${drink.category_name}) - $${Number(
          drink.base_price
        ).toFixed(2)}`
    ),

    '',

    'Toppings:',

    // Format toppings with price
    ...toppingsResult.rows.map(
      (topping) =>
        `- ${topping.topping_name} - $${Number(
          topping.topping_price
        ).toFixed(2)}`
    ),
  ].join('\n'); // Join everything into a single string with line breaks
}

/**
 * POST /chat
 * Handles incoming chatbot messages and returns an AI-generated reply.
 */
router.post('/chat', async (req, res) => {
  try {
    // Extract messages from request body
    const { messages } = req.body;

    // Ensure API key exists
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: 'OPENROUTER_API_KEY is not set' });
    }

    // Validate messages input
    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: 'messages must be a non-empty array' });
    }

    // Load menu data to give the AI context
    const menuContext = await loadMenuContext();

    // Build the message list for the AI
    const chatMessages = [
      {
        role: 'system',

        // System prompt defines how the assistant should behave
        content: `You are the personal assistant for the Reveille Boba ordering app.\n\nUse the menu data below as your source of truth when answering questions about drinks, categories, prices, and toppings. Keep answers concise and helpful. If the user asks for something not on the menu, say so clearly. If the user asks about ordering, explain the customer flow in the app.\n\nMenu data:\n${menuContext}`,
      },

      // Include up to the last 10 valid user/assistant messages
      ...messages
        .filter((message) => message && typeof message.content === 'string')
        .slice(-10)
        .map((message) => ({
          // Ensure only valid roles are passed
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        })),
    ];

    // Call the OpenRouter/OpenAI API to generate a response
    const completion = await openai.chat.completions.create({
      model,               // Model name
      messages: chatMessages, // Conversation history
      temperature: 0.3,    // Lower = more consistent answers
      max_tokens: 500,     // Limit response length
    });

    // Safely extract the assistant's reply
    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      'I could not generate a response right now.';

    // Send reply back to frontend
    res.json({ reply });
  } catch (error) {
    // Log full error for debugging
    console.error('Assistant route error:', error);

    // Send generic error response
    res.status(500).json({ error: 'Assistant request failed' });
  }
});

// Export router so it can be used in the main server
module.exports = router;