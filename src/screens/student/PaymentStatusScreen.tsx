import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { api } from '../../services/api';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export const PaymentStatusScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { transactionId, courseId } = route.params;

    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('Verifying payment...');
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 10;

    useEffect(() => {
        if (!transactionId) {
            setStatus('failed');
            setMessage('Invalid transaction ID');
            return;
        }

        let interval: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const response = await api.checkPaymentStatus(transactionId);

                if (response.status === 'success') {
                    setStatus('success');
                    setMessage('Payment successful! Redirecting to library...');
                    clearInterval(interval);

                    // Navigate to Library after 2 seconds
                    setTimeout(() => {
                        navigation.reset({
                            index: 0,
                            routes: [
                                { name: 'Main' },
                                { name: 'LibraryTab' }
                            ],
                        });
                    }, 2000);
                    return true;
                } else if (response.status === 'failed') {
                    setStatus('failed');
                    setMessage('Payment failed. Please try again.');
                    clearInterval(interval);
                    return true;
                }
                return false;
            } catch (error: any) {
                console.error('Payment verification error:', error);
                return false;
            }
        };

        // Initial check
        checkStatus();

        // Poll every 2 seconds
        interval = setInterval(async () => {
            setAttempts(prev => {
                const newAttempts = prev + 1;
                if (newAttempts >= maxAttempts) {
                    clearInterval(interval);
                    setStatus('failed');
                    setMessage('Payment verification timed out. Please check Library or contact support.');
                }
                return newAttempts;
            });

            await checkStatus();
        }, 2000);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [transactionId, navigation]);

    const handleGoToLibrary = () => {
        navigation.reset({
            index: 0,
            routes: [
                { name: 'Main' },
                { name: 'LibraryTab' }
            ],
        });
    };

    const handleRetry = () => {
        if (courseId) {
            navigation.replace('CourseDetails', { courseId });
        } else {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    {status === 'loading' && (
                        <ActivityIndicator size="large" color={colors.primary} />
                    )}
                    {status === 'success' && (
                        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                    )}
                    {status === 'failed' && (
                        <Ionicons name="close-circle" size={80} color={colors.error} />
                    )}
                </View>

                <Text style={styles.title}>
                    {status === 'loading' && 'Processing Payment'}
                    {status === 'success' && 'Payment Successful'}
                    {status === 'failed' && 'Payment Failed'}
                </Text>

                <Text style={styles.message}>{message}</Text>

                {status === 'loading' && (
                    <Text style={styles.subMessage}>
                        Please wait while we verify your payment...
                    </Text>
                )}

                {status !== 'loading' && (
                    <View style={styles.buttonContainer}>
                        {status === 'success' && (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleGoToLibrary}
                            >
                                <Text style={styles.primaryButtonText}>Go to Library</Text>
                            </TouchableOpacity>
                        )}
                        {status === 'failed' && (
                            <>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleRetry}
                                >
                                    <Text style={styles.primaryButtonText}>Try Again</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={handleGoToLibrary}
                                >
                                    <Text style={styles.secondaryButtonText}>Go to Library</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    iconContainer: {
        marginBottom: spacing.xl,
    },
    title: {
        ...textStyles.h2,
        color: colors.text,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    message: {
        ...textStyles.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subMessage: {
        ...textStyles.caption,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: spacing.xl,
        width: '100%',
        gap: spacing.md,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButtonText: {
        ...textStyles.button,
        color: colors.textInverse,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryButtonText: {
        ...textStyles.button,
        color: colors.text,
    },
});
