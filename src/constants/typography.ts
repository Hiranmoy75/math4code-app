// Premium typography system
import { Platform } from 'react-native';

export const fonts = {
    // Font families
    regular: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
    }),
    medium: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
    }),
    bold: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
    }),
    semibold: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
    }),
};

export const fontSizes = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
};

export const lineHeights = {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
    '5xl': 1,
};

export const fontWeights = {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

// Text styles for consistent typography
export const textStyles = {
    // Headings
    h1: {
        fontSize: fontSizes['4xl'],
        lineHeight: lineHeights['4xl'],
        fontWeight: fontWeights.bold,
        fontFamily: fonts.bold,
    },
    h2: {
        fontSize: fontSizes['3xl'],
        lineHeight: lineHeights['3xl'],
        fontWeight: fontWeights.bold,
        fontFamily: fonts.bold,
    },
    h3: {
        fontSize: fontSizes['2xl'],
        lineHeight: lineHeights['2xl'],
        fontWeight: fontWeights.semibold,
        fontFamily: fonts.semibold,
    },
    h4: {
        fontSize: fontSizes.xl,
        lineHeight: lineHeights.xl,
        fontWeight: fontWeights.semibold,
        fontFamily: fonts.semibold,
    },
    h5: {
        fontSize: fontSizes.lg,
        lineHeight: lineHeights.lg,
        fontWeight: fontWeights.medium,
        fontFamily: fonts.medium,
    },

    // Body text
    body: {
        fontSize: fontSizes.base,
        lineHeight: lineHeights.base,
        fontWeight: fontWeights.normal,
        fontFamily: fonts.regular,
    },
    bodyLarge: {
        fontSize: fontSizes.lg,
        lineHeight: lineHeights.lg,
        fontWeight: fontWeights.normal,
        fontFamily: fonts.regular,
    },
    bodySmall: {
        fontSize: fontSizes.sm,
        lineHeight: lineHeights.sm,
        fontWeight: fontWeights.normal,
        fontFamily: fonts.regular,
    },

    // Captions
    caption: {
        fontSize: fontSizes.xs,
        lineHeight: lineHeights.xs,
        fontWeight: fontWeights.normal,
        fontFamily: fonts.regular,
    },
    captionBold: {
        fontSize: fontSizes.xs,
        lineHeight: lineHeights.xs,
        fontWeight: fontWeights.semibold,
        fontFamily: fonts.semibold,
    },

    // Buttons
    button: {
        fontSize: fontSizes.base,
        lineHeight: lineHeights.base,
        fontWeight: fontWeights.semibold,
        fontFamily: fonts.semibold,
    },
    buttonLarge: {
        fontSize: fontSizes.lg,
        lineHeight: lineHeights.lg,
        fontWeight: fontWeights.semibold,
        fontFamily: fonts.semibold,
    },
    buttonSmall: {
        fontSize: fontSizes.sm,
        lineHeight: lineHeights.sm,
        fontWeight: fontWeights.medium,
        fontFamily: fonts.medium,
    },
};
