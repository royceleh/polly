-- Add poll_type column to polls table
ALTER TABLE polls ADD COLUMN poll_type TEXT NOT NULL DEFAULT 'binary' CHECK (poll_type IN ('binary', 'multiple'));

-- Create options table for multiple-option polls
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL CHECK (char_length(option_text) <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on poll_options
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for poll_options
-- Users can view all options for public polls
CREATE POLICY "Users can view poll options" ON poll_options
  FOR SELECT USING (true);

-- Users can insert options for their own polls
CREATE POLICY "Users can insert options for their own polls" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- Users can update options for their own polls
CREATE POLICY "Users can update options for their own polls" ON poll_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- Users can delete options for their own polls
CREATE POLICY "Users can delete options for their own polls" ON poll_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- Create poll_option_votes table for multiple-option poll votes
CREATE TABLE poll_option_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- Ensure one vote per user per poll
);

-- Enable RLS on poll_option_votes
ALTER TABLE poll_option_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for poll_option_votes
-- Users can view all votes for public polls
CREATE POLICY "Users can view poll option votes" ON poll_option_votes
  FOR SELECT USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can insert their own votes" ON poll_option_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes" ON poll_option_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON poll_option_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX idx_poll_option_votes_poll_id ON poll_option_votes(poll_id);
CREATE INDEX idx_poll_option_votes_user_id ON poll_option_votes(user_id);
CREATE INDEX idx_poll_option_votes_option_id ON poll_option_votes(option_id);
