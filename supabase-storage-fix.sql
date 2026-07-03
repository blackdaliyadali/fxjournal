-- Run this in Supabase SQL Editor if screenshots don't load
-- Makes the screenshots bucket publicly readable (needed to display images)

update storage.buckets
set public = true
where id = 'screenshots';
