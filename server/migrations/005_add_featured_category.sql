-- Migration: Add Featured category for weather-based drink recommendations
-- This category will be populated by the frontend/API based on real-time weather data

BEGIN;

INSERT INTO drink_category (category_id, category_name, is_active)
SELECT (COALESCE(MAX(category_id), 0) + 1), 'Featured', true
FROM drink_category
WHERE NOT EXISTS (
  SELECT 1 FROM drink_category WHERE category_name = 'Featured'
);

COMMIT;
