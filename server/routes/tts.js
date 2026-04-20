const express = require('express');
const router = express.Router();

// Default voice ID (Rachel — clear, neutral American voice, free-tier accessible).
// You can swap this for any voice ID from your ElevenLabs voice library.
const DEFAULT_VOICE_ID = 'CwhRBWXzGAHq8TQ4Fs17';

// POST /api/tts
// Body: { text: string, voice_id?: string }
// Response: audio/mpeg (MP3 bytes)
router.post('/', async (req, res) => {
  try {
    const { text, voice_id = DEFAULT_VOICE_ID } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    // Cap input length to protect free-tier quota (10k chars/month).
    if (text.length > 500) {
      return res.status(400).json({ error: 'text exceeds 500 character limit' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY is not set');
      return res.status(500).json({ error: 'TTS service not configured' });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        // multilingual model handles English + translated text (Spanish, Chinese, etc.)
        model_id: 'eleven_multilingual_v2',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'TTS request failed',
        details: errorText,
      });
    }

    // Stream the MP3 bytes back to the browser so the frontend can play them
    res.setHeader('Content-Type', 'audio/mpeg');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'TTS failed' });
  }
});

module.exports = router;
