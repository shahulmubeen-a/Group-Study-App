/*
  # Add group creator column

  1. Changes
    - Add `is_creator` column to `group_members` table
    - Set default value to false
    - Add NOT NULL constraint
    - Update existing records to have at least one creator per group

  2. Security
    - No changes to RLS policies needed as they are already properly configured
*/

-- Add is_creator column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_members' 
    AND column_name = 'is_creator'
  ) THEN
    ALTER TABLE group_members 
    ADD COLUMN is_creator boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Ensure each group has at least one creator by setting the first member as creator
WITH FirstMembers AS (
  SELECT DISTINCT ON (group_id) 
    group_id,
    user_id
  FROM group_members
  ORDER BY group_id, joined_at ASC
)
UPDATE group_members gm
SET is_creator = true
FROM FirstMembers fm
WHERE gm.group_id = fm.group_id 
AND gm.user_id = fm.user_id
AND NOT EXISTS (
  SELECT 1 
  FROM group_members 
  WHERE group_id = gm.group_id 
  AND is_creator = true
);