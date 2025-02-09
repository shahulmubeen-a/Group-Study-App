/*
  # Fix user profiles RLS policies

  1. Changes
    - Drop existing policies
    - Add proper RLS policies for user profiles table
    - Fix insert policy to allow authenticated users to create their own profile
    - Fix update policy to allow users to update their own profile
    - Fix select policy to allow public access to profiles

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Recreate policies with proper permissions
CREATE POLICY "Anyone can view profiles"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;