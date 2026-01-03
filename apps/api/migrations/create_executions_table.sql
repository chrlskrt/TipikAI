-- Migration: Create executions table for model generation workflow tracking
-- This table tracks the entire lifecycle of model generation executions

CREATE TABLE IF NOT EXISTS public.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES authentication.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  
  -- Input parameters
  model_prompt TEXT NOT NULL,
  model_format VARCHAR(50) NOT NULL,
  sources TEXT[] DEFAULT '{}',
  
  -- Execution tracking
  n8n_execution_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  current_stage VARCHAR(50),
  progress INTEGER DEFAULT 0,
  
  -- Stage-specific data (from n8n)
  -- dataset_info structure: { title, title_directory, description, url, source }
  dataset_info JSONB,
  
  -- Results with file URLs (from n8n on completion)
  -- results structure: { accuracy, precision, recall, f1Score, confusionMatrix, files: { model: {...}, notebook: {...} } }
  results JSONB,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 
    'searching_dataset', 
    'dataset_found', 
    'downloading', 
    'preprocessing', 
    'training', 
    'complete', 
    'failed', 
    'cancelled'
  )),
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_executions_user_id ON public.executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_chat_id ON public.executions(chat_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON public.executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created_at ON public.executions(created_at DESC);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER executions_updated_at_trigger
BEFORE UPDATE ON public.executions
FOR EACH ROW
EXECUTE FUNCTION update_executions_updated_at();

-- Comment on table
COMMENT ON TABLE public.executions IS 'Tracks model generation workflow executions with status updates from n8n';
