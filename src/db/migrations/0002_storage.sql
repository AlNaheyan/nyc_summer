-- Storage bucket for quest photos (Phase 2).
-- Public read so the feed can serve images directly. Uploads happen
-- server-side with the service-role client (bypasses storage RLS), and photos
-- that fail moderation are deleted immediately, so a public bucket is safe:
-- only allowed/flagged images ever persist, and only allowed ones are surfaced.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quest-photos',
  'quest-photos',
  true,
  10485760,                                  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
