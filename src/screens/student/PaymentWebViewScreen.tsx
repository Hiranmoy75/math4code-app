import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Text,
    Platform,
    SafeAreaView,
    StatusBar,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';

import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { api } from '../../services/api';

export const PaymentWebViewScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { paymentUrl, transactionId, courseId } = route.params;

    const [isVerifying, setIsVerifying] = useState(false);
    const [browserResult, setBrowserResult] = useState<WebBrowser.WebBrowserResult | null>(null);

    // Open WebBrowser immediately on mount
    useEffect(() => {
        openPaymentBrowser();
    }, []);

    const openPaymentBrowser = async () => {
        try {
            // Open the payment URL in the system browser (Chrome Custom Tabs / Safari View Controller)
            // This bypasses WebView restrictions like INTERNAL_SECURITY_BLOCK_1
            const result = await WebBrowser.openBrowserAsync(paymentUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                toolbarColor: colors.primary,
                controlsColor: colors.surface,
                dismissButtonStyle: 'close',
            });

            setBrowserResult(result);

            // If the user closed the browser manually (result.type === 'cancel' or 'dismiss'),
            // we should check if the payment was actually successful in the background.
            if (result.type === 'cancel' || result.type === 'dismiss') {
                // Optional: Auto-verify on return if user closed it
                // But let's leave it to manual "Verify" button or explicit deep link for now to avoid spam
            }
        } catch (error) {
            console.error("Failed to open browser:", error);
            Alert.alert("Error", "Could not open payment page.");
        }
    };

    const handlePaymentVerification = async () => {
        setIsVerifying(true);

        // Function to attempt verification with retries
        const verifyWithRetry = async (attemptsLeft: number): Promise<any> => {
            try {
                return await api.verifyPayment(transactionId, courseId);
            } catch (error) {
                if (attemptsLeft > 0) {
                    // Wait 2 seconds and retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return verifyWithRetry(attemptsLeft - 1);
                }
                throw error;
            }
        };

        try {
            // Attempt verification
            const response = await verifyWithRetry(2);

            if (response.success) {
                Alert.alert(
                    "Success",
                    "Payment successful! You are now enrolled.",
                    [{
                        text: "Go to Library",
                        onPress: () => {
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [
                                        { name: 'Main' },
                                        { name: 'LibraryTab' }
                                    ],
                                })
                            );
                        }
                    }]
                );
            } else {
                throw new Error(response.message || 'Payment verification failed');
            }
        } catch (error: any) {
            console.error('Payment verification error:', error);
            let errorMessage = "We couldn't verify your payment.";
            if (error.message) errorMessage = error.message;

            Alert.alert(
                "Payment Status",
                `${errorMessage}\n\nIf you completed the payment, please try verifying again.`,
                [{
                    text: "Retry Verification",
                    onPress: () => handlePaymentVerification()
                }, {
                    text: "Close",
                    style: "cancel",
                    onPress: () => navigation.goBack()
                }]
            );
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGoBack = () => {
        Alert.alert(
            'Cancel Payment',
            'Are you sure you want to cancel this payment?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => navigation.goBack() }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton} disabled={isVerifying}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.iconContainer}>
                    <Ionicons name="card-outline" size={64} color={colors.primary} />
                </View>

                <Text style={styles.title}>Completing Payment</Text>
                <Text style={styles.subtitle}>
                    Please complete the payment in the browser window.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={openPaymentBrowser}
                >
                    <Text style={styles.primaryButtonText}>Open Payment Page</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.helpText}>
                    Already paid? Click below to verify.
                </Text>

                <TouchableOpacity
                    style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
                    onPress={handlePaymentVerification}
                    disabled={isVerifying}
                >
                    {isVerifying ? (
                        <ActivityIndicator color={colors.surface} />
                    ) : (
                        <Text style={styles.verifyButtonText}>Verify Payment Status</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        height: 56,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        ...textStyles.h4,
        color: colors.text,
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    iconContainer: {
        marginBottom: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.primary + '10', // 10% opacity
        borderRadius: 50,
    },
    title: {
        ...textStyles.h3,
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...textStyles.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    primaryButton: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        marginBottom: spacing.xl,
        width: '100%',
        alignItems: 'center',
    },
    primaryButtonText: {
        ...textStyles.button,
        color: colors.primary,
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        width: '100%',
        marginBottom: spacing.lg,
    },
    helpText: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    verifyButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        elevation: 2,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    verifyButtonDisabled: {
        opacity: 0.7,
    },
    verifyButtonText: {
        ...textStyles.button,
        color: colors.surface,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
