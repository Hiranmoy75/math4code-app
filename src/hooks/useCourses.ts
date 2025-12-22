import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Course } from '../types';

export interface CourseWithEnrollment extends Course {
    is_enrolled: boolean;
    enrollment_status?: string;
}

type CourseFilter = 'all' | 'popular' | 'new';

export const useCourses = (filter: CourseFilter = 'all', limit?: number) => {
    return useQuery({
        queryKey: ['courses', filter, limit],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('User not authenticated');

            // Build query based on filter
            let query = supabase
                .from('courses')
                .select('*');

            // Apply filter
            if (filter === 'popular') {
                // Order by a popularity metric (you can adjust this)
                query = query.order('created_at', { ascending: false });
            } else if (filter === 'new') {
                query = query.order('created_at', { ascending: false });
            } else {
                // 'all' - default ordering
                query = query.order('created_at', { ascending: false });
            }

            // Apply limit if provided
            if (limit) {
                query = query.limit(limit);
            }

            const { data: courses, error: coursesError } = await query;

            if (coursesError) throw coursesError;

            // Fetch user enrollments
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('course_id, status')
                .eq('user_id', user.id)
                .eq('status', 'active');

            if (enrollmentsError) throw enrollmentsError;

            // Map enrollments to courses
            const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id));

            const coursesWithStatus: CourseWithEnrollment[] = (courses || []).map(course => ({
                ...course,
                is_enrolled: enrolledCourseIds.has(course.id),
                enrollment_status: enrolledCourseIds.has(course.id) ? 'active' : undefined
            }));

            return coursesWithStatus;
        },
    });
};
