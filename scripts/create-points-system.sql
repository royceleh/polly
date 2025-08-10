-- Create user_points table
create table user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table user_points enable row level security;

-- RLS Policies
-- Users can view their own points
create policy "Users can view their own points"
  on user_points for select 
  using (auth.uid() = user_id);

-- Users can insert their own points record
create policy "Users can insert their own points"
  on user_points for insert 
  with check (auth.uid() = user_id);

-- Users can update their own points
create policy "Users can update their own points"
  on user_points for update 
  using (auth.uid() = user_id);

-- Function to handle new user creation (create points record)
create or replace function public.handle_new_user_points()
returns trigger 
security definer set search_path = public
language plpgsql
as $$
begin
  insert into public.user_points (user_id, points)
  values (new.id, 0)
  on conflict (user_id) do nothing;
  return new;
exception
  when others then
    -- Log error but don't fail the auth process
    raise log 'Error creating user points for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Trigger to create points record for new users
drop trigger if exists on_auth_user_created_points on auth.users;
create trigger on_auth_user_created_points
  after insert on auth.users
  for each row execute function public.handle_new_user_points();

-- Function to increment points when user answers a poll
create or replace function public.increment_user_points()
returns trigger 
security definer set search_path = public
language plpgsql
as $$
begin
  -- Insert or update user points (increment by 1)
  insert into public.user_points (user_id, points, updated_at)
  values (new.user_id, 1, now())
  on conflict (user_id) 
  do update set 
    points = user_points.points + 1,
    updated_at = now();
  
  return new;
exception
  when others then
    -- Log error but don't fail the poll response
    raise log 'Error incrementing points for user %: %', new.user_id, sqlerrm;
    return new;
end;
$$;

-- Trigger to increment points when user responds to a poll
drop trigger if exists on_poll_response_points on poll_responses;
create trigger on_poll_response_points
  after insert on poll_responses
  for each row execute function public.increment_user_points();

-- Create indexes for better performance
create index if not exists idx_user_points_user_id on user_points(user_id);
create index if not exists idx_user_points_points on user_points(points desc);
