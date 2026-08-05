import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { TENANT_ID } from '../utils/tenant';

// Environment variables from app.json extra or .env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase config log removed for production performance & security

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('URL:', supabaseUrl);
    console.error('Has Key:', !!supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    global: {
        headers: {
            'X-Client-Info': `math4code-app/${Platform.OS}`,
            'x-tenant-id': TENANT_ID,
        },
    },
});

// Helper functions for auth
export const authService = {
    async signIn(email: string, password: string) {
        try {
            console.log('🔐 Attempting login for:', email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('❌ Login error:', error.message);
            } else {
                console.log('✅ Login successful');
            }

            return { data, error };
        } catch (error: any) {
            console.error('❌ Network error during login:', error);
            throw new Error(
                error.message ||
                'Network error. Please check your internet connection and try again.'
            );
        }
    },

    async signUp(email: string, password: string, fullName: string, referralCode?: string) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        referral_code: referralCode,
                    },
                },
            });
            return { data, error };
        } catch (error: any) {
            console.error('❌ Network error during signup:', error);
            throw new Error(
                error.message ||
                'Network error. Please check your internet connection and try again.'
            );
        }
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        return { data, error };
    },

    async getUser() {
        const { data, error } = await supabase.auth.getUser();
        return { data, error };
    },
};
