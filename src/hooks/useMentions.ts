import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { CommunityMessage } from '../types';

export const useMentions = () => {
    return useQuery({
        queryKey: ['mentions'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            // Get user's name to search for mentions
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (!profile?.full_name) return [];

            // Search for messages that mention the user
            const { data, error } = await supabase
                .from('community_messages')
                .select(`
                    *,
                    profiles!user_id (
                        full_name,
                        avatar_url,
                        role
                    ),
                    community_reactions (
                        id,
                        emoji,
                        user_id
                    ),
                    community_bookmarks (
                        id,
                        user_id
                    ),
                    community_channels!channel_id (
                        id,
                        name,
                        course_id
                    )
                `)
                .ilike('content', `%@${profile.full_name}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return (data as CommunityMessage[]) || [];
        },
    });
};
