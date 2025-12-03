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

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await authService.signIn(email.trim(), password);

            if (error) {
                Alert.alert('Login Failed', error.message);
            } else if (data.user) {
                // Navigation will be handled by auth state change

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
                colors={colors.gradients.primary}
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
                                <Ionicons name="calculator" size={48} color={colors.primary} />
                            </View>
                            <Text style={styles.title}>Math4Code</Text>
                            <Text style={styles.subtitle}>Welcome back! Let's continue learning</Text>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formSection}>
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
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                            />

                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.showPasswordButton}
                            >
                                <Text style={styles.showPasswordText}>
                                    {showPassword ? 'Hide' : 'Show'} Password
                                </Text>
                            </TouchableOpacity>

                            <GradientButton
                                title="Login"
                                onPress={handleLogin}
                                loading={loading}
                                variant="primary"
                                size="large"
                                style={styles.loginButton}
                            />

                            <TouchableOpacity
                                onPress={() => navigation.navigate('ForgotPassword')}
                                style={styles.forgotButton}
                            >
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Link */}
                        <View style={styles.signupSection}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupLink}>Sign Up</Text>
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
        marginBottom: spacing['3xl'],
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
    showPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: -spacing.sm,
        marginBottom: spacing.base,
    },
    showPasswordText: {
        ...textStyles.bodySmall,
        color: colors.primary,
        fontWeight: '600',
    },
    loginButton: {
        marginTop: spacing.base,
    },
    forgotButton: {
        alignSelf: 'center',
        marginTop: spacing.base,
    },
    forgotText: {
        ...textStyles.bodySmall,
        color: colors.textSecondary,
    },
    signupSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        ...textStyles.body,
        color: colors.textInverse,
    },
    signupLink: {
        ...textStyles.body,
        color: colors.textInverse,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
