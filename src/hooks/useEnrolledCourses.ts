import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Course } from '../types';
import { useCurrentUser } from './useCurrentUser';

export const useEnrolledCourses = () => {
    const { data: user } = useCurrentUser();

    return useQuery({
        queryKey: ['enrolledCourses', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    course:courses (*)
                `)
                .eq('user_id', user.id);

            if (error) {
                throw error;
            }

            // Transform data to match Course interface
            return data.map((enrollment: any) => ({
                ...enrollment.course,
                is_enrolled: true,
                progress_percentage: enrollment.progress || 0,
                completed_lessons: enrollment.completed_lessons || 0,
            })) as Course[];
        },
        enabled: !!user?.id,
    });
};
