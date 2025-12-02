import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { User } from '../types';

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                throw new Error('Not authenticated');
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                throw profileError;
            }

            return {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                avatar_url: profile.avatar_url,
                referral_code: profile.referral_code,
                referred_by: profile.referred_by,
                created_at: profile.created_at,
            } as User;
        },
        retry: false,
    });
};
