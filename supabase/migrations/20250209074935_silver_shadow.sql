/*
  # Add theme field to user profiles

  1. Changes
    - Add theme field to user_profiles table with default value 'dark'
    - Update existing rows to have the default theme
*/

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark';

-- Update any existing rows to have the default theme
UPDATE user_profiles
SET theme = 'dark'
WHERE theme IS NULL;