-- Fix search path for handle_group_deletion function
CREATE OR REPLACE FUNCTION handle_group_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all messages in the group
  DELETE FROM messages WHERE group_id = OLD.id;
  
  -- Delete all meetings in the group
  DELETE FROM meetings WHERE group_id = OLD.id;
  
  -- Delete all group members
  DELETE FROM group_members WHERE group_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Fix search path for handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, bio, topics, theme)
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), 'User'),
    'I''m here to learn and teach',
    ARRAY[]::text[],
    'dark'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;