-- Add fcm_token column to user_details table for push notifications
-- Run this migration in your Supabase SQL Editor

ALTER TABLE user_details 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_details_fcm_token ON user_details(fcm_token) WHERE fcm_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_details.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
