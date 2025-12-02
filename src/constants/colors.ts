// Premium color palette for Math4Code mobile app
export const colors = {
    // Primary brand colors
    primary: '#6366F1',      // Indigo - main brand color
    primaryDark: '#4F46E5',  // Darker indigo for pressed states
    primaryLight: '#818CF8', // Lighter indigo for backgrounds

    // Secondary colors
    secondary: '#8B5CF6',    // Purple
    secondaryDark: '#7C3AED',
    secondaryLight: '#A78BFA',

    // Accent colors
    accent: '#EC4899',       // Pink accent
    accentLight: '#F472B6',

    // Status colors
    success: '#10B981',      // Green
    successLight: '#34D399',
    successBg: '#D1FAE5',

    warning: '#F59E0B',      // Amber
    warningLight: '#FBBF24',
    warningBg: '#FEF3C7',

    error: '#EF4444',        // Red
    errorLight: '#F87171',
    errorBg: '#FEE2E2',

    info: '#3B82F6',         // Blue
    infoLight: '#60A5FA',
    infoBg: '#DBEAFE',

    // Neutral colors
    background: '#F9FAFB',   // Light gray background
    surface: '#FFFFFF',      // White surface
    surfaceAlt: '#F3F4F6',   // Alternative surface

    // Text colors
    text: '#1F2937',         // Dark gray - primary text
    textSecondary: '#6B7280', // Medium gray - secondary text
    textTertiary: '#9CA3AF', // Light gray - tertiary text
    textDisabled: '#9CA3AF', // Disabled text
    textInverse: '#FFFFFF',  // White text for dark backgrounds

    // Border colors
    border: '#E5E7EB',       // Light border
    borderDark: '#D1D5DB',   // Darker border

    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',

    // Gradient colors
    gradients: {
        primary: ['#6366F1', '#8B5CF6'],
        secondary: ['#8B5CF6', '#EC4899'],
        success: ['#10B981', '#34D399'],
        warm: ['#F59E0B', '#EF4444'],
        cool: ['#3B82F6', '#6366F1'],
        sunset: ['#F59E0B', '#EC4899'],
        ocean: ['#06B6D4', '#3B82F6'],
    },

    // Rewards & Gamification
    coin: '#F59E0B',         // Gold for coins
    streak: '#EF4444',       // Fire red for streaks
    xp: '#8B5CF6',           // Purple for XP
    badge: '#F59E0B',        // Gold for badges

    // Dark mode colors (for future implementation)
    dark: {
        background: '#111827',
        surface: '#1F2937',
        surfaceAlt: '#374151',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB',
        border: '#374151',
    },
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    colored: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    }),
};
