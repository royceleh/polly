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
