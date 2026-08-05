import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Course } from '../types';
import { TENANT_ID } from '../utils/tenant';

export interface CourseWithEnrollment extends Course {
    is_enrolled: boolean;
    enrollment_status?: string;
}

type CourseFilter = 'all' | 'popular' | 'new';

export const useCourses = (filter: CourseFilter = 'all', limit?: number) => {
    return useInfiniteQuery({
        queryKey: ['courses', filter, limit],
        queryFn: async ({ pageParam = 0 }) => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('User not authenticated');

            const pageSize = limit || 10;
            const start = pageParam * pageSize;
            const end = start + pageSize - 1;

            // Build query based on filter
            let query = supabase
                .from('courses')
                .select('*')
                .eq('tenant_id', TENANT_ID)
                .eq('is_published', true);

            // Apply filter
            if (filter === 'popular') {
                query = query.order('created_at', { ascending: false });
            } else if (filter === 'new') {
                query = query.order('created_at', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // Apply pagination range
            query = query.range(start, end);

            const { data: courses, error: coursesError } = await query;

            if (coursesError) throw coursesError;

            // Fetch user enrollments
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('course_id, status')
                .eq('user_id', user.id)
                .eq('tenant_id', TENANT_ID)
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
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const pageSize = limit || 10;
            return lastPage.length === pageSize ? allPages.length : undefined;
        },
        staleTime: 1000 * 60 * 5,    // 5 minutes — course list doesn't change frequently
        gcTime: 1000 * 60 * 30,       // 30 minutes memory cache
        refetchOnWindowFocus: false,
    });
};
