-- Run once against the project DB (e.g. psql on AWS) before deploy that sends drink_size.
ALTER TABLE order_item
  ADD COLUMN IF NOT EXISTS drink_size VARCHAR(1) NOT NULL DEFAULT 'M';

ALTER TABLE order_item
  DROP CONSTRAINT IF EXISTS order_item_drink_size_check;

ALTER TABLE order_item
  ADD CONSTRAINT order_item_drink_size_check
  CHECK (drink_size IN ('S', 'M', 'L'));
