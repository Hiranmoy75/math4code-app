import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';

export const useSendMessage = (channelId: string | null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ content }: { content: string }) => {
            if (!channelId) throw new Error('No channel selected');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('community_messages')
                .insert({
                    channel_id: channelId,
                    user_id: user.id,
                    content,
                    attachments: [],
                })
                .select(`
                    *,
                    profiles!user_id (
                        full_name,
                        avatar_url,
                        role
                    )
                `)
                .single();

            if (error) throw error;
            return data;
        },
        onMutate: async ({ content }) => {
            if (!channelId) return;

            await queryClient.cancelQueries({ queryKey: ['community', 'messages', channelId] });

            const previousMessages = queryClient.getQueryData(['community', 'messages', channelId]);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { previousMessages };

            // Fetch user profile for optimistic message
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, role')
                .eq('id', user.id)
                .single();

            const optimisticMessage = {
                id: `temp-${Date.now()}`,
                content,
                channel_id: channelId,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                attachments: [],
                is_pinned: false,
                is_announcement: false,
                parent_message_id: null,
                profiles: profile || {
                    full_name: user.user_metadata?.full_name || 'You',
                    avatar_url: user.user_metadata?.avatar_url,
                    role: user.user_metadata?.role || 'student',
                },
                community_reactions: [],
            };

            queryClient.setQueryData(['community', 'messages', channelId], (old: any) => {
                if (!old) return { pages: [[optimisticMessage]], pageParams: [0] };

                const newPages = [...old.pages];
                newPages[0] = [optimisticMessage, ...newPages[0]];

                return {
                    ...old,
                    pages: newPages,
                };
            });

            return { previousMessages };
        },
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Message sent!',
                position: 'bottom',
                visibilityTime: 2000,
            });
        },
        onError: (error: any, _, context) => {
            if (context?.previousMessages && channelId) {
                queryClient.setQueryData(['community', 'messages', channelId], context.previousMessages);
            }

            Toast.show({
                type: 'error',
                text1: 'Failed to send message',
                text2: error.message || 'Please try again',
                position: 'bottom',
            });
        },
        onSettled: () => {
            if (channelId) {
                queryClient.invalidateQueries({ queryKey: ['community', 'messages', channelId] });
            }
        },
    });
};

export const useToggleReaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if reaction exists
            const { data: existing } = await supabase
                .from('community_reactions')
                .select('id')
                .eq('message_id', messageId)
                .eq('user_id', user.id)
                .eq('emoji', emoji)
                .single();

            if (existing) {
                // Remove reaction
                const { error } = await supabase
                    .from('community_reactions')
                    .delete()
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                // Add reaction
                const { error } = await supabase
                    .from('community_reactions')
                    .insert({
                        message_id: messageId,
                        user_id: user.id,
                        emoji,
                    });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            // Invalidate all message queries to refresh reactions
            queryClient.invalidateQueries({ queryKey: ['community', 'messages'] });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to update reaction',
                position: 'bottom',
            });
        },
    });
};
