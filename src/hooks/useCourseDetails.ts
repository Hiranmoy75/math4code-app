import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Course, Module, Lesson } from '../types';

export const useCourseDetails = (courseId: string) => {
    return useQuery({
        queryKey: ['courseDetails', courseId],
        queryFn: async () => {
            // 1. Fetch Course Details
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseError) {
                console.error('Error fetching course:', courseError);
                throw courseError;
            }

            // 2. Fetch Modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('modules')
                .select('*')
                .eq('course_id', courseId)
                .order('module_order', { ascending: true });

            if (modulesError) {
                console.error('Error fetching modules:', modulesError);
                throw modulesError;
            }

            // 3. Fetch Lessons for all modules
            const moduleIds = modulesData.map(m => m.id);
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .in('module_id', moduleIds)
                .order('lesson_order', { ascending: true });

            if (lessonsError) {
                console.error('Error fetching lessons:', lessonsError);
                throw lessonsError;
            }

            // 4. Organize lessons into modules
            const modulesWithLessons: Module[] = modulesData.map(module => ({
                ...module,
                lessons: lessonsData.filter(lesson => lesson.module_id === module.id),
            }));

            // 5. Check Enrollment Status and Progress
            const { data: { user } } = await supabase.auth.getUser();
            let isEnrolled = false;
            let enrollmentProgress = 0;

            if (user) {
                const { data: enrollment } = await supabase
                    .from('enrollments')
                    .select('status, progress_percentage')
                    .eq('user_id', user.id)
                    .eq('course_id', courseId)
                    .eq('status', 'active')
                    .single();

                isEnrolled = !!enrollment;
                enrollmentProgress = enrollment?.progress_percentage || 0;
            }

            return {
                course: courseData as Course,
                modules: modulesWithLessons,
                isEnrolled,
                enrollmentProgress,
            };
        },
        enabled: !!courseId,
    });
};
