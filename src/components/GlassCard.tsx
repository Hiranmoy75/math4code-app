import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, shadows } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 20,
    tint = 'light',
}) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={intensity} tint={tint} style={styles.blur}>
                <View style={styles.content}>{children}</View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        ...shadows.medium,
    },
    blur: {
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
        padding: spacing.base,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
});
