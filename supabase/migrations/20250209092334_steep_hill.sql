/*
  # Add cascade delete triggers for groups

  1. Changes
    - Add triggers to automatically delete related data when a group is deleted:
      - Messages
      - Meetings
      - Group members
  
  2. Security
    - Only group creators can delete groups
    - Automatic cleanup of all related data
*/

-- Create function to handle group deletion cleanup
CREATE OR REPLACE FUNCTION handle_group_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all messages in the group
  DELETE FROM messages WHERE group_id = OLD.id;
  
  -- Delete all meetings in the group
  DELETE FROM meetings WHERE group_id = OLD.id;
  
  -- Delete all group members
  DELETE FROM group_members WHERE group_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before group deletion
DROP TRIGGER IF EXISTS before_group_delete ON groups;
CREATE TRIGGER before_group_delete
  BEFORE DELETE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION handle_group_deletion();

-- Add policy to only allow group creators to delete groups
DROP POLICY IF EXISTS "Group creators can delete groups" ON groups;
CREATE POLICY "Group creators can delete groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id
      AND user_id = auth.uid()
      AND is_creator = true
    )
  );