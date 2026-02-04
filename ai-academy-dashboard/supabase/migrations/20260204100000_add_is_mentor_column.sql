-- Migration: Add is_mentor column for mentor permissions
-- Date: 2026-02-04
-- Description: Add is_mentor flag to participants table for review permissions
-- Security: Fixes vulnerability where all authenticated users could review submissions

-- Add is_mentor column to participants
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS is_mentor BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient mentor lookups
CREATE INDEX IF NOT EXISTS idx_participants_is_mentor ON participants(is_mentor) WHERE is_mentor = true;
