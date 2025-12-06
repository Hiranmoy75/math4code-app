import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';

export const useToggleBookmark = (channelId: string | null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId, isBookmarked }: { messageId: string; isBookmarked: boolean }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            if (isBookmarked) {
                // Remove bookmark
                const { error } = await supabase
                    .from('community_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('message_id', messageId);

                if (error) throw error;
                return { action: 'removed' };
            } else {
                // Add bookmark - check if it already exists first
                const { data: existing } = await supabase
                    .from('community_bookmarks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('message_id', messageId)
                    .single();

                if (existing) {
                    // Already bookmarked, just return success
                    return { action: 'added' };
                }

                const { error } = await supabase
                    .from('community_bookmarks')
                    .insert({
                        user_id: user.id,
                        message_id: messageId,
                    });

                if (error) {
                    // If it's a duplicate key error, treat it as success
                    if (error.code === '23505') {
                        return { action: 'added' };
                    }
                    throw error;
                }
                return { action: 'added' };
            }
        },
        onSuccess: (data) => {
            // Invalidate all message queries to refresh bookmark status
            if (channelId) {
                queryClient.invalidateQueries({ queryKey: ['community', 'messages', channelId] });
            }
            // Always invalidate bookmarked messages
            queryClient.invalidateQueries({ queryKey: ['bookmarkedMessages'] });
            // Invalidate all community messages queries
            queryClient.invalidateQueries({ queryKey: ['community', 'messages'] });

            // Show toast
            Toast.show({
                type: 'success',
                text1: data.action === 'added' ? 'Message bookmarked' : 'Bookmark removed',
                position: 'bottom',
                visibilityTime: 2000,
            });
        },
        onError: (error) => {
            console.error('Bookmark error:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to update bookmark',
                text2: error instanceof Error ? error.message : 'Unknown error',
                position: 'bottom',
            });
        },
    });
};

export const useBookmarkedMessages = () => {
    return useQuery({
        queryKey: ['bookmarkedMessages'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('community_bookmarks')
                .select(`
                    id,
                    created_at,
                    community_messages (
                        id,
                        content,
                        created_at,
                        channel_id,
                        user_id,
                        is_pinned,
                        is_announcement,
                        profiles:user_id (
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
                        community_channels (
                            id,
                            name,
                            course_id,
                            courses (
                                id,
                                title
                            )
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to include message details
            return data?.map((bookmark: any) => ({
                bookmarkId: bookmark.id,
                bookmarkedAt: bookmark.created_at,
                message: bookmark.community_messages,
            })) || [];
        },
    });
};
