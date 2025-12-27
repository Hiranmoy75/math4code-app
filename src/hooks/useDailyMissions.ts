import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useCurrentUser } from './useCurrentUser';

export interface DailyMission {
    id: string;
    title: string;
    description: string;
    goal: number;
    progress: number;
    completed: boolean;
    reward_coins: number;
    icon: string;
}

export const useDailyMissions = () => {
    const { data: user } = useCurrentUser();

    return useQuery({
        queryKey: ['dailyMissions', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            // Call the RPC function to get or create daily missions
            const { data, error } = await supabase
                .rpc('get_or_create_daily_missions', {
                    p_user_id: user.id
                });

            if (error) {
                console.error('Error fetching daily missions:', error);
                throw error;
            }

            // Transform data to match our interface
            const missions: DailyMission[] = (data || []).map((mission: any) => ({
                id: mission.id,
                title: mission.title,
                description: mission.description || '',
                goal: mission.goal,
                progress: mission.progress,
                completed: mission.completed,
                reward_coins: mission.reward_coins,
                icon: getIconForMissionType(mission.id),
            }));

            return missions;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// Helper function to map mission types to icons
function getIconForMissionType(missionId: string): string {
    switch (missionId) {
        case 'login':
            return 'flash';
        case 'video':
            return 'play-circle';
        case 'quiz':
            return 'school';
        case 'lesson':
            return 'book';
        default:
            return 'trophy';
    }
}
