import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useCourseProgress = (courseId: string) => {
    return useQuery({
        queryKey: ['courseProgress', courseId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return {
                    totalLessons: 0,
                    completedLessons: 0,
                    progressPercentage: 0,
                    lessons: []
                };
            }

            // 1. Get all lessons for the course to calculate total
            const { data: modules, error: modulesError } = await supabase
                .from('modules')
                .select('id, lessons(id)')
                .eq('course_id', courseId);

            if (modulesError) {
                console.error('Error fetching modules for progress:', modulesError);
                throw modulesError;
            }

            const allLessonIds = modules?.flatMap(m => m.lessons?.map((l: any) => l.id) || []) || [];
            const totalLessons = allLessonIds.length;

            if (totalLessons === 0) {
                return {
                    totalLessons: 0,
                    completedLessons: 0,
                    progressPercentage: 0,
                    lessons: []
                };
            }

            // 2. Get completed lessons for the user
            // We try to fetch from 'lesson_progress' table.
            // Note: If this table does not exist in Supabase, this query will fail.
            // We are assuming standard schema: id, user_id, lesson_id, completed, etc.
            const { data: progressData, error: progressError } = await supabase
                .from('lesson_progress')
                .select('lesson_id, completed')
                .eq('user_id', user.id)
                .in('lesson_id', allLessonIds)
                .eq('completed', true);

            if (progressError) {
                console.warn('Error fetching lesson_progress (table might be missing):', progressError);
                // Return empty progress on error to prevent UI crash
                return {
                    totalLessons,
                    completedLessons: 0,
                    progressPercentage: 0,
                    lessons: []
                };
            }

            const completedLessonsCount = progressData?.length || 0;
            const progressPercentage = Math.round((completedLessonsCount / totalLessons) * 100);

            const lessonsProgress = progressData?.map(p => ({
                id: p.lesson_id,
                completed: p.completed
            })) || [];

            return {
                totalLessons,
                completedLessons: completedLessonsCount,
                progressPercentage,
                lessons: lessonsProgress
            };
        },
        enabled: !!courseId,
    });
};
