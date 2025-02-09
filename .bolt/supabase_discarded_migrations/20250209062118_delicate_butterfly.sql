/*
  # Enable realtime for messages table

  1. Changes
    - Enable realtime for messages table to allow live updates
*/

alter table messages replica identity full;