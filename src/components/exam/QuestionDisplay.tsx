import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MathText } from '../MathText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Question } from '../../types';

interface QuestionDisplayProps {
    question: Question;
    activeQuestionIdx: number;
    response: any;
    isMarked: boolean;
    onSave: (qid: string, ans: any) => void;
    onMark: (qid: string) => void;
    onNext: () => void;
    onPrev: () => void;
    onClear: () => void;
    onSubmit?: () => void;
    isFirst: boolean;
    isLast: boolean;
    totalQuestions: number;
}

const QuestionDisplayComponent = ({
    question,
    activeQuestionIdx,
    response,
    isMarked,
    onSave,
    onMark,
    onNext,
    onPrev,
    onClear,
    onSubmit,
    isFirst,
    isLast,
    totalQuestions
}: QuestionDisplayProps) => {
    const { colors, shadows } = useAppTheme();
    const insets = useSafeAreaInsets();

    const styles = getStyles(colors, spacing, borderRadius, textStyles, shadows, insets);

    if (!question) return null;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Header Info */}
                <View style={styles.headerInfo}>
                    <View style={styles.questionBadge}>
                        <Text style={styles.questionBadgeText}>Question {activeQuestionIdx + 1} of {totalQuestions}</Text>
                    </View>
                    <View style={styles.marksContainer}>
                        <Text style={styles.marksText}>+{question.marks}</Text>
                        <Text style={styles.negativeMarksText}>-{question.negative_marks}</Text>
                    </View>
                </View>

                {/* Question Text */}
                <View style={styles.questionContainer}>
                    <MathText
                        content={question.question_text}
                        textColor={colors.text}
                        fontSize={16}
                    />
                </View>
                {/* Options */}
                <View style={styles.optionsContainer}>
                    {question.question_type === 'MCQ' && question.options?.map((opt, idx) => {
                        const isSelected = response === opt.id;
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                onPress={() => onSave(question.id, opt.id)}
                                activeOpacity={0.7}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.optionSelected
                                ]}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    isSelected && styles.radioSelected
                                ]}>
                                    {isSelected ? (
                                        <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
                                    ) : (
                                        <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                                    )}
                                </View>
                                <View style={styles.optionContent}>
                                    <MathText
                                        content={opt.option_text}
                                        textColor={isSelected ? colors.primary : colors.text}
                                        fontSize={15}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {question.question_type === 'MSQ' && question.options?.map((opt, idx) => {
                        const current = Array.isArray(response) ? response : [];
                        const isSelected = current.includes(opt.id);
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                onPress={() => {
                                    const next = isSelected
                                        ? current.filter((x: string) => x !== opt.id)
                                        : [...current, opt.id];
                                    onSave(question.id, next);
                                }}
                                activeOpacity={0.7}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.optionSelected
                                ]}
                            >
                                <View style={[
                                    styles.checkboxSquare,
                                    isSelected && styles.checkboxSelected
                                ]}>
                                    {isSelected ? (
                                        <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
                                    ) : (
                                        <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                                    )}
                                </View>
                                <View style={styles.optionContent}>
                                    <MathText
                                        content={opt.option_text}
                                        textColor={isSelected ? colors.primary : colors.text}
                                        fontSize={15}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {question.question_type === 'NAT' && (
                        <View style={styles.natContainer}>
                            <Text style={styles.natLabel}>Your Answer:</Text>
                            <TextInput
                                style={styles.natInput}
                                placeholder="Enter numeric value..."
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={response ? String(response) : ''}
                                onChangeText={(text) => onSave(question.id, text)}
                            />
                        </View>
                    )}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Bar */}
            <View style={styles.actionBar}>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={onPrev}
                        disabled={isFirst}
                        style={[styles.navButton, isFirst && styles.navButtonDisabled]}
                    >
                        <Ionicons name="arrow-back" size={20} color={isFirst ? colors.textDisabled : colors.text} />
                        <Text style={[styles.navButtonText, isFirst && styles.navButtonTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClear}
                        disabled={!response || (Array.isArray(response) && response.length === 0)}
                        style={[styles.secondaryButton, (!response || (Array.isArray(response) && response.length === 0)) && styles.disabledOpacity]}
                    >
                        <Text style={styles.secondaryButtonText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => onMark(question.id)}
                        style={[styles.secondaryButton, isMarked && styles.activeSecondaryButton]}
                    >
                        <Ionicons
                            name={isMarked ? "flag" : "flag-outline"}
                            size={16}
                            color={isMarked ? '#FFF' : colors.warning}
                        />
                        <Text style={[styles.secondaryButtonText, isMarked && styles.activeSecondaryButtonText]}>
                            {isMarked ? "Marked" : "Mark"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={isLast && onSubmit ? onSubmit : onNext}
                        style={[styles.primaryButton, isLast && styles.submitButton]}
                    >
                        <Text style={styles.primaryButtonText}>{isLast ? "Submit" : "Next"}</Text>
                        {!isLast && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
                        {isLast && <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const getStyles = (colors: any, spacing: any, borderRadius: any, textStyles: any, shadows: any, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
    },
    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    questionBadge: {
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.md,
    },
    questionBadgeText: {
        ...textStyles.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    marksContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    marksText: {
        ...textStyles.caption,
        color: colors.success,
        fontWeight: '700',
    },
    negativeMarksText: {
        ...textStyles.caption,
        color: colors.error,
        fontWeight: '700',
    },
    questionContainer: {
        marginBottom: spacing.xl,
    },
    questionText: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 24,
    },
    optionsContainer: {
        gap: spacing.md,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxSquare: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    radioSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        borderWidth: 0,
    },
    checkboxSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        borderWidth: 0,
    },
    optionLetter: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    optionContent: {
        flex: 1,
    },
    optionText: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 22,
    },
    optionTextSelected: {
        color: colors.primary,
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    natContainer: {
        marginTop: spacing.sm,
    },
    natLabel: {
        ...textStyles.body,
        color: colors.text,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    natInput: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    actionBar: {
        padding: spacing.md,
        paddingBottom: Math.max(insets.bottom, spacing.md),
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadows.medium,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        justifyContent: 'space-between',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: 4,
        minWidth: 70,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        color: colors.text,
        fontWeight: '600',
    },
    navButtonTextDisabled: {
        color: colors.textDisabled,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    disabledOpacity: {
        opacity: 0.5,
    },
    activeSecondaryButton: {
        backgroundColor: colors.warning,
        borderColor: colors.warning,
    },
    secondaryButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
    },
    activeSecondaryButtonText: {
        color: '#FFF',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 4,
        borderRadius: borderRadius.lg,
        gap: spacing.xs,
    },
    primaryButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
    submitButton: {
        backgroundColor: colors.success,
    }
});

export const QuestionDisplay = memo(QuestionDisplayComponent);
