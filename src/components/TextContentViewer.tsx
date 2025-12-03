import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    useWindowDimensions,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';

interface TextContentViewerProps {
    content: string;
    onComplete?: () => void;
}

export const TextContentViewer: React.FC<TextContentViewerProps> = ({
    content,
    onComplete,
}) => {
    const { width } = useWindowDimensions();
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;

        if (isCloseToBottom && !hasScrolledToEnd) {
            setHasScrolledToEnd(true);
        }
    };

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

    // Check if content is HTML or plain text
    const isHtml = content.trim().startsWith('<');

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                onScroll={handleScroll}
                scrollEventThrottle={400}
                showsVerticalScrollIndicator={true}
            >
                {isHtml ? (
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
                    <Text style={styles.plainText}>{content}</Text>
                )}

                {/* Spacer for better scrolling */}
                <View style={styles.endSpacer} />
            </ScrollView>

            {/* Action Bar */}
            {onComplete && (
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={[
                            styles.completeButton,
                            // !hasScrolledToEnd && styles.completeButtonDisabled, // Removed restriction
                        ]}
                        onPress={handleMarkComplete}
                    // disabled={!hasScrolledToEnd} // Removed restriction
                    >
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#fff"
                        />
                        <Text
                            style={[
                                styles.completeButtonText,
                                // !hasScrolledToEnd && styles.completeButtonTextDisabled, // Removed restriction
                            ]}
                        >
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
        padding: spacing.xl,
    },
    plainText: {
        ...textStyles.body,
        color: colors.text,
        lineHeight: 24,
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
    completeButtonDisabled: {
        backgroundColor: colors.surfaceAlt,
    },
    completeButtonText: {
        ...textStyles.button,
        color: colors.textInverse,
    },
    completeButtonTextDisabled: {
        color: colors.textDisabled,
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
