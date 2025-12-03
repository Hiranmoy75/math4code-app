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
