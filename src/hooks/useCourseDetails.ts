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

            // 2. Fetch Modules with Lessons (Try RPC first)
            let modulesData: any[] = [];

            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_course_structure', { target_course_id: courseId });

            if (!rpcError && rpcData) {
                modulesData = rpcData;
            } else {
                console.log('RPC failed or empty, using fallback:', rpcError);
                // Fallback: Direct Query
                const { data: fallbackData, error: modulesError } = await supabase
                    .from('modules')
                    .select('*, lessons(*)')
                    .eq('course_id', courseId)
                    .order('module_order', { ascending: true });

                if (modulesError) {
                    console.error('Error fetching modules:', modulesError);
                    throw modulesError;
                }
                modulesData = fallbackData || [];
            }

            // 3. Process modules and sort lessons (RPC usually sorts, but safety check)
            const modulesWithLessons: Module[] = modulesData.map((module: any) => ({
                ...module,
                lessons: (module.lessons || []).sort((a: Lesson, b: Lesson) => a.lesson_order - b.lesson_order),
            }));

            // 4. Check Enrollment Status and Progress
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
                    .maybeSingle();

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
