-- Create polls table
create table polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question text not null check (char_length(question) <= 120),
  image_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table polls enable row level security;

-- RLS Policies
-- Users can insert their own polls
create policy "Users can insert their own polls"
  on polls for insert 
  with check (auth.uid() = user_id);

-- Polls are readable by everyone
create policy "Polls are readable by everyone"
  on polls for select 
  using (true);

-- Users can update their own polls
create policy "Users can update their own polls"
  on polls for update 
  using (auth.uid() = user_id);

-- Users can delete their own polls
create policy "Users can delete their own polls"
  on polls for delete 
  using (auth.uid() = user_id);
