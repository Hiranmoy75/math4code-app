import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { CommunityMessage } from '../types';

export const useCommunityMessages = (channelId: string | null) => {
    const queryClient = useQueryClient();

    const query = useInfiniteQuery({
        queryKey: ['community', 'messages', channelId],
        queryFn: async ({ pageParam = 0 }) => {
            if (!channelId) return [];

            const pageSize = 50;
            const start = pageParam * pageSize;
            const end = start + pageSize - 1;

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
                    )
                `)
                .eq('channel_id', channelId)
                .order('created_at', { ascending: false })
                .range(start, end);

            if (error) throw error;

            return data as CommunityMessage[];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 50 ? allPages.length : undefined;
        },
        enabled: !!channelId,
    });

    // Real-time subscription
    useEffect(() => {
        if (!channelId) return;

        const channel = supabase
            .channel(`community_messages:${channelId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'community_messages',
                    filter: `channel_id=eq.${channelId}`,
                },
                async (payload) => {
                    // Fetch the complete message with profile
                    const { data: newMessage, error } = await supabase
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
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (error || !newMessage) return;

                    queryClient.setQueryData(['community', 'messages', channelId], (old: any) => {
                        if (!old) return { pages: [[newMessage]], pageParams: [0] };

                        // Check if message already exists (optimistic update)
                        const exists = old.pages[0].some((m: any) =>
                            m.id === newMessage.id ||
                            (m.id.startsWith('temp-') && m.content === newMessage.content && m.user_id === newMessage.user_id)
                        );

                        if (exists) return old;

                        const newPages = [...old.pages];
                        newPages[0] = [newMessage, ...newPages[0]];
                        return { ...old, pages: newPages };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, queryClient]);

    return query;
};
