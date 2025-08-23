-- Test query to check if poll options are being loaded
-- Run this in your Supabase SQL Editor to debug the issue

-- Check if poll_options table has data
SELECT 
  p.id as poll_id,
  p.question,
  p.poll_type,
  COUNT(po.id) as options_count,
  ARRAY_AGG(po.option_text) as option_texts
FROM polls p
LEFT JOIN poll_options po ON p.id = po.poll_id
WHERE p.poll_type = 'multiple'
GROUP BY p.id, p.question, p.poll_type
ORDER BY p.created_at DESC;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'poll_options';

-- Test direct query without RLS
SELECT 
  p.id as poll_id,
  p.poll_type,
  po.id as option_id,
  po.option_text
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
WHERE p.poll_type = 'multiple'
ORDER BY p.created_at DESC, po.created_at;
