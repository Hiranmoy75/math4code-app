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
    StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';

import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { api } from '../../services/api';

export const PaymentWebViewScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { paymentUrl, transactionId, courseId } = route.params;

    const webViewRef = useRef<WebView>(null);
    const [isWebViewLoading, setIsWebViewLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationAttempted, setVerificationAttempted] = useState(false);

    // Safety timeout for loading state
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isWebViewLoading) {
            timeout = setTimeout(() => {
                if (isWebViewLoading) {

                    setIsWebViewLoading(false);
                }
            }, 15000); // 15 seconds timeout
        }
        return () => clearTimeout(timeout);
    }, [isWebViewLoading]);

    // Prevent back action during verification
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (isVerifying) {
                e.preventDefault();
                Alert.alert(
                    'Payment in Progress',
                    'Please wait while we verify your payment. Do not close this screen.',
                    [{ text: 'OK' }]
                );
            }
        });
        return unsubscribe;
    }, [navigation, isVerifying]);

    // Web Polling Logic
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const interval = setInterval(async () => {
            if (isVerifying || verificationAttempted) return;

            try {

                const response = await api.verifyPayment(transactionId, courseId);

                if (response.success) {
                    clearInterval(interval);
                    handlePaymentVerification();
                }
            } catch (error: any) {


                if (Platform.OS === 'web' && error.message && error.message.includes('Network request failed') && !verificationAttempted) {

                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [Platform.OS, isVerifying, verificationAttempted, transactionId, courseId]);

    const handlePaymentVerification = async () => {
        if (verificationAttempted) return;
        setVerificationAttempted(true);
        setIsVerifying(true);

        try {

            const response = await api.verifyPayment(transactionId, courseId);

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
            Alert.alert(
                "Payment Failed",
                error.message || "We couldn't verify your payment. If money was deducted, it will be refunded automatically.",
                [{
                    text: "Retry",
                    onPress: () => {
                        setVerificationAttempted(false);
                        setIsVerifying(false);
                        if (Platform.OS !== 'web') {
                            webViewRef.current?.reload();
                        }
                    }
                }, {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => navigation.goBack()
                }]
            );
        } finally {
            setIsVerifying(false);
        }
    };

    const handleNavigationStateChange = (navState: any) => {
        const { url, loading } = navState;


        // Check for success redirect, OR any return to our domain (including login redirect)
        if (
            url.includes('/payment/success') ||
            url.includes('/api/phonepe/redirect') ||
            url.includes('/login') ||
            (url.includes('math4code.com') && !url.includes('google.com'))
        ) {

            webViewRef.current?.stopLoading();
            handlePaymentVerification();
            return;
        }

        // Check for failure redirect
        if (url.includes('/payment/failed')) {

            webViewRef.current?.stopLoading();
            Alert.alert(
                "Payment Failed",
                "The payment was not completed.",
                [{
                    text: "Retry",
                    onPress: () => webViewRef.current?.reload()
                }, {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => navigation.goBack()
                }]
            );
            return;
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

    // Web Render
    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton} disabled={isVerifying}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Secure Payment</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.webViewContainer}>
                    <iframe
                        src={paymentUrl}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Payment Gateway"
                    />

                    {/* Web Overlay for Verification */}
                    {isVerifying && (
                        <View style={styles.verificationOverlay}>
                            <View style={styles.verificationCard}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.verificationTitle}>Verifying Payment</Text>
                                <Text style={styles.verificationText}>Please do not close this tab...</Text>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    // Native Render
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton} disabled={isVerifying}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Secure Payment</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.webViewContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: paymentUrl }}
                    originWhitelist={['*']}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadStart={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;

                        setIsWebViewLoading(true);
                    }}
                    onLoadEnd={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;

                        setIsWebViewLoading(false);
                    }}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('WebView Error:', nativeEvent);
                        setIsWebViewLoading(false);
                        Alert.alert('Error', 'Failed to load payment page. Please try again.');
                    }}
                    style={styles.webView}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                />

                {isWebViewLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading payment gateway...</Text>
                    </View>
                )}
            </View>

            {isVerifying && (
                <View style={styles.verificationOverlay}>
                    <View style={styles.verificationCard}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.verificationTitle}>Verifying Payment</Text>
                        <Text style={styles.verificationText}>Please do not close the app...</Text>
                    </View>
                </View>
            )}
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
    placeholder: {
        width: 40,
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    loadingText: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    verificationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    verificationCard: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderRadius: 16,
        alignItems: 'center',
        width: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    verificationTitle: {
        ...textStyles.h3,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    verificationText: {
        ...textStyles.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
