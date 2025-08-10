-- Create storage bucket for poll images
insert into storage.buckets (id, name, public)
values ('poll-images', 'poll-images', true);

-- Allow authenticated users to upload images
create policy "Users can upload poll images"
  on storage.objects for insert
  with check (
    bucket_id = 'poll-images' 
    and auth.role() = 'authenticated'
  );

-- Allow public read access to poll images
create policy "Poll images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'poll-images');

-- Allow users to update their own images
create policy "Users can update their own poll images"
  on storage.objects for update
  using (
    bucket_id = 'poll-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own images
create policy "Users can delete their own poll images"
  on storage.objects for delete
  using (
    bucket_id = 'poll-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
