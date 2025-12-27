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

            // ✅ OPTIMIZED: Get enrollments with courses
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    course_id,
                    progress_percentage,
                    last_accessed_at,
                    status,
                    courses (
                        id,
                        title,
                        description,
                        price,
                        thumbnail_url,
                        category,
                        level,
                        is_published,
                        creator_id,
                        course_type
                    )
                `)
                .eq('user_id', user.id)
                .in('status', ['active', 'completed'])
                .order('last_accessed_at', { ascending: false, nullsFirst: false });

            if (error) {
                throw error;
            }

            if (!enrollments || enrollments.length === 0) {
                return [];
            }

            // Get course IDs
            const courseIds = enrollments.map(e => e.course_id);

            // ✅ OPTIMIZED: Batch query for lesson counts
            const { data: lessonsData } = await supabase
                .from('modules')
                .select(`
                    course_id,
                    lessons!inner(id)
                `)
                .in('course_id', courseIds);

            // ✅ OPTIMIZED: Batch query for completed lessons
            const { data: completedData } = await supabase
                .from('lesson_progress')
                .select('course_id, lesson_id')
                .eq('user_id', user.id)
                .eq('completed', true)
                .in('course_id', courseIds);

            // Calculate counts
            const lessonCounts: Record<string, number> = {};
            const completedCounts: Record<string, number> = {};

            lessonsData?.forEach((module: any) => {
                const courseId = module.course_id;
                lessonCounts[courseId] = (lessonCounts[courseId] || 0) + (module.lessons?.length || 0);
            });

            completedData?.forEach((progress: any) => {
                const courseId = progress.course_id;
                completedCounts[courseId] = (completedCounts[courseId] || 0) + 1;
            });

            // Transform data to match Course interface
            return enrollments.map((enrollment: any) => ({
                ...enrollment.courses,
                is_enrolled: true,
                progress_percentage: enrollment.progress_percentage || 0, // ✅ Already updated by trigger!
                completed_lessons: completedCounts[enrollment.course_id] || 0,
                total_lessons: lessonCounts[enrollment.course_id] || 0,
            })) as Course[];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};
