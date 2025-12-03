import { useTheme } from '../contexts/ThemeContext';
import { lightColors, darkColors, shadows, darkShadows, ColorScheme } from '../constants/colors';

export const useAppTheme = () => {
    const { theme, isDark } = useTheme();

    const colors: ColorScheme = isDark ? darkColors : lightColors;
    const appShadows = isDark ? darkShadows : shadows;

    return {
        colors,
        shadows: appShadows,
        isDark,
        theme,
    };
};
