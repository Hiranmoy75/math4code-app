import React, { useState, useEffect } from 'react';
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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { authService, supabase } from '../../services/supabase';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { AuthStackParamList } from '../../types';
import { useStatusBar } from '../../hooks/useStatusBar';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Status bar control - light background requires dark icons
    useStatusBar('#E8EAF6');

    // Handle deep link redirect
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const { url } = event;
            if (url.includes('access_token') || url.includes('refresh_token')) {
                // Handled by App.tsx
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []);

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
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            // Linking.createURL handles both Expo Go (exp://) and standalone builds (math4code://)
            const redirectUrl = Linking.createURL('/auth/callback');
            console.log('OAuth Redirect URL:', redirectUrl); // Debug log

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: Platform.OS !== 'web',
                },
            });

            if (error) throw error;

            if (Platform.OS === 'web') return;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    // Handled by deep link listener
                }
            }
        } catch (error: any) {
            Alert.alert('Google Login Error', error.message);
        } finally {
            setGoogleLoading(false);
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
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>Math4Code</Text>
                            <View style={styles.logoUnderline} />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Login to your account</Text>

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

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9E9E9E"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#9E9E9E"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotButton}
                        >
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#5C6BC0', '#7E57C2']}
                                style={styles.signInGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.signInText}>
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <View style={styles.dividerDot} />
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign In */}
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={handleGoogleLogin}
                            disabled={googleLoading}
                        >
                            <FontAwesome name="google" size={20} color="#DB4437" />
                            <Text style={styles.socialButtonText}>
                                {googleLoading ? 'Connecting...' : 'Continue with Google'}
                            </Text>
                        </TouchableOpacity>

                        {/* Apple Sign In */}
                        <TouchableOpacity style={styles.socialButton}>
                            <Ionicons name="logo-apple" size={24} color="#000" />
                            <Text style={styles.socialButtonText}>Continue with Apple</Text>
                        </TouchableOpacity>

                        {/* Footer Links */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.footerLink}>Create an account</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerDivider}>  |  </Text>
                            <TouchableOpacity>
                                <Text style={styles.footerLink}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={styles.footerDivider}>  |  </Text>
                            <TouchableOpacity>
                                <Text style={styles.footerLink}>Terms of Service</Text>
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
        width: 80,
        height: 4,
        backgroundColor: '#5C6BC0',
        borderRadius: 2,
        marginTop: spacing.xs,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#424242',
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    inputGroup: {
        marginBottom: spacing.lg,
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
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: spacing.lg,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: spacing.lg,
    },
    forgotText: {
        fontSize: 13,
        color: '#5C6BC0',
        fontWeight: '600',
    },
    signInButton: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: spacing.lg,
    },
    signInGradient: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    dividerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        marginHorizontal: spacing.md,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 24,
        paddingVertical: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        gap: spacing.sm,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#424242',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xl,
        flexWrap: 'wrap',
    },
    footerLink: {
        fontSize: 12,
        color: '#5C6BC0',
        fontWeight: '600',
    },
    footerDivider: {
        fontSize: 12,
        color: '#9E9E9E',
    },
});
