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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { GradientButton } from '../../components/GradientButton';
import { InputField } from '../../components/InputField';
import { authService } from '../../services/supabase';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { AuthStackParamList } from '../../types';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export const SignupScreen = () => {
    const navigation = useNavigation<SignupScreenNavigationProp>();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await authService.signUp(
                email.trim(),
                password,
                fullName.trim(),
                referralCode.trim() || undefined
            );

            if (error) {
                Alert.alert('Signup Failed', error.message);
            } else {
                Alert.alert(
                    'Success!',
                    'Account created successfully. Please check your email to verify your account.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={colors.gradients.secondary}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo Section */}
                        <View style={styles.logoSection}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="calculator" size={48} color={colors.secondary} />
                            </View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join Math4Code and start learning!</Text>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formSection}>
                            <InputField
                                label="Full Name"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                                icon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
                            />

                            <InputField
                                label="Email"
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                            />

                            <InputField
                                label="Password"
                                placeholder="Create a password (min 6 characters)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                            />

                            <InputField
                                label="Confirm Password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                            />

                            <InputField
                                label="Referral Code (Optional)"
                                placeholder="Enter referral code if you have one"
                                value={referralCode}
                                onChangeText={setReferralCode}
                                autoCapitalize="characters"
                                icon={<Ionicons name="gift-outline" size={20} color={colors.textSecondary} />}
                            />

                            <GradientButton
                                title="Create Account"
                                onPress={handleSignup}
                                loading={loading}
                                variant="secondary"
                                size="large"
                                style={styles.signupButton}
                            />
                        </View>

                        {/* Login Link */}
                        <View style={styles.loginSection}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.xl,
        justifyContent: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.xl,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...textStyles.h1,
        color: colors.textInverse,
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...textStyles.body,
        color: colors.textInverse,
        opacity: 0.9,
        textAlign: 'center',
    },
    formSection: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius['2xl'],
        padding: spacing.xl,
        marginBottom: spacing.xl,
    },
    signupButton: {
        marginTop: spacing.base,
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    loginText: {
        ...textStyles.body,
        color: colors.textInverse,
    },
    loginLink: {
        ...textStyles.body,
        color: colors.textInverse,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
