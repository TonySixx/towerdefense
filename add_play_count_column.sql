-- Add play_count column to maps table if it doesn't exist
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;

-- Create index for sorting by play count
CREATE INDEX IF NOT EXISTS idx_maps_play_count ON maps(play_count DESC); 