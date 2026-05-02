-- Optional: run on the project PostgreSQL so POS has a "Hot Drinks" category and hot items can be filtered in the API.
-- Frontend/Cashier recognize category_name exactly as 'Hot Drinks' (case-insensitive match is not used).

INSERT INTO drink_category (category_name, is_active)
SELECT 'Hot Drinks', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM drink_category WHERE LOWER(TRIM(category_name)) = 'hot drinks'
);

-- Assign hot items: adjust names/IDs to match your `drink` table. Uncomment and edit as needed.
/*
UPDATE drink d
SET category_id = hc.category_id
FROM (SELECT category_id FROM drink_category WHERE LOWER(TRIM(category_name)) = 'hot drinks' LIMIT 1) AS hc
WHERE d.drink_name IN (
  'Hot Chocolate',
  'Hot Americano',
  'Hot Latte',
  'Honey Ginger Tea',
  'Hot Black Tea',
  'Hot Jasmine Green Tea'
);
*/
