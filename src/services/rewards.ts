import { supabase } from './supabase';
import { queryClient } from './queryClient';

type ActionType = 'login' | 'video_watch' | 'lesson_completion' | 'quiz_completion' | 'module_completion' | 'referral' | 'bonus' | 'mission_complete';

const REWARD_RULES = {
    login: { coins: 5, limit: 1 },
    video_watch: { coins: 10, limit: 10 },
    lesson_completion: { coins: 10, limit: 20 },
    quiz_completion: { coins: 15, limit: 10 },
    quiz_bonus: { coins: 10, limit: 10 },
    module_completion: { coins: 50, limit: 5 },
    referral: { coins: 100, limit: 10 },
    streak_3: { coins: 10, limit: 1 },
    streak_7: { coins: 30, limit: 1 },
    streak_30: { coins: 100, limit: 1 },
    mission_complete: { coins: 20, limit: 3 }
};

const DAILY_COIN_CAP = 100;

// Helper to get YYYY-MM-DD in local time
const getLocalToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const rewardService = {
    /**
     * Get reward status for a user
     */
    async getRewardStatus(userId: string) {
        let { data, error } = await supabase
            .from("user_rewards")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error || !data) {
            // Initialize if not exists
            const { data: newData, error: insertError } = await supabase
                .from("user_rewards")
                .insert({ user_id: userId })
                .select()
                .single();

            if (insertError) {
                // Check if it was a race condition
                const { data: retryData } = await supabase
                    .from("user_rewards")
                    .select("*")
                    .eq("user_id", userId)
                    .single();
                data = retryData;
            } else {
                data = newData;
            }
        }
        return data;
    },

    /**
     * Award coins to a user
     */
    /**
     * Award coins to a user
     */
    async awardCoins(userId: string, action: ActionType, entityId?: string, description?: string) {
        const today = getLocalToday();

        // 1. Check strict duplicate rules (Client-Side Protection)
        if (action === 'login') {
            entityId = today;
        }

        if (entityId) {
            let query = supabase
                .from("reward_transactions")
                .select("id")
                .eq("user_id", userId)
                .eq("action_type", action)
                .eq("entity_id", entityId);

            if (action !== 'login') {
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                query = query.gte("created_at", startOfDay);
            }

            const { data: existing } = await query.maybeSingle();

            if (existing) {
                return { success: false, message: "Already rewarded for this today!" };
            }
        }

        // 2. Define Amount (DB Trigger handles exact amounts, but we send it for log)
        let coins = 0;
        switch (action) {
            case 'login': coins = REWARD_RULES.login.coins; break;
            case 'video_watch': coins = REWARD_RULES.video_watch.coins; break;
            case 'lesson_completion': coins = REWARD_RULES.lesson_completion.coins; break;
            case 'quiz_completion': coins = REWARD_RULES.quiz_completion.coins; break;
            case 'module_completion': coins = REWARD_RULES.module_completion.coins; break;
            case 'referral': coins = REWARD_RULES.referral.coins; break;
            case 'mission_complete': coins = REWARD_RULES.mission_complete.coins; break;
            case 'bonus': coins = 10; break;
        }

        // 3. Insert Transaction (The DB Trigger takes it from here!)
        const { error: txError } = await supabase.from("reward_transactions").insert({
            user_id: userId,
            amount: coins,
            action_type: action,
            entity_id: entityId,
            description: description || `Reward for ${action}`
        });

        if (txError) return { success: false, message: "Failed to process reward transaction" };

        // 4. Post-Process (Invalidate Queries)
        queryClient.invalidateQueries({ queryKey: ['userRewards', userId] });
        queryClient.invalidateQueries({ queryKey: ['rewardTransactions', userId] });

        if (action === 'login') {
            return { success: true, coins, message: "Daily Reward Claimed!" };
        }

        return { success: true, coins, message: `⭐ +${coins} coins!` };
    },

    /**
     * Check and update user streak
     */
    async checkStreak(userId: string) {
        // Trigger the login reward check
        const loginResult = await this.awardCoins(userId, 'login');

        // Re-fetch to get updated values
        const rewardStatus = await this.getRewardStatus(userId);

        if (!rewardStatus) return { streak: 0, message: "Error" };

        // Return the message from the login attempt
        const message = loginResult.success ? loginResult.message : null;

        return { streak: rewardStatus.current_streak, message };
    },

    async checkBadgeUnlock(userId: string, badgeId: string) {
        const { data: existing } = await supabase
            .from("user_badges")
            .select("*")
            .eq("user_id", userId)
            .eq("badge_id", badgeId)
            .single();

        if (existing) return;

        await supabase.from("user_badges").insert({
            user_id: userId,
            badge_id: badgeId
        });
    },

    async checkModuleCompletion(userId: string, moduleId: string) {
        const { data: lessons } = await supabase.from("lessons").select("id").eq("module_id", moduleId);
        if (!lessons || lessons.length === 0) return;

        const { data: completed } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("user_id", userId)
            .eq("completed", true)
            .in("lesson_id", lessons.map(l => l.id));

        const completedCount = completed?.length || 0;
        if (completedCount === lessons.length) {
            return await this.awardCoins(userId, 'module_completion', moduleId, 'Completed a module!');
        }
        return null;
    }
};
