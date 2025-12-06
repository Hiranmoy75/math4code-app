import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { EnrolledCourseWithChannels, CommunityChannel } from '../types';

export const useEnrolledCoursesWithChannels = () => {
    return useQuery({
        queryKey: ['community', 'enrolled-courses'],
        queryFn: async () => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Fetch enrolled courses with community enabled
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select(`
                    course_id,
                    courses!inner (
                        id,
                        title,
                        description,
                        price,
                        thumbnail_url,
                        category,
                        level,
                        is_published,
                        creator_id,
                        community_enabled
                    )
                `)
                .eq('user_id', user.id)
                .eq('courses.community_enabled', true);

            if (enrollError) throw enrollError;

            // Extract course IDs
            const courseIds = enrollments?.map(e => e.courses.id) || [];

            if (courseIds.length === 0) {
                return [] as EnrolledCourseWithChannels[];
            }

            // Fetch channels for all enrolled courses
            const { data: channels, error: channelsError } = await supabase
                .from('community_channels')
                .select('*')
                .in('course_id', courseIds)
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (channelsError) throw channelsError;

            // Combine courses with their channels
            const coursesWithChannels: EnrolledCourseWithChannels[] = enrollments?.map(e => ({
                ...e.courses,
                is_enrolled: true,
                channels: (channels || []).filter(ch => ch.course_id === e.courses.id) as CommunityChannel[]
            })) || [];

            return coursesWithChannels;
        },
    });
};
