import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Linking,
    Alert,
    Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';

const { width } = Dimensions.get('window');

interface PDFViewerProps {
    pdfUrl: string;
    isDownloadable?: boolean;
    onComplete?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
    pdfUrl,
    isDownloadable = true,
    onComplete,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasViewed, setHasViewed] = useState(false);

    // Use Google Docs Viewer for cross-platform PDF rendering
    const viewerUrl = Platform.OS === 'web'
        ? pdfUrl
        : `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

    const handleDownload = async () => {
        try {
            const supported = await Linking.canOpenURL(pdfUrl);
            if (supported) {
                await Linking.openURL(pdfUrl);
            } else {
                Alert.alert('Error', 'Cannot open PDF URL');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to download PDF');
        }
    };

    const handleMarkComplete = () => {
        if (onComplete) {
            onComplete();
            Alert.alert('Success', 'Lesson marked as complete!');
        }
    };

    const handleLoadEnd = () => {
        setIsLoading(false);
        setHasViewed(true);
    };

    const handleError = () => {
        setIsLoading(false);
        setError('Failed to load PDF. Please check your internet connection.');
    };

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => {
                    setError(null);
                    setIsLoading(true);
                }}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                {isDownloadable && (
                    <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                        <Text style={styles.downloadButtonText}>Download PDF</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading PDF...</Text>
                </View>
            )}

            <WebView
                source={{ uri: viewerUrl }}
                style={styles.webview}
                onLoadEnd={handleLoadEnd}
                onError={handleError}
                startInLoadingState={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />

            {/* Action Buttons */}
            <View style={styles.actionBar}>
                {isDownloadable && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                        <Text style={styles.actionButtonText}>Download</Text>
                    </TouchableOpacity>
                )}
                {onComplete && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton]}
                        onPress={handleMarkComplete}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.completeButtonText}>Mark Complete</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    webview: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        zIndex: 10,
    },
    loadingText: {
        marginTop: spacing.md,
        ...textStyles.body,
        color: colors.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.background,
    },
    errorText: {
        ...textStyles.body,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    retryButtonText: {
        ...textStyles.button,
        color: colors.textInverse,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.lg,
    },
    downloadButtonText: {
        ...textStyles.button,
        color: colors.primary,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.lg,
    },
    actionButtonText: {
        ...textStyles.button,
        color: colors.primary,
    },
    completeButton: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    completeButtonText: {
        ...textStyles.button,
        color: colors.textInverse,
    },
});
