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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useStatusBar } from '../../hooks/useStatusBar';

type ResetPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen = () => {
    const navigation = useNavigation<ResetPasswordNavigationProp>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Status bar control
    useStatusBar('#E8EAF6');

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in both fields');
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
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert(
                    'Success',
                    'Your password has been updated successfully.',
                    [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
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
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>
                            Create a strong password for your account
                        </Text>

                        {/* New Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Enter new password (min 6 characters)"
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

                        {/* Confirm Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Re-enter your password"
                                    placeholderTextColor="#9E9E9E"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#9E9E9E"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Update Password Button */}
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={handleUpdatePassword}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#5C6BC0', '#7E57C2']}
                                style={styles.updateGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.updateText}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
    updateButton: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    updateGradient: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
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
