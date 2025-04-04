# Just Another TD

This is a Tower Defense game where you can create and share custom maps.

## Database Migrations

### Adding Play Count Column

To enable tracking of plays for custom maps, execute the following SQL script in your Supabase SQL editor:

```sql
-- Add play_count column to maps table if it doesn't exist
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0;

-- Create index for sorting by play count
CREATE INDEX IF NOT EXISTS idx_maps_play_count ON maps(play_count DESC);
```

This migration adds a `play_count` column to track how many times each custom map has been played, and creates an index for efficient sorting by play count. 