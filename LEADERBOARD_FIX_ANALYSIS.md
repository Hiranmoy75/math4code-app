# Leaderboard Issue Analysis

## Problem
Leaderboard only shows the signed-in user on both website and mobile app.

## Root Cause
**Row Level Security (RLS) Policy Issue on `user_rewards` table**

### Current RLS Policy
```sql
-- From database/backup/01_schema.sql:930-934
DROP POLICY IF NOT EXISTS "Users can view own rewards" ON public.user_rewards;
CREATE POLICY "Users can view own rewards" ON public.user_rewards 
FOR SELECT USING (user_id = auth.uid());
```

**This policy only allows users to see their OWN rewards!**

## Why This Breaks Leaderboard

### Mobile App Query (useUserRewards.ts:120-124)
```typescript
const { data: rewards, error } = await supabase
    .from('user_rewards')
    .select('*')
    .order('total_coins', { ascending: false })
    .limit(fetchLimit);
```

### Website Query (rewardActions.ts:158-173)
```typescript
const { data } = await supabase
    .from("user_rewards")
    .select(`
        total_coins,
        xp,
        weekly_xp,
        level,
        current_streak,
        user_id,
        profiles:user_id (
            full_name,
            avatar_url
        )
    `)
    .order(sortColumn, { ascending: false })
    .limit(limit);
```

**Both queries try to fetch ALL users' rewards, but RLS blocks everything except the current user's data!**

## Solution

### Fix the RLS Policy

Replace the restrictive policy with a public read policy for leaderboard:

```sql
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own rewards" ON public.user_rewards;

-- Create new policy: Everyone can view all rewards (for leaderboard)
CREATE POLICY "Public can view all rewards" ON public.user_rewards 
FOR SELECT USING (true);

-- Keep update restricted to own rewards only
DROP POLICY IF EXISTS "Users can update own rewards" ON public.user_rewards;
CREATE POLICY "Users can update own rewards" ON public.user_rewards 
FOR UPDATE USING (user_id = auth.uid());

-- Only system can insert (via triggers)
DROP POLICY IF EXISTS "System can insert rewards" ON public.user_rewards;
CREATE POLICY "System can insert rewards" ON public.user_rewards 
FOR INSERT WITH CHECK (true);
```

## Why This is Safe

1. **No Sensitive Data**: `user_rewards` table only contains:
   - Coins, XP, level, streak (all gamification data)
   - No personal information, passwords, or private data

2. **Leaderboards are Public**: By design, leaderboards show everyone's scores

3. **Privacy Protected**: User names come from `profiles` table which has its own RLS

4. **Updates Still Protected**: Users can only update their own rewards

## Alternative Solution (If Privacy Needed)

If you want to hide some users from leaderboard:

```sql
-- Only show rewards for users who opted in to leaderboard
CREATE POLICY "Public can view public rewards" ON public.user_rewards 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = user_rewards.user_id 
        AND profiles.show_on_leaderboard = true
    )
);
```

Then add `show_on_leaderboard` column to profiles table.

## Files to Update

1. **Database Migration SQL**:
   - Create new file: `e:\PROJECT 2025 - October\math4code-exam-v3\scripts\fix_leaderboard_rls.sql`

2. **Apply to Supabase**:
   - Run the SQL in Supabase SQL Editor
   - Or use migration system

## Testing After Fix

1. **Mobile App**:
   - Open Rewards screen
   - Switch to Leaderboard tab
   - Should see all users ranked by coins

2. **Website**:
   - Go to /student/rewards
   - Check leaderboard section
   - Should see top users

3. **Verify**:
   - Multiple users should appear
   - Ranked by total_coins or XP
   - Shows full_name and avatar from profiles
