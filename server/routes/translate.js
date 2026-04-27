// server/routes/translate.js
//
// Proxies Google Cloud Translation API v2 with a process-local cache so we
// don't pay to re-translate the same drink names on every language switch.
// The frontend hits this with a batch of strings; we translate the ones we
// haven't seen, cache the results, and return everything in input order.
//
// Env required: GOOGLE_TRANSLATE_API_KEY (set in Render dashboard)

const express = require('express');
const router = express.Router();

// Cache key is `${target}:${sourceText}`. Survives across requests for the
// life of the Node process — Render free tier restarts on idle, which is
// fine: cold start re-translates once, then everything's hot.
const cache = new Map();

const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

router.post('/', async (req, res) => {
  const { texts, target } = req.body || {};

  if (!Array.isArray(texts) || typeof target !== 'string' || !target) {
    return res.status(400).json({ error: 'Body must be { texts: string[], target: string }' });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_TRANSLATE_API_KEY is not set');
    return res.status(500).json({ error: 'Translation service is not configured' });
  }

  // Bail early if the target is English — the source language is English, so
  // translating en -> en is just identity. Saves a network call and a quota
  // hit on the very common reset case.
  if (target === 'en') {
    return res.json({ translations: texts });
  }

  // Split into cached hits and pending requests, preserving original indices
  // so we can stitch the answer back together in order.
  const results = new Array(texts.length);
  const pendingTexts = [];
  const pendingIndices = [];

  texts.forEach((text, i) => {
    if (typeof text !== 'string' || text.length === 0) {
      results[i] = text;
      return;
    }
    const key = `${target}:${text}`;
    if (cache.has(key)) {
      results[i] = cache.get(key);
    } else {
      pendingTexts.push(text);
      pendingIndices.push(i);
    }
  });

  if (pendingTexts.length === 0) {
    return res.json({ translations: results });
  }

  try {
    const url = `${TRANSLATE_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: pendingTexts,
        target,
        source: 'en',
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Translate API error:', response.status, errorText);
      // Fall back to returning originals so the UI doesn't break — user just
      // sees English for the uncached strings until the API recovers.
      pendingIndices.forEach((origIndex, i) => {
        results[origIndex] = pendingTexts[i];
      });
      return res.json({ translations: results, partial: true });
    }

    const data = await response.json();
    const translations = data?.data?.translations;

    if (!Array.isArray(translations) || translations.length !== pendingTexts.length) {
      console.error('Unexpected Google Translate response shape:', data);
      pendingIndices.forEach((origIndex, i) => {
        results[origIndex] = pendingTexts[i];
      });
      return res.json({ translations: results, partial: true });
    }

    // Cache and stitch
    translations.forEach((entry, i) => {
      const translatedText = entry.translatedText;
      const original = pendingTexts[i];
      const origIndex = pendingIndices[i];
      cache.set(`${target}:${original}`, translatedText);
      results[origIndex] = translatedText;
    });

    res.json({ translations: results });
  } catch (err) {
    console.error('Translation request failed:', err);
    // Same fallback: send originals so the page still renders
    pendingIndices.forEach((origIndex, i) => {
      results[origIndex] = pendingTexts[i];
    });
    res.json({ translations: results, partial: true });
  }
});

module.exports = router;
