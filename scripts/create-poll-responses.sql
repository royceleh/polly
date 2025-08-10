-- Create poll responses table
create table poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  answer boolean not null,
  created_at timestamptz default now(),
  unique (poll_id, user_id) -- Prevent multiple responses per user per poll
);

-- Enable RLS
alter table poll_responses enable row level security;

-- RLS Policies
-- Users can insert their own responses
create policy "Users can insert their own responses"
  on poll_responses for insert 
  with check (auth.uid() = user_id);

-- Responses are readable by everyone
create policy "Responses are readable by everyone"
  on poll_responses for select 
  using (true);

-- Users can view their own responses
create policy "Users can view their own responses"
  on poll_responses for select 
  using (auth.uid() = user_id);
