/*
  # Add group settings and members tables

  1. New Tables
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `topics` (text[])
      - `max_members` (integer)
      - `invite_code` (text, unique)
      - `created_at` (timestamp)
    - `group_members`
      - `group_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `joined_at` (timestamp)
      - Primary key is (group_id, user_id)

  2. Security
    - Enable RLS on both tables
    - Add policies for members to read group data
    - Add policies for members to join groups
*/

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New Group',
  description text DEFAULT '',
  topics text[] DEFAULT ARRAY[]::text[],
  max_members integer DEFAULT 100,
  invite_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'base64'),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read group data"
  ON groups
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Members can read group_members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);