import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { TENANT_ID } from '../utils/tenant';

type ActionType = 'login' | 'video_watch' | 'lesson_completion' | 'quiz_completion' | 'module_completion' | 'referral' | 'bonus' | 'mission_complete';

/**
 * Get tenant ID from environment
 */
const getTenantId = (): string => {
    return TENANT_ID;
};

export const rewardService = {
    /**
     * Get reward status for a user (RPC)
     */
    async getRewardStatus(userId: string) {
        const tenantId = getTenantId();

        const { data, error } = await supabase.rpc('get_user_rewards', {
            p_user_id: userId,
            p_tenant_id: tenantId
        });

        if (error) {
            console.error('Error getting user rewards:', error);
            return null;
        }

        // RPC returns array, get first element
        return data?.[0] || null;
    },

    /**
     * Award coins to a user (RPC)
     */
    async awardCoins(userId: string, action: ActionType, entityId?: string, description?: string) {
        const tenantId = getTenantId();

        // Use database function - handles everything!
        const { data, error } = await supabase.rpc('award_coins', {
            p_user_id: userId,
            p_tenant_id: tenantId,
            p_action_type: action,
            p_entity_id: entityId || null,
            p_description: description || null
        });

        if (error) {
            console.error('Error awarding coins:', error);
            return { success: false, message: "Failed to process reward" };
        }

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['userRewards', userId] });
        queryClient.invalidateQueries({ queryKey: ['rewardTransactions', userId] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

        return data || { success: false, message: "Unknown error" };
    },

    /**
     * Check and update user streak (RPC)
     */
    async checkStreak(userId: string) {
        const tenantId = getTenantId();

        // Use database function
        const { data, error } = await supabase.rpc('get_user_streak', {
            p_user_id: userId,
            p_tenant_id: tenantId
        });

        if (error) {
            console.error('Error getting streak:', error);
            return { streak: 0, message: null };
        }

        return data || { streak: 0, message: null };
    },

    /**
     * Check badge unlock (keep as is - no RPC needed)
     */
    async checkBadgeUnlock(userId: string, badgeId: string) {
        const tenantId = getTenantId();

        const { data: existing } = await supabase
            .from("user_badges")
            .select("*")
            .eq("user_id", userId)
            .eq("tenant_id", tenantId)
            .eq("badge_id", badgeId)
            .single();

        if (existing) return;

        await supabase.from("user_badges").insert({
            user_id: userId,
            tenant_id: tenantId,
            badge_id: badgeId
        });
    },

    /**
     * Check module completion and award bonus
     */
    async checkModuleCompletion(userId: string, moduleId: string) {
        const tenantId = getTenantId();

        const { data: lessons } = await supabase
            .from("lessons")
            .select("id")
            .eq("module_id", moduleId);

        if (!lessons || lessons.length === 0) return;

        const { data: completed } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("user_id", userId)
            .eq("tenant_id", tenantId)
            .eq("completed", true)
            .in("lesson_id", lessons.map(l => l.id));

        const completedCount = completed?.length || 0;
        if (completedCount === lessons.length) {
            return await this.awardCoins(
                userId,
                'module_completion',
                moduleId,
                'Completed a module!'
            );
        }
        return null;
    }
};

