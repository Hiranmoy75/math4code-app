import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, shadows } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { supabase } from '../../services/supabase';
import { MathText } from '../../components/MathText';

interface QuestionWithResponse {
    id: string;
    section_id: string;
    question_text: string;
    question_type: 'MCQ' | 'MSQ' | 'NAT';
    marks: number;
    negative_marks: number;
    correct_answer?: string;
    explanation?: string;
    options: any[];
    student_answer?: string;     // plain string from DB (bare UUID for MCQ, JSON array for MSQ, plain string for NAT)
    is_correct: boolean;
    marks_obtained: number;
    is_attempted: boolean;
    section_title: string;
}

export const QuestionAnalysisScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { attemptId, examId } = route.params;

    const [questions, setQuestions] = useState<QuestionWithResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadQuestionAnalysis();
    }, [attemptId]);

    const loadQuestionAnalysis = async () => {
        try {
            // ── 1. Fetch all sections for this exam ──
            const { data: sections, error: sectionsError } = await supabase
                .from('sections')
                .select('id, title, section_order')
                .eq('exam_id', examId)
                .order('section_order', { ascending: true });

            if (sectionsError) throw sectionsError;
            if (!sections || sections.length === 0) {
                setQuestions([]);
                setLoading(false);
                return;
            }

            const sectionIds = sections.map((s: any) => s.id);

            // ── 2. Fetch all questions for these sections ──
            const { data: questionsData, error: questionsError } = await supabase
                .from('questions')
                .select('id, section_id, question_text, question_type, marks, negative_marks, correct_answer, explanation, question_order')
                .in('section_id', sectionIds)
                .order('question_order', { ascending: true });

            if (questionsError) throw questionsError;

            const questionIds = (questionsData || []).map((q: any) => q.id);

            // ── 3. Fetch all options & responses in parallel ──
            const [optionsResult, responsesResult] = await Promise.all([
                supabase
                    .from('options')
                    .select('id, question_id, option_text, is_correct, option_order')
                    .in('question_id', questionIds)
                    .order('option_order', { ascending: true }),
                supabase
                    .from('responses')
                    .select('question_id, student_answer, is_marked_for_review')
                    .eq('attempt_id', attemptId)
            ]);

            if (optionsResult.error) throw optionsResult.error;
            if (responsesResult.error) throw responsesResult.error;

            // ── 4. Build lookup maps ──
            // options map: { questionId -> Option[] }
            const optionsMap = new Map<string, any[]>();
            for (const opt of (optionsResult.data || [])) {
                if (!optionsMap.has(opt.question_id)) optionsMap.set(opt.question_id, []);
                optionsMap.get(opt.question_id)!.push(opt);
            }

            // response map: { questionId -> student_answer string }
            const responseMap = new Map<string, string | undefined>(
                (responsesResult.data || []).map((r: any) => [r.question_id, r.student_answer])
            );

            // section map: { sectionId -> section title }
            const sectionMap = new Map<string, string>(
                sections.map((s: any) => [s.id, s.title || 'Section'])
            );

            // ── 5. Assemble questions with responses + correctness ──
            const processedQuestions: QuestionWithResponse[] = [];

            for (const question of (questionsData || [])) {
                const sortedOptions = (optionsMap.get(question.id) || [])
                    .sort((a: any, b: any) => (a.option_order || 0) - (b.option_order || 0));

                const studentAnswer = responseMap.get(question.id);
                const isAttempted = !!studentAnswer && studentAnswer !== '' && studentAnswer !== '[]';

                // ── Correctness check (matches DB SQL grading logic exactly) ──
                let isCorrect = false;
                let marksObtained = 0;

                if (isAttempted) {
                    if (question.question_type === 'MCQ') {
                        // MCQ: student_answer is a plain UUID string
                        const correctOption = sortedOptions.find((opt: any) => opt.is_correct);
                        isCorrect = studentAnswer === correctOption?.id;
                    } else if (question.question_type === 'MSQ') {
                        // MSQ: student_answer is a JSON array string e.g. '["uuid1","uuid2"]'
                        const correctIds = sortedOptions
                            .filter((opt: any) => opt.is_correct)
                            .map((opt: any) => opt.id)
                            .sort();
                        let studentIds: string[] = [];
                        try {
                            studentIds = JSON.parse(studentAnswer!).sort();
                        } catch {
                            studentIds = [];
                        }
                        isCorrect = JSON.stringify(correctIds) === JSON.stringify(studentIds);
                    } else if (question.question_type === 'NAT') {
                        // NAT: numeric tolerance ±0.01 (same as SQL)
                        try {
                            const diff = parseFloat(studentAnswer!) - parseFloat(question.correct_answer || '0');
                            isCorrect = Math.abs(diff) <= 0.01;
                        } catch {
                            isCorrect = studentAnswer?.trim() === question.correct_answer?.trim();
                        }
                    }
                    marksObtained = isCorrect ? question.marks : -(question.negative_marks || 0);
                }

                processedQuestions.push({
                    ...question,
                    options: sortedOptions,
                    student_answer: studentAnswer,
                    is_correct: isCorrect,
                    marks_obtained: marksObtained,
                    is_attempted: isAttempted,
                    section_title: sectionMap.get(question.section_id) || 'Section',
                });
            }

            setQuestions(processedQuestions);
        } catch (error) {
            console.error('Error loading question analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestion = (questionId: string) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
    };

    // ── Get option display text by id ──
    const getOptionText = (question: QuestionWithResponse, optionId: string) => {
        const option = question.options.find(opt => opt.id === optionId);
        return option?.option_text || optionId;
    };

    // ── Check if a student selected this specific option ──
    const isOptionSelectedByStudent = (question: QuestionWithResponse, optionId: string): boolean => {
        if (!question.student_answer || !question.is_attempted) return false;
        if (question.question_type === 'MCQ') {
            return question.student_answer === optionId;
        }
        if (question.question_type === 'MSQ') {
            try {
                const selected: string[] = JSON.parse(question.student_answer);
                return selected.includes(optionId);
            } catch {
                return false;
            }
        }
        return false;
    };

    // ── Format student's answer as readable text ──
    const getStudentAnswerDisplay = (question: QuestionWithResponse) => {
        if (!question.is_attempted) return 'Not Answered';

        if (question.question_type === 'NAT') {
            return question.student_answer || '—';
        }

        if (question.question_type === 'MSQ') {
            try {
                const optionIds: string[] = JSON.parse(question.student_answer!);
                return optionIds.map(id => getOptionText(question, id)).join(', ');
            } catch {
                return getOptionText(question, question.student_answer!);
            }
        }

        // MCQ: plain UUID string
        return getOptionText(question, question.student_answer!);
    };

    // ── Format correct answer as readable text ──
    const getCorrectAnswerDisplay = (question: QuestionWithResponse) => {
        if (question.question_type === 'NAT') {
            return question.correct_answer || 'N/A';
        }
        const correctOptions = question.options.filter((opt: any) => opt.is_correct);
        return correctOptions.map((opt: any) => opt.option_text).join(', ');
    };

    // ── Option visual state ──
    const getOptionStyle = (question: QuestionWithResponse, option: any) => {
        const studentSelected = isOptionSelectedByStudent(question, option.id);
        const isCorrect = option.is_correct;

        if (isCorrect && studentSelected) return styles.optionCorrectSelected;    // Green solid
        if (isCorrect && !studentSelected) return styles.optionCorrect;           // Green outline
        if (!isCorrect && studentSelected) return styles.optionWrongSelected;     // Red solid
        return styles.option;
    };

    const getOptionTextColor = (question: QuestionWithResponse, option: any) => {
        const studentSelected = isOptionSelectedByStudent(question, option.id);
        const isCorrect = option.is_correct;
        if (isCorrect) return '#065f46';
        if (studentSelected) return '#7f1d1d';
        return '#2D3748';
    };

    const getStatusColor = (question: QuestionWithResponse) => {
        if (!question.is_attempted) return '#9CA3AF';
        return question.is_correct ? '#10B981' : '#EF4444';
    };

    const getStatusIcon = (question: QuestionWithResponse): any => {
        if (!question.is_attempted) return 'remove-circle-outline';
        return question.is_correct ? 'checkmark-circle' : 'close-circle';
    };

    const formatMarks = (question: QuestionWithResponse) => {
        if (!question.is_attempted) return '0';
        if (question.marks_obtained > 0) return `+${question.marks_obtained}`;
        return `${question.marks_obtained}`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading analysis...</Text>
            </View>
        );
    }

    // Summary stats
    const correct = questions.filter(q => q.is_correct).length;
    const wrong = questions.filter(q => q.is_attempted && !q.is_correct).length;
    const unanswered = questions.filter(q => !q.is_attempted).length;
    const totalObtained = questions.reduce((sum, q) => sum + q.marks_obtained, 0);

    // Group questions by section — using an ordered array to preserve section_order
    // We build: [{ sectionId, sectionTitle, questions[] }, ...]
    const sectionGroups = (() => {
        const map = new Map<string, { sectionId: string; sectionTitle: string; questions: QuestionWithResponse[] }>();
        const order: string[] = [];
        for (const q of questions) {
            if (!map.has(q.section_id)) {
                map.set(q.section_id, { sectionId: q.section_id, sectionTitle: q.section_title, questions: [] });
                order.push(q.section_id);
            }
            map.get(q.section_id)!.questions.push(q);
        }
        return order.map(id => map.get(id)!);
    })();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={[colors.primary, '#FF8A65'] as [string, string]}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Question Analysis</Text>
            </LinearGradient>

            {/* Summary Strip */}
            <View style={styles.summaryStrip}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNum}>{correct}</Text>
                    <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Correct</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNum}>{wrong}</Text>
                    <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>Wrong</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryNum}>{unanswered}</Text>
                    <Text style={[styles.summaryLabel, { color: '#9CA3AF' }]}>Skipped</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryNum, { color: totalObtained >= 0 ? '#10B981' : '#EF4444' }]}>
                        {totalObtained >= 0 ? `+${totalObtained}` : totalObtained}
                    </Text>
                    <Text style={styles.summaryLabel}>Score</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {sectionGroups.map(({ sectionId, sectionTitle, questions: sectionQuestions }) => (
                    <View key={sectionId} style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>{sectionTitle}</Text>

                        {sectionQuestions.map((question, index) => {
                            const isExpanded = expandedQuestions.has(question.id);
                            const statusColor = getStatusColor(question);

                            return (
                                <View key={question.id} style={styles.questionCard}>
                                    <TouchableOpacity
                                        onPress={() => toggleQuestion(question.id)}
                                        style={styles.questionHeader}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.questionHeaderLeft}>
                                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                                <Ionicons
                                                    name={getStatusIcon(question)}
                                                    size={20}
                                                    color="#fff"
                                                />
                                            </View>
                                            <View style={styles.questionHeaderText}>
                                                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                                <View style={styles.tagRow}>
                                                    <View style={[styles.typeTag, { backgroundColor: '#EDE9FE' }]}>
                                                        <Text style={[styles.typeTagText, { color: '#6D28D9' }]}>{question.question_type}</Text>
                                                    </View>
                                                    <Text style={styles.marksMeta}>+{question.marks} / -{question.negative_marks}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.questionHeaderRight}>
                                            <Text style={[styles.marksText, { color: statusColor }]}>
                                                {formatMarks(question)}
                                            </Text>
                                            <Ionicons
                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={20}
                                                color={colors.textSecondary}
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.questionDetails}>
                                            {/* Question Text */}
                                            <MathText content={question.question_text} textColor="#2D3748" fontSize={14} />

                                            {/* Options for MCQ/MSQ — all shown with color coding */}
                                            {(question.question_type === 'MCQ' || question.question_type === 'MSQ') && (
                                                <View style={styles.optionsContainer}>
                                                    {question.options.map((option: any) => {
                                                        const studentSelected = isOptionSelectedByStudent(question, option.id);
                                                        const optStyle = getOptionStyle(question, option);
                                                        const textColor = getOptionTextColor(question, option);

                                                        return (
                                                            <View key={option.id} style={optStyle}>
                                                                <View style={{ flex: 1 }}>
                                                                    <MathText
                                                                        content={option.option_text}
                                                                        textColor={textColor}
                                                                        fontSize={13}
                                                                    />
                                                                </View>
                                                                <View style={styles.optionIcons}>
                                                                    {option.is_correct && (
                                                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                                    )}
                                                                    {studentSelected && !option.is_correct && (
                                                                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                                                                    )}
                                                                    {studentSelected && option.is_correct && (
                                                                        <View style={styles.youLabel}>
                                                                            <Text style={styles.youLabelText}>Your Answer ✓</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}

                                            {/* NAT: dedicated two-column card (matches website) */}
                                            {question.question_type === 'NAT' && (() => {
                                                const correctVal = parseFloat(question.correct_answer || '0');
                                                const rangeMin = (correctVal - 0.01).toFixed(2);
                                                const rangeMax = (correctVal + 0.01).toFixed(2);
                                                return (
                                                    <View style={styles.natAnswerGrid}>
                                                        {/* Student's answer */}
                                                        <View style={[
                                                            styles.natAnswerCard,
                                                            {
                                                                backgroundColor: !question.is_attempted
                                                                    ? '#F7FAFC'
                                                                    : question.is_correct ? '#ECFDF5' : '#FEF2F2',
                                                                borderColor: !question.is_attempted
                                                                    ? '#E2E8F0'
                                                                    : question.is_correct ? '#6EE7B7' : '#FCA5A5',
                                                            }
                                                        ]}>
                                                            <Text style={styles.natCardLabel}>Your Answer</Text>
                                                            <Text style={[
                                                                styles.natCardValue,
                                                                {
                                                                    color: !question.is_attempted
                                                                        ? '#9CA3AF'
                                                                        : question.is_correct ? '#065F46' : '#991B1B'
                                                                }
                                                            ]}>
                                                                {question.is_attempted ? (question.student_answer || '—') : 'Not Answered'}
                                                            </Text>
                                                        </View>

                                                        {/* Correct answer + range */}
                                                        <View style={styles.natCorrectCard}>
                                                            <Text style={styles.natCardLabel}>Correct Answer</Text>
                                                            <Text style={styles.natCorrectValue}>
                                                                {question.correct_answer || 'N/A'}
                                                            </Text>
                                                            <Text style={styles.natRangeText}>
                                                                Range: {rangeMin} – {rangeMax}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                );
                                            })()}

                                            {/* MCQ/MSQ: compact answer summary rows */}
                                            {question.question_type !== 'NAT' && (
                                                <View style={styles.answerSummary}>
                                                    <View style={styles.answerRow}>
                                                        <Text style={styles.answerLabel}>Your Answer:</Text>
                                                        <Text style={[
                                                            styles.answerValue,
                                                            {
                                                                color: !question.is_attempted
                                                                    ? '#9CA3AF'
                                                                    : question.is_correct ? '#10B981' : '#EF4444'
                                                            }
                                                        ]}>
                                                            {getStudentAnswerDisplay(question)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.answerRow}>
                                                        <Text style={styles.answerLabel}>Correct Answer:</Text>
                                                        <Text style={[styles.answerValue, { color: '#10B981' }]}>
                                                            {getCorrectAnswerDisplay(question)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}

                                            {/* Explanation */}
                                            {question.explanation && question.explanation.trim() !== '' && (
                                                <View style={styles.explanationContainer}>
                                                    <Text style={styles.explanationTitle}>💡 Explanation</Text>
                                                    <MathText content={question.explanation} textColor="#2D3748" fontSize={13} />
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: spacing.lg,
    },
    backButton: {
        marginRight: spacing.md,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },

    // ── Summary Strip ──
    summaryStrip: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        ...shadows.small,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryNum: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#718096',
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 4,
    },

    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
    },
    sectionContainer: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: spacing.md,
        paddingLeft: 4,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        paddingVertical: 2,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        ...shadows.small,
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    questionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    questionHeaderText: {
        flex: 1,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2D3748',
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    typeTag: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    typeTagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    marksMeta: {
        fontSize: 11,
        color: '#718096',
    },
    questionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    marksText: {
        fontSize: 16,
        fontWeight: '800',
    },

    // ── Expanded Details ──
    questionDetails: {
        padding: spacing.md,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    optionsContainer: {
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        gap: 6,
    },

    // Option states
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: '#F7FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionCorrect: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: '#ECFDF5',
        borderWidth: 1.5,
        borderColor: '#10B981',
    },
    optionCorrectSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: '#D1FAE5',
        borderWidth: 2,
        borderColor: '#059669',
    },
    optionWrongSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: '#FEF2F2',
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    optionIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: 6,
        flexShrink: 0,
    },
    youLabel: {
        backgroundColor: '#059669',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    youLabelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },

    // ── Answer Summary ──
    answerSummary: {
        backgroundColor: '#F7FAFC',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        gap: 6,
    },
    answerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    answerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4A5568',
        flexShrink: 0,
    },
    answerValue: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },

    // ── NAT Answer Cards ──
    natAnswerGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    natAnswerCard: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
    },
    natCorrectCard: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: '#ECFDF5',
        borderWidth: 1.5,
        borderColor: '#6EE7B7',
    },
    natCardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#718096',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    natCardValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    natCorrectValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#065F46',
    },
    natRangeText: {
        fontSize: 10,
        color: '#10B981',
        marginTop: 4,
        fontWeight: '500',
    },

    // ── Explanation ──
    explanationContainer: {
        backgroundColor: '#EBF8FF',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    explanationTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2C5282',
        marginBottom: spacing.xs,
    },
});
