/*
  # Fix group RLS policies

  1. Security Changes
    - Add policy for authenticated users to create groups
    - Add policy for group members to update their group
*/

CREATE POLICY "Authenticated users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Group members can update group settings"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id
      AND user_id = auth.uid()
    )
  );