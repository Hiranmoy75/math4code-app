import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            // Fetch distinct categories from courses
            // Note: Supabase doesn't support .distinct() directly on a column easily without RPC or view
            // So we'll fetch all courses and extract unique categories client-side for now
            // Or better, if you have a 'categories' table, query that.
            // Assuming we don't have a categories table yet, let's just return a static list or fetch from courses.

            const { data, error } = await supabase
                .from('courses')
                .select('category')
                .not('category', 'is', null);

            if (error) {
                throw error;
            }

            const categories = Array.from(new Set(data.map((item: any) => item.category))).filter(Boolean);
            return categories as string[];
        },
    });
};
