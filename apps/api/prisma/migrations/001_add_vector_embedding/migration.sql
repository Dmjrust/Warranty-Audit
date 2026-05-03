-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to rag_documents
ALTER TABLE rag_documents
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create IVFFlat index for approximate nearest neighbour search
CREATE INDEX IF NOT EXISTS rag_documents_embedding_idx
  ON rag_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
