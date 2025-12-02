import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Course } from '../types';

export interface CourseWithEnrollment extends Course {
    is_enrolled: boolean;
    enrollment_status?: string;
}

export const useCourses = () => {
    return useQuery({
        queryKey: ['courses'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('User not authenticated');

            // Fetch all courses
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .order('created_at', { ascending: false });

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

            const coursesWithStatus: CourseWithEnrollment[] = courses.map(course => ({
                ...course,
                is_enrolled: enrolledCourseIds.has(course.id),
                enrollment_status: enrolledCourseIds.has(course.id) ? 'active' : undefined
            }));

            return coursesWithStatus;
        },
    });
};
