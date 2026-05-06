-- Migration: Rename specific drinks under the `Coffee` category to coffee-style names
-- Idempotent: safe to run multiple times

BEGIN;

-- Ensure `Coffee` category exists
INSERT INTO drink_category (category_name, is_active)
SELECT 'Coffee', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM drink_category WHERE LOWER(TRIM(category_name)) = 'coffee'
);

-- Update the listed drink names (only for drinks currently in the `Coffee` category)
UPDATE drink d
SET drink_name = CASE LOWER(TRIM(d.drink_name))
  WHEN 'boba fresh milk' THEN 'Espresso'
  WHEN 'fresh black milk tea' THEN 'Americano'
  WHEN 'matcha with fresh milk' THEN 'Latte'
  WHEN 'normal milk' THEN 'Cappuccino'
  WHEN 'virginia milk' THEN 'Macchiato'
  WHEN 'wintermelon with fresh milk' THEN 'Flat White'
  ELSE d.drink_name
END
FROM drink_category dc
WHERE d.category_id = dc.category_id
  AND LOWER(TRIM(dc.category_name)) = 'coffee'
  AND LOWER(TRIM(d.drink_name)) IN (
    'boba fresh milk', 'fresh black milk tea', 'matcha with fresh milk',
    'normal milk', 'virginia milk', 'wintermelon with fresh milk'
  );

COMMIT;
