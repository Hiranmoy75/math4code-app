import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    useWindowDimensions,
    Platform,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { parseMathContent, buildMathHtmlDocument } from '../utils/mathBlockParser';

interface TextContentViewerProps {
    content: string;
    onComplete?: () => void;
}

export const TextContentViewer: React.FC<TextContentViewerProps> = ({
    content,
    onComplete,
}) => {
    const { width } = useWindowDimensions();
    // Default initial height higher to prevent truncation before first postMessage
    const [webViewHeight, setWebViewHeight] = useState<number>(800);

    // Reset height on content change
    useEffect(() => {
        setWebViewHeight(800);
    }, [content]);

    // Handle iframe postMessage on Web platform
    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const handleWindowMessage = (event: MessageEvent) => {
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (data && typeof data.height === 'number' && data.height > 50) {
                        setWebViewHeight(prev => Math.max(prev, data.height));
                    }
                } catch (e) {
                    // Ignore non-JSON or external origin messages
                }
            };

            window.addEventListener('message', handleWindowMessage);
            return () => window.removeEventListener('message', handleWindowMessage);
        }
    }, []);

    const handleMarkComplete = () => {
        if (onComplete) {
            onComplete();
            Alert.alert('Success', 'Lesson marked as complete!');
        }
    };

    // Safety check for empty content
    if (!content || content.trim().length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No content available</Text>
                </View>
            </View>
        );
    }

    // Detect legacy HTML format
    const isLegacyHtml = content.trim().startsWith('<');

    // Parse modern LaTeX / Markdown content
    const fullHtml = useMemo(() => {
        if (isLegacyHtml) return null;
        const parsedBody = parseMathContent(content);
        return buildMathHtmlDocument(parsedBody, {
            fontSize: 16,
            textColor: colors.text,
            backgroundColor: 'transparent',
        });
    }, [content, isLegacyHtml]);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
            >
                {isLegacyHtml ? (
                    <RenderHtml
                        contentWidth={width - spacing.xl * 2}
                        source={{ html: content }}
                        tagsStyles={{
                            body: {
                                color: colors.text,
                                fontSize: 16,
                                lineHeight: 24,
                            },
                            p: {
                                marginBottom: spacing.md,
                                color: colors.text,
                            },
                            h1: {
                                fontSize: 28,
                                fontWeight: 'bold',
                                marginBottom: spacing.md,
                                marginTop: spacing.lg,
                                color: colors.text,
                            },
                            h2: {
                                fontSize: 24,
                                fontWeight: 'bold',
                                marginBottom: spacing.sm,
                                marginTop: spacing.md,
                                color: colors.text,
                            },
                            h3: {
                                fontSize: 20,
                                fontWeight: 'bold',
                                marginBottom: spacing.sm,
                                marginTop: spacing.md,
                                color: colors.text,
                            },
                            h4: {
                                fontSize: 18,
                                fontWeight: '600',
                                marginBottom: spacing.xs,
                                marginTop: spacing.sm,
                                color: colors.text,
                            },
                            ul: {
                                marginBottom: spacing.md,
                                marginLeft: spacing.md,
                            },
                            ol: {
                                marginBottom: spacing.md,
                                marginLeft: spacing.md,
                            },
                            li: {
                                marginBottom: spacing.xs,
                                color: colors.text,
                            },
                            a: {
                                color: colors.primary,
                                textDecorationLine: 'underline',
                            },
                            strong: {
                                fontWeight: 'bold',
                                color: colors.text,
                            },
                            em: {
                                fontStyle: 'italic',
                                color: colors.text,
                            },
                            code: {
                                backgroundColor: colors.surfaceAlt,
                                padding: 4,
                                borderRadius: 4,
                                fontFamily: 'monospace',
                                fontSize: 14,
                            },
                            pre: {
                                backgroundColor: colors.surfaceAlt,
                                padding: spacing.md,
                                borderRadius: borderRadius.md,
                                marginBottom: spacing.md,
                            },
                            blockquote: {
                                borderLeftWidth: 4,
                                borderLeftColor: colors.primary,
                                paddingLeft: spacing.md,
                                marginLeft: 0,
                                marginBottom: spacing.md,
                                fontStyle: 'italic',
                                color: colors.textSecondary,
                            },
                            img: {
                                marginBottom: spacing.md,
                                borderRadius: borderRadius.md,
                            },
                        }}
                    />
                ) : (
                    <View style={{ width: '100%', minHeight: webViewHeight }}>
                        {Platform.OS === 'web' ? (
                            React.createElement('iframe', {
                                srcDoc: fullHtml,
                                style: {
                                    width: '100%',
                                    minHeight: '400px',
                                    height: `${webViewHeight}px`,
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                },
                            })
                        ) : (
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: fullHtml || '' }}
                                style={{
                                    height: webViewHeight,
                                    backgroundColor: 'transparent',
                                }}
                                scrollEnabled={false}
                                onMessage={(event) => {
                                    try {
                                        const data = JSON.parse(event.nativeEvent.data);
                                        if (data.height && data.height > 50) {
                                            setWebViewHeight(prev => Math.max(prev, data.height));
                                        }
                                    } catch (e) {
                                        // Ignore
                                    }
                                }}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            />
                        )}
                    </View>
                )}

                {/* Spacer for better scrolling */}
                <View style={styles.endSpacer} />
            </ScrollView>

            {/* Action Bar */}
            {onComplete && (
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={handleMarkComplete}
                    >
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#fff"
                        />
                        <Text style={styles.completeButtonText}>
                            Mark as Complete
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
    },
    endSpacer: {
        height: spacing.xl,
    },
    actionBar: {
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        backgroundColor: colors.success,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
    },
    completeButtonText: {
        ...textStyles.button,
        color: colors.textInverse,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
