import { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAppTheme } from './useAppTheme';

export interface StatusBarConfig {
    backgroundColor: string;
    barStyle: 'light-content' | 'dark-content';
}

/**
 * Custom hook for per-page status bar control
 * Ensures battery, time, and icons are always visible
 * 
 * @param pageBackground - The background color of the current page
 * @returns StatusBarConfig with backgroundColor and barStyle
 */
export const useStatusBar = (pageBackground?: string): StatusBarConfig => {
    const { colors, isDark } = useAppTheme();

    // Determine the page background color
    const background = pageBackground || (isDark ? colors.background : colors.surface);

    // Determine if the background is light or dark
    const isLightBackground = !isDark;

    // Calculate status bar configuration
    const config: StatusBarConfig = {
        backgroundColor: isLightBackground
            ? '#F5F7FA'  // Slightly off-white for light mode
            : background,  // Match page background for dark mode
        barStyle: isLightBackground
            ? 'dark-content'  // Dark icons for light backgrounds
            : 'light-content'  // Light icons for dark backgrounds
    };

    // Update status bar when screen is focused
    useFocusEffect(
        useCallback(() => {
            if (Platform.OS === 'android') {
                StatusBar.setBackgroundColor(config.backgroundColor);
                StatusBar.setBarStyle(config.barStyle);
            } else {
                StatusBar.setBarStyle(config.barStyle);
            }
        }, [config.backgroundColor, config.barStyle])
    );

    return config;
};

/**
 * Utility function to determine if a color is light or dark
 * Used for custom background colors
 */
export const isColorLight = (color: string): boolean => {
    // Remove # if present
    const hex = color.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if light (luminance > 0.5)
    return luminance > 0.5;
};
