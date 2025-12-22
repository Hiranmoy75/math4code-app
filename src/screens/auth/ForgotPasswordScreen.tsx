import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { supabase } from '../../services/supabase';
import { spacing } from '../../constants/spacing';
import { useStatusBar } from '../../hooks/useStatusBar';
import * as Linking from 'expo-linking';

export const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Status bar control
    useStatusBar('#E8EAF6');

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const redirectTo = Linking.createURL('/auth/reset-password');
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: redirectTo,
            });

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setIsSubmitted(true);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Gradient Background */}
            <LinearGradient
                colors={['#E8EAF6', '#F3E5F5', '#E1F5FE']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Glass Card */}
                    <BlurView intensity={20} tint="light" style={styles.glassCard}>
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#424242" />
                        </TouchableOpacity>

                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>Math4Code</Text>
                            <View style={styles.logoUnderline} />
                        </View>

                        {!isSubmitted ? (
                            <>
                                {/* Title */}
                                <Text style={styles.title}>Forgot Password?</Text>
                                <Text style={styles.subtitle}>
                                    Don't worry! Enter your email and we'll send you a reset link.
                                </Text>

                                {/* Email Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#9E9E9E"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                {/* Send Reset Link Button */}
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={handleReset}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={['#5C6BC0', '#7E57C2']}
                                        style={styles.resetGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.resetText}>
                                            {loading ? 'Sending...' : 'Send Reset Link'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.successContainer}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                                </View>
                                <Text style={styles.successTitle}>Check your email</Text>
                                <Text style={styles.successText}>
                                    We've sent a password reset link to {email}
                                </Text>
                                <TouchableOpacity
                                    style={styles.tryAgainButton}
                                    onPress={() => setIsSubmitted(false)}
                                >
                                    <Text style={styles.tryAgainText}>Try another email</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.footerLink}>Back to Login</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    glassCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 0,
        padding: spacing['2xl'],
        paddingTop: spacing['4xl'],
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: spacing['2xl'],
        left: spacing['2xl'],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoText: {
        fontSize: 42,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
    },
    logoUnderline: {
        width: 120,
        height: 4,
        backgroundColor: '#5C6BC0',
        borderRadius: 2,
        marginTop: spacing.xs,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#212121',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 14,
        color: '#616161',
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212121',
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontSize: 15,
        color: '#212121',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    resetButton: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: spacing.xl,
    },
    resetGradient: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    successIcon: {
        marginBottom: spacing.lg,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#212121',
        marginBottom: spacing.sm,
    },
    successText: {
        fontSize: 14,
        color: '#616161',
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    tryAgainButton: {
        paddingVertical: spacing.sm,
    },
    tryAgainText: {
        fontSize: 14,
        color: '#5C6BC0',
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    footerLink: {
        fontSize: 14,
        color: '#5C6BC0',
        fontWeight: '600',
    },
});
