import { supabase } from './supabase';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    // if (Platform.OS === 'web') {
    //     // In development, frontend is usually on 8081 and backend on 3000
    //     // We need to point to port 3000 on the same hostname
    //     const hostname = window.location.hostname;
    //     const protocol = window.location.protocol;
    //     return `${protocol}//${hostname}:3000`;
    // }
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
};

const API_BASE_URL = 'https://www.math4code.com';

export const api = {
    buyCourse: async (courseId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error('No active session');
            }

            const response = await fetch(`${API_BASE_URL}/api/courses/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    courseId,
                    // Explicitly pass production URLs to satisfy PhonePe security
                    redirectUrl: 'https://www.math4code.com/api/phonepe/redirect',
                    callbackUrl: 'https://www.math4code.com/api/phonepe/callback',
                    deviceContext: {
                        deviceOS: Platform.OS
                    }
                }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON response:', text.substring(0, 200));
                throw new Error(`Invalid server response: ${text.substring(0, 100)}...`);
            }


            if (!response.ok) {
                console.error('Buy Course Failed:', data);
                throw new Error(data.error || data.message || JSON.stringify(data) || 'Failed to initiate payment');
            }

            return data;
        } catch (error) {
            console.error('Buy Course Error:', error);
            throw error;
        }
    },

    checkPaymentStatus: async (transactionId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error('No active session');
            }

            const response = await fetch(`${API_BASE_URL}/api/phonepe/check-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ transactionId }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON response:', text.substring(0, 200));
                throw new Error(`Invalid server response: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to check payment status');
            }

            return data;
        } catch (error) {
            console.error('Check Payment Status Error:', error);
            throw error;
        }
    },

    getEnrollmentStatus: async (courseId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('No active user');
            }

            const { data, error } = await supabase
                .from('enrollments')
                .select('status')
                .eq('user_id', user.id)
                .eq('course_id', courseId)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            return !!data; // Returns true if enrolled, false otherwise
        } catch (error) {
            console.error('Get Enrollment Status Error:', error);
            throw error;
        }
    },

    verifyPayment: async (transactionId: string, courseId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error('No active session');
            }

            const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ transactionId, courseId }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON response:', text.substring(0, 200));
                throw new Error(`Invalid server response: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Payment verification failed');
            }

            return data;
        } catch (error) {
            console.error('Verify Payment Error:', error);
            throw error;
        }
    },

    getDebugInfo: () => {
        return {
            baseUrl: API_BASE_URL
        };
    }
};
