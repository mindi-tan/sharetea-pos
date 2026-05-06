BEGIN;

ALTER TABLE drink
  ADD COLUMN IF NOT EXISTS drink_size VARCHAR(1);

UPDATE drink
SET drink_size = 'M'
WHERE drink_size IS NULL;

ALTER TABLE drink
  ALTER COLUMN drink_size SET DEFAULT 'M';

ALTER TABLE drink
  ALTER COLUMN drink_size SET NOT NULL;

ALTER TABLE drink
  ADD CONSTRAINT drink_size_check
  CHECK (drink_size IN ('S', 'M', 'L'));

COMMIT;