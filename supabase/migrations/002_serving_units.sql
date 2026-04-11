-- Add serving_units (1人前単位プリセット) and common_use (利用シーンヒント) to foods.
--
-- serving_units is a JSON array where each element describes a natural unit:
--   [{"label":"M玉1個","grams":50,"default":true},
--    {"label":"L玉1個","grams":60},
--    {"label":"1パック","grams":110}]
-- common_use is a free-text hint about how/when the food is typically used.

ALTER TABLE foods
  ADD COLUMN IF NOT EXISTS serving_units jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE foods
  ADD COLUMN IF NOT EXISTS common_use text;

-- Partial index for ordering: foods with serving units rank higher in search.
CREATE INDEX IF NOT EXISTS idx_foods_has_serving_units
  ON foods ((jsonb_array_length(serving_units) > 0));
