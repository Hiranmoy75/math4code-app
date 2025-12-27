import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useCurrentUser } from './useCurrentUser';

export interface UserRewards {
    user_id: string;
    total_coins: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
    daily_coins_earned: number;
    last_coin_date: string;
    xp: number;
    weekly_xp: number;
    level: number;
    created_at: string;
    updated_at: string;
}

export interface RewardTransaction {
    id: string;
    user_id: string;
    amount: number;
    action_type: string;
    entity_id?: string;
    description?: string;
    created_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    earned_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    total_coins: number;
    xp: number;
    weekly_xp: number;
    level: number;
    full_name: string;
    avatar_url: string;
    rank: number;
}

export const useUserRewards = () => {
    const { data: user } = useCurrentUser();

    return useQuery({
        queryKey: ['userRewards', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            const { data, error } = await supabase
                .from('user_rewards')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data as UserRewards | null;
        },
        enabled: !!user?.id,
    });
};

export const useRewardTransactions = (limit: number = 10) => {
    const { data: user } = useCurrentUser();

    return useQuery({
        queryKey: ['rewardTransactions', user?.id, limit],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('reward_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data as RewardTransaction[];
        },
        enabled: !!user?.id,
    });
};

export const useUserBadges = () => {
    const { data: user } = useCurrentUser();

    return useQuery({
        queryKey: ['userBadges', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', user.id)
                .order('earned_at', { ascending: false });

            if (error) throw error;
            return data as UserBadge[];
        },
        enabled: !!user?.id,
    });
};

export const useLeaderboard = (type: 'weekly' | 'all_time' = 'all_time', limit: number = 20) => {
    return useQuery({
        queryKey: ['leaderboard', type, limit],
        queryFn: async () => {
            // Determine sort column based on type
            const sortColumn = type === 'weekly' ? 'weekly_xp' : 'total_coins';

            // 1. Get top rewards (fetch more to account for non-student filtering)
            const fetchLimit = limit * 3;
            const { data: rewards, error } = await supabase
                .from('user_rewards')
                .select('*')
                .order(sortColumn, { ascending: false })
                .limit(fetchLimit);

            if (error) throw error;
            if (!rewards || rewards.length === 0) return [];

            // 2. Get profiles for these users
            const userIds = rewards.map(r => r.user_id);
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // 3. Filter for students and merge
            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            const leaderboard = rewards
                .filter(r => {
                    const profile = profileMap.get(r.user_id);
                    return profile && profile.role === 'student';
                })
                .map((r, index) => ({
                    user_id: r.user_id,
                    total_coins: r.total_coins,
                    xp: r.xp,
                    weekly_xp: r.weekly_xp,
                    level: r.level,
                    full_name: profileMap.get(r.user_id)?.full_name || 'Anonymous Student',
                    avatar_url: profileMap.get(r.user_id)?.avatar_url || '',
                    // We recalculate rank after filtering
                    rank: 0
                }));

            // Re-assign ranks
            return leaderboard.slice(0, limit).map((entry, index) => ({
                ...entry,
                rank: index + 1
            })) as LeaderboardEntry[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};
