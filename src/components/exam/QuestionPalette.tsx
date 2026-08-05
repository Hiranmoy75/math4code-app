import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Question } from '../../types';

interface QuestionPaletteProps {
    visible: boolean;
    onClose: () => void;
    questions: (Question & { sectionId: string; localIndex: number })[];
    responses: { [key: string]: any };
    markedForReview: { [key: string]: boolean };
    visited: { [key: string]: boolean };
    activeQuestionIdx: number;
    onSelectQuestion: (index: number) => void;
    onSubmit: () => void;
    sections: any[];
}

const { height } = Dimensions.get('window');

export const QuestionPalette = ({
    visible,
    onClose,
    questions,
    responses,
    markedForReview,
    visited,
    activeQuestionIdx,
    onSelectQuestion,
    onSubmit,
    sections
}: QuestionPaletteProps) => {
    const { colors, isDark } = useAppTheme();
    const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

    // Group questions by section
    const questionsBySection = useMemo(() => {
        const grouped: { [key: string]: typeof questions } = {};
        questions.forEach(q => {
            if (!grouped[q.section_id]) grouped[q.section_id] = [];
            grouped[q.section_id].push(q);
        });
        return grouped;
    }, [questions]);

    // Stats
    const stats = useMemo(() => {
        let answered = 0;
        let marked = 0;
        let skipped = 0;
        let notVisited = 0;

        questions.forEach(q => {
            const isAns = responses[q.id] !== undefined && responses[q.id] !== '' && (Array.isArray(responses[q.id]) ? responses[q.id].length > 0 : true);
            const isMark = markedForReview[q.id];
            const isVis = visited[q.id];

            if (isMark) marked++;
            else if (isAns) answered++;
            else if (isVis) skipped++;
            else notVisited++;
        });

        return { answered, marked, skipped, notVisited };
    }, [questions, responses, markedForReview, visited]);


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Question Palette</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <View style={[styles.statBadge, styles.badgeAnswered]} >
                                <Text style={styles.statCount}>{stats.answered}</Text>
                            </View>
                            <Text style={styles.statLabel}>Answered</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statBadge, styles.badgeMarked]} >
                                <Text style={styles.statCount}>{stats.marked}</Text>
                            </View>
                            <Text style={styles.statLabel}>Review</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statBadge, styles.badgeSkipped]} >
                                <Text style={styles.statCount}>{stats.skipped}</Text>
                            </View>
                            <Text style={styles.statLabel}>Skipped</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statBadge, styles.badgeNotVisited]} >
                                <Text style={styles.statCount}>{stats.notVisited}</Text>
                            </View>
                            <Text style={styles.statLabel}>Not Visited</Text>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {sections.map((section: any) => {
                            const sectionQuestions = questionsBySection[section.id] || [];
                            if (sectionQuestions.length === 0) return null;

                            return (
                                <View key={section.id} style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>{section.title}</Text>
                                    <View style={styles.grid}>
                                        {sectionQuestions.map((q) => {
                                            const globalIndex = questions.findIndex(gq => gq.id === q.id);
                                            const isAns = responses[q.id] !== undefined && responses[q.id] !== '' && (Array.isArray(responses[q.id]) ? responses[q.id].length > 0 : true);
                                            const isMark = markedForReview[q.id];
                                            const isVis = visited[q.id];
                                            const isActive = activeQuestionIdx === globalIndex;

                                            let badgeStyle = styles.badgeNotVisited;
                                            if (isMark) badgeStyle = styles.badgeMarked;
                                            else if (isAns) badgeStyle = styles.badgeAnswered;
                                            else if (isVis) badgeStyle = styles.badgeSkipped;

                                            if (isActive) badgeStyle = { ...badgeStyle, borderWidth: 2, borderColor: colors.primary } as any;

                                            return (
                                                <TouchableOpacity
                                                    key={q.id}
                                                    onPress={() => {
                                                        onSelectQuestion(globalIndex);
                                                        onClose();
                                                    }}
                                                    style={[styles.gridItem, badgeStyle, isActive && styles.activeItem]}
                                                >
                                                    <Text style={[
                                                        styles.gridText,
                                                        (isAns || isMark) && { color: '#FFF' },
                                                        isActive && { fontWeight: 'bold' }
                                                    ]}>
                                                        {q.localIndex + 1}
                                                    </Text>
                                                    {isMark && (
                                                        <View style={styles.tinyFlag}>
                                                            <Ionicons name="flag" size={8} color="#FFF" />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.submitButton} onPress={() => {
                            onClose();
                            setTimeout(onSubmit, 300);
                        }}>
                            <Text style={styles.submitButtonText}>Submit Exam</Text>
                            <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: colors.background,
        height: height * 0.85,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...textStyles.h4,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statCount: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.text, // default
    },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    sectionBlock: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...textStyles.h5,
        color: colors.text,
        marginBottom: spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    gridItem: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
        position: 'relative',
    },
    activeItem: {
        borderColor: colors.primary,
        borderWidth: 2,
        elevation: 4,
    },
    gridText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    badgeAnswered: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    badgeMarked: {
        backgroundColor: colors.primary, // Using primary (purple/blue) for marked
        borderColor: colors.primary,
    },
    badgeSkipped: {
        backgroundColor: colors.error, // Red for visited but not answered
        borderColor: colors.error,
    },
    badgeNotVisited: {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.border,
    },
    tinyFlag: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: colors.warning,
        width: 12,
        height: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
    },
    submitButton: {
        backgroundColor: colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
