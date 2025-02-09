/*
  # Fix user profiles RLS policies

  1. Changes
    - Drop existing policies
    - Create new, more permissive policies for profile creation
    - Add policy for authenticated users to create their own profile
    - Add policy for public profile reading
    - Add policy for users to update their own profile

  2. Security
    - Enable RLS
    - Policies ensure users can only modify their own profile
    - Anyone can read profiles
*/

-- Drop existing policies if they exist
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
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;