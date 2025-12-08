
-- Add subscription columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + interval '14 days'),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'canceled', 'expired'
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'start', -- 'start', 'pro', 'max', 'elite'
ADD COLUMN IF NOT EXISTS max_agents INTEGER DEFAULT 999, -- 999 for start/trial, 2 for pro, 5 for max, 9 for elite
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;

-- Backfill existing organizations to give them a 14-day trial from NOW if they don't have one
UPDATE organizations 
SET 
    trial_ends_at = NOW() + interval '14 days',
    subscription_status = 'trial',
    plan_tier = 'start',
    max_agents = 999
WHERE trial_ends_at IS NULL;
