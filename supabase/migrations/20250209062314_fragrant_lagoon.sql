/*
  # Enable realtime for messages table

  1. Changes
    - Enable realtime for messages table to support live updates
*/

ALTER PUBLICATION supabase_realtime ADD TABLE messages;