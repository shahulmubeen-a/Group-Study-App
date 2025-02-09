/*
  # Add secure user email access

  1. Changes
    - Add function to safely access user emails
    - Grant necessary permissions

  2. Security
    - Function runs with security definer
    - Limited to email access only
*/

-- Create a secure function to get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;