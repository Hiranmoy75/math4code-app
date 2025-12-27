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
                    },
                    isMobile: Platform.OS !== 'web'
                }),
            });

            // Check Content-Type header
            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            const text = await response.text();
            let data;

            if (!isJson || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                // Server returned HTML instead of JSON (likely an error page)
                console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
                throw new Error('Payment service is temporarily unavailable. Please try again later.');
            }

            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON response:', text.substring(0, 200));
                throw new Error('Unable to process server response. Please try again.');
            }

            if (!response.ok) {
                console.error('Buy Course Failed:', data);
                const errorMessage = data.error || data.message || 'Failed to initiate payment';
                throw new Error(errorMessage);
            }

            return data;
        } catch (error: any) {
            console.error('Buy Course Error:', error);
            // Provide user-friendly error messages
            if (error.message.includes('Network request failed')) {
                throw new Error('Network error. Please check your internet connection.');
            }
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

            // Check Content-Type header
            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            const text = await response.text();
            let data;

            if (!isJson || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
                throw new Error('Payment service is temporarily unavailable. Please try again later.');
            }

            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON response:', text.substring(0, 200));
                throw new Error('Unable to process server response. Please try again.');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to check payment status');
            }

            return data;
        } catch (error: any) {
            console.error('Check Payment Status Error:', error);
            if (error.message.includes('Network request failed')) {
                throw new Error('Network error. Please check your internet connection.');
            }
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

            // Check Content-Type header
            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            const text = await response.text();
            let data;

            if (!isJson || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('Server returned HTML instead of JSON:', text.substring(0, 200));
                throw new Error('Payment verification service is temporarily unavailable. Please try again later.');
            }

            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse JSON response:', text.substring(0, 200));
                throw new Error('Unable to process server response. Please try again.');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Payment verification failed');
            }

            return data;
        } catch (error: any) {
            console.error('Verify Payment Error:', error);
            if (error.message.includes('Network request failed')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    },

    getDebugInfo: () => {
        return {
            baseUrl: API_BASE_URL
        };
    }
};
