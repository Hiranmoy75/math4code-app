import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { borderRadius, spacing } from '../constants/spacing';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'success' | 'warning';
    size?: 'small' | 'medium' | 'large';
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    size = 'medium',
    style,
    textStyle,
    icon,
}) => {
    const gradientColors = {
        primary: colors.gradients.primary,
        secondary: colors.gradients.secondary,
        success: colors.gradients.success,
        warning: colors.gradients.warm,
    };

    const sizeStyles = {
        small: {
            height: 40,
            paddingHorizontal: spacing.base,
        },
        medium: {
            height: 52,
            paddingHorizontal: spacing.xl,
        },
        large: {
            height: 60,
            paddingHorizontal: spacing['2xl'],
        },
    };

    const textSizeStyles = {
        small: textStyles.buttonSmall,
        medium: textStyles.button,
        large: textStyles.buttonLarge,
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={disabled ? ['#D1D5DB', '#9CA3AF'] : gradientColors[variant]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                    styles.gradient,
                    sizeStyles[size],
                    disabled && styles.disabled,
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                ) : (
                    <>
                        {icon && <>{icon}</>}
                        <Text style={[styles.text, textSizeStyles[size], textStyle]}>
                            {title}
                        </Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.xl,
        ...shadows.medium,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.xl,
        gap: spacing.sm,
    },
    text: {
        color: colors.textInverse,
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.6,
    },
});
