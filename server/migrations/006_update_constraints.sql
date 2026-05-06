-- Migration: Update order_item constraints to allow HOT and 125% sweetness

-- Drop old constraints
ALTER TABLE order_item DROP CONSTRAINT order_item_ice_level_check;
ALTER TABLE order_item DROP CONSTRAINT order_item_sweetness_level_check;

-- Add new constraints with HOT and 125%
ALTER TABLE order_item
ADD CONSTRAINT order_item_ice_level_check
CHECK (ice_level IN ('NO_ICE', 'LESS_ICE', 'NORMAL_ICE', 'HOT'));

ALTER TABLE order_item
ADD CONSTRAINT order_item_sweetness_level_check
CHECK (sweetness_level IN ('0', '50', '100', '125'));
