/**
 * Tenant Configuration
 * This file exports the hardcoded tenant ID from .env
 */

export const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID || '';
export const TENANT_NAME = process.env.EXPO_PUBLIC_TENANT_NAME || 'Math4Code';

/**
 * Get the current tenant ID
 * @returns Tenant ID from environment
 */
export function getTenantId(): string {
    if (!TENANT_ID) {
        console.warn('⚠️ TENANT_ID not configured in .env file');
    }
    return TENANT_ID;
}

/**
 * Get the current tenant name
 * @returns Tenant name from environment
 */
export function getTenantName(): string {
    return TENANT_NAME;
}
