-- Migration: Convert messages.content from TEXT to JSONB
-- This allows storing structured data like dataset search and model training responses

-- Step 1: Add a temporary JSONB column
ALTER TABLE messages ADD COLUMN content_jsonb JSONB;

-- Step 2: Migrate existing text data to JSONB format
-- Wrap existing text messages in {"text": "..."} structure
UPDATE messages 
SET content_jsonb = jsonb_build_object('text', content)
WHERE content IS NOT NULL;

-- Step 3: Drop the old TEXT column
ALTER TABLE messages DROP COLUMN content;

-- Step 4: Rename the new JSONB column to content
ALTER TABLE messages RENAME COLUMN content_jsonb TO content;

-- Step 5: Add index for better JSONB query performance
CREATE INDEX idx_messages_content_gin ON messages USING GIN (content);

-- Add comment to document the column purpose
COMMENT ON COLUMN messages.content IS 'JSONB column storing message content. Can be text messages {"text": "..."} or structured data like dataset search/model training responses';
