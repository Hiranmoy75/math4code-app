import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export const ForgotPasswordScreen = () => {
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={colors.gradients.cool}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    <Ionicons name="mail-outline" size={64} color={colors.textInverse} />
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Please contact your administrator to reset your password.
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    title: {
        ...textStyles.h2,
        color: colors.textInverse,
        marginTop: spacing.xl,
        marginBottom: spacing.base,
    },
    subtitle: {
        ...textStyles.body,
        color: colors.textInverse,
        textAlign: 'center',
        opacity: 0.9,
    },
});
