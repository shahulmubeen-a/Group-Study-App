/*
  # Add meetings table and related features

  1. New Tables
    - `meetings`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references groups)
      - `topic` (text)
      - `jitsi_link` (text)
      - `scheduled_for` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on meetings table
    - Add policies for group members to read and create meetings
*/

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  topic text NOT NULL,
  jitsi_link text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Allow group members to view meetings
CREATE POLICY "Group members can view meetings"
  ON meetings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = meetings.group_id
      AND user_id = auth.uid()
    )
  );

-- Allow group members to create meetings
CREATE POLICY "Group members can create meetings"
  ON meetings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = meetings.group_id
      AND user_id = auth.uid()
    )
  );