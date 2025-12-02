import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { TestSeries } from '../types';
import { useCurrentUser } from './useCurrentUser';

export const useTestSeries = (enrolledOnly: boolean = false) => {
    const { data: user } = useCurrentUser();

    return useQuery({
        queryKey: ['testSeries', enrolledOnly, user?.id],
        queryFn: async () => {
            let query = supabase.from('test_series').select('*');

            if (enrolledOnly && user?.id) {
                // If fetching enrolled, we need to join with enrollments
                // Assuming table 'test_series_enrollments'
                const { data, error } = await supabase
                    .from('test_series_enrollments')
                    .select(`
                        *,
                        test_series:test_series (*)
                    `)
                    .eq('user_id', user.id);

                if (error) throw error;

                return data.map((enrollment: any) => ({
                    ...enrollment.test_series,
                    is_enrolled: true,
                })) as TestSeries[];
            }

            // Fetch all published
            query = query.eq('status', 'published');

            const { data, error } = await query;
            if (error) throw error;

            return data as TestSeries[];
        },
        enabled: enrolledOnly ? !!user?.id : true,
    });
};
