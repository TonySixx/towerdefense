-- Create tables for Tower Defense maps and ratings

-- Maps table
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    map_data JSONB NOT NULL,
    author TEXT NOT NULL,
    average_rating FLOAT DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add a unique constraint to prevent duplicate map names
ALTER TABLE maps ADD CONSTRAINT unique_map_name UNIQUE (name);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    user_nickname TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Each user can rate a map only once (but can update their rating)
    UNIQUE (map_id, user_nickname)
);

-- Create an index for performance on frequent queries
CREATE INDEX IF NOT EXISTS idx_maps_name ON maps(name);
CREATE INDEX IF NOT EXISTS idx_maps_rating ON maps(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_maps_author ON maps(author);
CREATE INDEX IF NOT EXISTS idx_ratings_map_id ON ratings(map_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_nickname);

-- Enable Row Level Security
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maps

-- Anyone can view maps
CREATE POLICY "Anyone can view maps"
ON maps
FOR SELECT
USING (true);

-- Only the author can update their maps
CREATE POLICY "Authors can update their own maps"
ON maps
FOR UPDATE
USING (author = current_setting('request.headers.x-user-nickname', true)::text);

-- Only the author can delete their maps
CREATE POLICY "Authors can delete their own maps"
ON maps
FOR DELETE
USING (author = current_setting('request.headers.x-user-nickname', true)::text);

-- Anyone can create a map
CREATE POLICY "Anyone can create a map"
ON maps
FOR INSERT
WITH CHECK (true);

-- RLS Policies for ratings

-- Anyone can view ratings
CREATE POLICY "Anyone can view ratings"
ON ratings
FOR SELECT
USING (true);

-- Anyone can create a rating (we'll check they're not rating their own map in application logic)
CREATE POLICY "Anyone can create a rating"
ON ratings
FOR INSERT
WITH CHECK (true);

-- Only the user who created the rating can update it
CREATE POLICY "Users can only update their own ratings"
ON ratings
FOR UPDATE
USING (user_nickname = current_setting('request.headers.x-user-nickname', true)::text);

-- Functions to automatically update average ratings

-- Function to update the average rating and count when a rating is added or updated
CREATE OR REPLACE FUNCTION update_map_rating()
RETURNS TRIGGER AS $$
DECLARE
    average FLOAT;
    count INTEGER;
BEGIN
    -- Calculate new average and count
    SELECT AVG(rating), COUNT(*)
    INTO average, count
    FROM ratings
    WHERE map_id = NEW.map_id;
    
    -- Update the map with new values
    UPDATE maps
    SET average_rating = average, rating_count = count
    WHERE id = NEW.map_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update map rating when a rating is inserted or updated
CREATE TRIGGER update_map_rating_on_insert_or_update
AFTER INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_map_rating();

-- Function to update the average rating and count when a rating is deleted
CREATE OR REPLACE FUNCTION update_map_rating_on_delete()
RETURNS TRIGGER AS $$
DECLARE
    average FLOAT;
    count INTEGER;
BEGIN
    -- Calculate new average and count
    SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO average, count
    FROM ratings
    WHERE map_id = OLD.map_id;
    
    -- Update the map with new values
    UPDATE maps
    SET average_rating = average, rating_count = count
    WHERE id = OLD.map_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update map rating when a rating is deleted
CREATE TRIGGER update_map_rating_on_delete
AFTER DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_map_rating_on_delete(); 