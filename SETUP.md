# PredictPoll - Local Development Setup Guide

## Prerequisites

Before setting up the application locally, ensure you have the following installed:

### Required Software:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (recommended) or npm - Install with: `npm install -g pnpm`
- **Git** - [Download here](https://git-scm.com/)

### Supabase Account:
- **Supabase Account** - [Sign up here](https://supabase.com/)
- **Supabase Project** - You'll need to create a new project

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd supabase-auth

# Install dependencies using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

## Step 2: Set Up Supabase Project

### 2.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name:** `predictpoll` (or your preferred name)
   - **Database Password:** Generate a strong password
   - **Region:** Choose closest to your location
5. Click "Create new project"

### 2.2 Get Project Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ`)

### 2.3 Set Up Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL scripts in order:

#### Create Polls Schema:
```sql
-- Run scripts/create-polls-schema.sql
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
```

#### Create Poll Responses:
```sql
-- Run scripts/create-poll-responses.sql
-- Create poll_responses table
create table poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  answer boolean not null,
  created_at timestamptz default now(),
  unique(poll_id, user_id)
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
```

#### Create Points System:
```sql
-- Run scripts/create-points-system.sql
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
```

#### Create Rewards System:
```sql
-- Run scripts/create-rewards-system.sql
-- Create rewards table
create table rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  points_required int not null check (points_required > 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create reward_redemptions table
create table reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid references rewards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  points_spent int not null,
  redeemed_at timestamptz default now()
);

-- Enable RLS
alter table rewards enable row level security;
alter table reward_redemptions enable row level security;

-- RLS Policies for rewards
-- Everyone can view active rewards
create policy "Active rewards are viewable by everyone"
  on rewards for select 
  using (is_active = true);

-- RLS Policies for reward_redemptions
-- Users can view their own redemptions
create policy "Users can view their own redemptions"
  on reward_redemptions for select 
  using (auth.uid() = user_id);

-- Users can insert their own redemptions
create policy "Users can insert their own redemptions"
  on reward_redemptions for insert 
  with check (auth.uid() = user_id);

-- Function to handle reward redemption with point validation
create or replace function public.redeem_reward(
  p_reward_id uuid,
  p_user_id uuid
)
returns json
security definer set search_path = public
language plpgsql
as $$
declare
  v_reward_points int;
  v_user_points int;
  v_reward_name text;
  v_redemption_id uuid;
begin
  -- Check if reward exists and is active
  select points_required, name into v_reward_points, v_reward_name
  from rewards 
  where id = p_reward_id and is_active = true;
  
  if not found then
    return json_build_object('success', false, 'error', 'Reward not found or inactive');
  end if;
  
  -- Get user's current points
  select points into v_user_points
  from user_points 
  where user_id = p_user_id;
  
  if not found then
    -- Create user points record if it doesn't exist
    insert into user_points (user_id, points) values (p_user_id, 0);
    v_user_points := 0;
  end if;
  
  -- Check if user has enough points
  if v_user_points < v_reward_points then
    return json_build_object(
      'success', false, 
      'error', 'Insufficient points. You need ' || v_reward_points || ' points but only have ' || v_user_points || '.'
    );
  end if;
  
  -- Start transaction for redemption
  begin
    -- Deduct points from user
    update user_points 
    set points = points - v_reward_points,
        updated_at = now()
    where user_id = p_user_id;
    
    -- Record redemption
    insert into reward_redemptions (reward_id, user_id, points_spent)
    values (p_reward_id, p_user_id, v_reward_points)
    returning id into v_redemption_id;
    
    return json_build_object(
      'success', true, 
      'message', 'Successfully redeemed "' || v_reward_name || '" for ' || v_reward_points || ' points!',
      'redemption_id', v_redemption_id,
      'points_spent', v_reward_points
    );
    
  exception
    when others then
      return json_build_object('success', false, 'error', 'Failed to process redemption: ' || sqlerrm);
  end;
end;
$$;

-- Insert some sample rewards
insert into rewards (name, description, points_required) values
  ('Coffee Voucher', 'Get a free coffee at participating cafes', 50),
  ('Premium Badge', 'Unlock a special badge for your profile', 100),
  ('Poll Boost', 'Feature your next poll at the top for 24 hours', 150),
  ('Custom Theme', 'Unlock exclusive color themes for your dashboard', 200),
  ('VIP Status', 'Get VIP status for 30 days with exclusive features', 500);

-- Create indexes for better performance
create index if not exists idx_rewards_active on rewards(is_active, points_required);
create index if not exists idx_reward_redemptions_user_id on reward_redemptions(user_id);
create index if not exists idx_reward_redemptions_reward_id on reward_redemptions(reward_id);
```

#### Create Storage Bucket:
```sql
-- Run scripts/create-storage-bucket.sql
-- Create storage bucket for poll images
insert into storage.buckets (id, name, public) 
values ('poll-images', 'poll-images', true);

-- Create storage policy for poll images
create policy "Poll images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'poll-images');

-- Create storage policy for authenticated users to upload
create policy "Authenticated users can upload poll images"
  on storage.objects for insert
  with check (
    bucket_id = 'poll-images' 
    and auth.role() = 'authenticated'
  );

-- Create storage policy for users to update their own images
create policy "Users can update their own poll images"
  on storage.objects for update
  using (
    bucket_id = 'poll-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policy for users to delete their own images
create policy "Users can delete their own poll images"
  on storage.objects for delete
  using (
    bucket_id = 'poll-images' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Step 3: Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Create the environment file
touch .env.local
```

Add the following environment variables to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: For development
NODE_ENV=development
```

**Replace the values with your actual Supabase project credentials from Step 2.2.**

## Step 4: Run the Application

### Development Mode:
```bash
# Start the development server
pnpm dev

# Or using npm
npm run dev
```

The application will be available at: `http://localhost:3000`

### Build for Production:
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Step 5: Verify Setup

1. **Open your browser** and navigate to `http://localhost:3000`
2. **You should see** the PredictPoll homepage
3. **Click "Sign Up"** to create a new account
4. **Verify authentication** works by logging in
5. **Test poll creation** by creating a new poll
6. **Test voting** by answering polls
7. **Check points system** by viewing your dashboard
8. **Test rewards** by redeeming points for rewards

## Troubleshooting

### Common Issues:

#### 1. Environment Variables Not Set
**Error:** "Connect Supabase to get started"
**Solution:** Ensure your `.env.local` file exists and contains the correct Supabase credentials.

#### 2. Database Schema Not Created
**Error:** Database errors when creating polls or voting
**Solution:** Run all the SQL scripts in the correct order as shown above.

#### 3. Storage Bucket Not Created
**Error:** Image upload fails
**Solution:** Ensure the storage bucket and policies are created in Supabase.

#### 4. Port Already in Use
**Error:** "Port 3000 is already in use"
**Solution:** 
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev --port 3001
```

#### 5. Dependencies Not Installed
**Error:** Module not found errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Development Tips:

1. **Check Supabase Logs:** Monitor your Supabase project logs for any database errors
2. **Use Browser DevTools:** Check the console for any JavaScript errors
3. **Verify RLS Policies:** Ensure your Row Level Security policies are working correctly
4. **Test Authentication:** Make sure users can sign up, log in, and log out properly

## Next Steps

Once your local setup is working:

1. **Create some test data** by creating polls and voting
2. **Test the rewards system** by redeeming points
3. **Explore the codebase** to understand the architecture
4. **Start developing new features** based on the PRD roadmap

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your Supabase project configuration
3. Ensure all environment variables are set correctly
4. Check that all database tables and policies are created

---

**Happy coding! 🚀** 