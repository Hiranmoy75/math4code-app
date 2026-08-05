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

    // Polling for payment status
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        let isPolling = true;

        const checkStatus = async () => {
            if (!isPolling) return;

            try {
                console.log('[PAYMENT] Polling status...');
                const response = await api.checkPaymentStatus(transactionId);

                if (response.status === 'success') {
                    console.log('[PAYMENT] Polling success! Navigating...');
                    isPolling = false;
                    clearInterval(pollInterval);

                    // Close browser if open
                    WebBrowser.dismissBrowser();

                    // Navigate directly to Library
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
            } catch (error) {
                // Silent failure on polling errors, just retry
                console.log('[PAYMENT] Polling checking...', error);
            }
        };

        // Start polling after 5 seconds to give user time to interact
        const startPolling = setTimeout(() => {
            console.log('[PAYMENT] Starting polling...');
            pollInterval = setInterval(checkStatus, 3000);
        }, 5000);

        return () => {
            isPolling = false;
            clearTimeout(startPolling);
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [transactionId, navigation]);

    // Open WebBrowser immediately on mount and listen for deep links
    useEffect(() => {
        console.log('[PAYMENT] Screen mounted, opening browser...');
        openPaymentBrowser();

        return () => {
            // Cleanup if needed
        };
    }, []);

    const openPaymentBrowser = async () => {
        try {
            console.log('[PAYMENT] Opening payment URL:', paymentUrl);
            await WebBrowser.openBrowserAsync(paymentUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                toolbarColor: colors.primary,
                controlsColor: colors.surface,
                dismissButtonStyle: 'close',
            });
            // Browser closed manually or by code
        } catch (error) {
            console.error("[PAYMENT] Failed to open browser:", error);
            Alert.alert("Error", "Could not open payment page.");
        }
    };

    const handlePaymentVerification = async () => {
        setIsVerifying(true);
        try {
            const response = await api.checkPaymentStatus(transactionId);
            if (response.status === 'success') {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [
                            { name: 'Main' },
                            { name: 'LibraryTab' }
                        ],
                    })
                );
            } else {
                Alert.alert("Status", "Payment not yet verified. Please wait a moment or try again.");
            }
        } catch (error) {
            Alert.alert("Error", "Could not verify payment status. Please try again.");
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
