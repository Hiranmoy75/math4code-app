// Premium color palette for Math4Code mobile app with Dark Mode support

export interface ColorScheme {
    // Primary brand colors
    primary: string;
    primaryDark: string;
    primaryLight: string;

    // Secondary colors
    secondary: string;
    secondaryDark: string;
    secondaryLight: string;

    // Accent colors
    accent: string;
    accentLight: string;

    // Status colors
    success: string;
    successLight: string;
    successBg: string;

    warning: string;
    warningLight: string;
    warningBg: string;

    error: string;
    errorLight: string;
    errorBg: string;

    info: string;
    infoLight: string;
    infoBg: string;

    // Neutral colors
    background: string;
    surface: string;
    surfaceAlt: string;

    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    textDisabled: string;
    textInverse: string;

    // Border colors
    border: string;
    borderDark: string;

    // Overlay colors
    overlay: string;
    overlayLight: string;

    // Gradient colors
    gradients: {
        primary: string[];
        secondary: string[];
        success: string[];
        warm: string[];
        cool: string[];
        sunset: string[];
        ocean: string[];
    };

    // Rewards & Gamification
    coin: string;
    streak: string;
    xp: string;
    badge: string;
}

export const lightColors: ColorScheme = {
    // Primary brand colors
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#818CF8',

    // Secondary colors
    secondary: '#8B5CF6',
    secondaryDark: '#7C3AED',
    secondaryLight: '#A78BFA',

    // Accent colors
    accent: '#EC4899',
    accentLight: '#F472B6',

    // Status colors
    success: '#10B981',
    successLight: '#34D399',
    successBg: '#D1FAE5',

    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningBg: '#FEF3C7',

    error: '#EF4444',
    errorLight: '#F87171',
    errorBg: '#FEE2E2',

    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoBg: '#DBEAFE',

    // Neutral colors
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',

    // Text colors
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textDisabled: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Border colors
    border: '#E5E7EB',
    borderDark: '#D1D5DB',

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
    coin: '#F59E0B',
    streak: '#EF4444',
    xp: '#8B5CF6',
    badge: '#F59E0B',
};

export const darkColors: ColorScheme = {
    // Primary brand colors - Vibrant in dark mode
    primary: '#818CF8',
    primaryDark: '#6366F1',
    primaryLight: '#A5B4FC',

    // Secondary colors
    secondary: '#A78BFA',
    secondaryDark: '#8B5CF6',
    secondaryLight: '#C4B5FD',

    // Accent colors
    accent: '#F472B6',
    accentLight: '#F9A8D4',

    // Status colors
    success: '#34D399',
    successLight: '#6EE7B7',
    successBg: '#064E3B',

    warning: '#FBBF24',
    warningLight: '#FCD34D',
    warningBg: '#78350F',

    error: '#F87171',
    errorLight: '#FCA5A5',
    errorBg: '#7F1D1D',

    info: '#60A5FA',
    infoLight: '#93C5FD',
    infoBg: '#1E3A8A',

    // Neutral colors - Premium dark palette
    background: '#0F172A',      // Deep navy blue-black
    surface: '#1E293B',         // Slate gray
    surfaceAlt: '#334155',      // Lighter slate

    // Text colors - High contrast for readability
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textDisabled: '#64748B',
    textInverse: '#0F172A',

    // Border colors - Subtle but visible
    border: '#334155',
    borderDark: '#475569',

    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',

    // Gradient colors - Vibrant for dark mode
    gradients: {
        primary: ['#818CF8', '#A78BFA'],
        secondary: ['#A78BFA', '#F472B6'],
        success: ['#34D399', '#6EE7B7'],
        warm: ['#FBBF24', '#F87171'],
        cool: ['#60A5FA', '#818CF8'],
        sunset: ['#FBBF24', '#F472B6'],
        ocean: ['#22D3EE', '#60A5FA'],
    },

    // Rewards & Gamification - Bright and eye-catching
    coin: '#FBBF24',
    streak: '#F87171',
    xp: '#A78BFA',
    badge: '#FBBF24',
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

// Dark mode shadows - More pronounced
export const darkShadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    colored: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    }),
};

// Export default light theme for backward compatibility
export const colors = lightColors;
