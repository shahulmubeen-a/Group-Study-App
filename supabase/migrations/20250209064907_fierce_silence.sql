/*
  # Add group_id to messages table

  1. Changes
    - Add group_id column to messages table
    - Add foreign key constraint to groups table
    - Update RLS policies to check group membership
  
  2. Security
    - Only group members can read messages from their groups
    - Only group members can send messages to their groups
*/

-- Add group_id column
ALTER TABLE messages
ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON messages;

-- Create new policies
CREATE POLICY "Group members can read messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = messages.group_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = messages.group_id
      AND user_id = auth.uid()
    )
  );