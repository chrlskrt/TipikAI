-- Migration: Add title and updated_at columns to chats table
-- Run this migration on your database

-- Add title column to store the wizard topic
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add updated_at column for tracking changes
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);

-- Create an index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);
