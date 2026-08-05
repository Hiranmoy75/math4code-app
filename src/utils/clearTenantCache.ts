/**
 * Clear Tenant Cache Utility
 * 
 * This utility helps clear all cached data when switching tenants.
 * Call this function when you need to completely reset the app state
 * after changing the TENANT_ID in .env
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { queryClient } from '../services/queryClient';

/**
 * Clear all tenant-related cached data
 * This includes:
 * - AsyncStorage (Supabase session, onboarding state, theme)
 * - React Query cache
 * - Supabase session
 */
export async function clearTenantCache(): Promise<void> {
    try {
        console.log('🧹 Clearing tenant cache...');

        // 1. Sign out from Supabase (clears session)
        await supabase.auth.signOut();
        console.log('✅ Supabase session cleared');

        // 2. Clear all AsyncStorage data
        await AsyncStorage.clear();
        console.log('✅ AsyncStorage cleared');

        // 3. Clear React Query cache
        queryClient.clear();
        console.log('✅ React Query cache cleared');

        console.log('✨ Tenant cache cleared successfully!');
        console.log('⚠️  Please restart the app to apply changes');
    } catch (error) {
        console.error('❌ Error clearing tenant cache:', error);
        throw error;
    }
}

/**
 * Get current tenant info for debugging
 */
export function logTenantInfo(): void {
    const tenantId = process.env.EXPO_PUBLIC_TENANT_ID;
    const tenantName = process.env.EXPO_PUBLIC_TENANT_NAME;

    console.log('🏢 Current Tenant Info:');
    console.log('  ID:', tenantId);
    console.log('  Name:', tenantName);
}
