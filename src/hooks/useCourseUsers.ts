import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

interface CourseUser {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
}

export const useCourseUsers = (courseId: string | null) => {
    return useQuery({
        queryKey: ['courseUsers', courseId],
        queryFn: async () => {
            if (!courseId) return [];

            // First, get all user IDs enrolled in this course
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('user_id')
                .eq('course_id', courseId)
                .eq('status', 'active');

            if (enrollError) throw enrollError;
            if (!enrollments || enrollments.length === 0) return [];

            // Get the user IDs
            const userIds = enrollments.map(e => e.user_id);

            // Fetch profiles for these users
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // Transform to CourseUser format
            const users: CourseUser[] = profiles?.map((profile) => ({
                id: profile.id,
                full_name: profile.full_name || 'Unknown User',
                avatar_url: profile.avatar_url || null,
            })) || [];

            return users;
        },
        enabled: !!courseId,
    });
};
