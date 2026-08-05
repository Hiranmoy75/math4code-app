import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useCurrentUser } from './useCurrentUser';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    link?: string;
    created_at: string;
}

export const useNotifications = () => {
    const { data: user } = useCurrentUser();
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        refetch,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async ({ pageParam = 0 }) => {
            if (!user?.id) return [];

            const pageSize = 20;
            const start = pageParam * pageSize;
            const end = start + pageSize - 1;

            const { data: notifications, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(start, end);

            if (error) throw error;
            return notifications as Notification[];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const pageSize = 20;
            return lastPage.length === pageSize ? allPages.length : undefined;
        },
        enabled: !!user?.id,
    });

    // Separate query for unread count to get the total number regardless of pagination
    const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
        queryKey: ['notifications', 'unread', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0;
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!user?.id,
        // Refetch unread count more frequently or when window focuses
        staleTime: 1000 * 60, // 1 minute
    });

    const notifications = data?.pages.flatMap(page => page) || [];

    const markAsRead = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            if (!user?.id) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
        },
    });

    const deleteNotification = useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', user?.id] });
        },
    });

    const handleRefetch = async () => {
        await Promise.all([refetch(), refetchUnread()]);
    };

    return {
        notifications,
        unreadCount,
        isLoading,
        refetch: handleRefetch,
        markAsRead: markAsRead.mutate,
        markAllAsRead: markAllAsRead.mutate,
        deleteNotification: deleteNotification.mutate,
        isMarkingAsRead: markAsRead.isPending,
        isMarkingAllAsRead: markAllAsRead.isPending,
        isDeletingNotification: deleteNotification.isPending,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    };
};
