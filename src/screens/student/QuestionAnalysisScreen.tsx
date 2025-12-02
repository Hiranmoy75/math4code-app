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

import { colors, shadows } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { supabase } from '../../services/supabase';

interface QuestionWithResponse {
    id: string;
    question_text: string;
    question_type: 'MCQ' | 'MSQ' | 'NAT';
    marks: number;
    negative_marks: number;
    correct_answer?: string;
    explanation?: string;
    options: any[];
    student_answer?: string;
    is_correct: boolean;
    marks_obtained: number;
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
            // Fetch sections with questions and options
            const { data: sections, error: sectionsError } = await supabase
                .from('sections')
                .select(`
                    id,
                    title,
                    questions (
                        id,
                        question_text,
                        question_type,
                        marks,
                        negative_marks,
                        correct_answer,
                        explanation,
                        options (*)
                    )
                `)
                .eq('exam_id', examId)
                .order('section_order', { ascending: true });

            if (sectionsError) throw sectionsError;

            // Fetch all responses for this attempt
            const { data: responses, error: responsesError } = await supabase
                .from('responses')
                .select('*')
                .eq('attempt_id', attemptId);

            if (responsesError) throw responsesError;

            // Create a map of responses
            const responseMap = new Map(
                (responses || []).map(r => [r.question_id, r.student_answer])
            );

            // Process questions with responses
            const processedQuestions: QuestionWithResponse[] = [];

            for (const section of sections) {
                for (const question of section.questions) {
                    const studentAnswer = responseMap.get(question.id);
                    let isCorrect = false;
                    let marksObtained = 0;

                    if (studentAnswer) {
                        if (question.question_type === 'MCQ') {
                            const correctOption = question.options.find((opt: any) => opt.is_correct);
                            isCorrect = studentAnswer === correctOption?.id;
                        } else if (question.question_type === 'MSQ') {
                            const correctOptionIds = question.options
                                .filter((opt: any) => opt.is_correct)
                                .map((opt: any) => opt.id)
                                .sort();

                            let studentOptionIds: string[] = [];
                            try {
                                studentOptionIds = JSON.parse(studentAnswer).sort();
                            } catch {
                                studentOptionIds = [studentAnswer];
                            }

                            isCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(studentOptionIds);
                        } else if (question.question_type === 'NAT') {
                            isCorrect = studentAnswer.trim() === question.correct_answer?.trim();
                        }

                        if (isCorrect) {
                            marksObtained = question.marks;
                        } else {
                            marksObtained = -(question.negative_marks || 0);
                        }
                    }

                    processedQuestions.push({
                        ...question,
                        student_answer: studentAnswer,
                        is_correct: isCorrect,
                        marks_obtained: marksObtained,
                        section_title: section.title,
                    });
                }
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

    const getOptionText = (question: QuestionWithResponse, optionId: string) => {
        const option = question.options.find(opt => opt.id === optionId);
        return option?.option_text || optionId;
    };

    const getStudentAnswerDisplay = (question: QuestionWithResponse) => {
        if (!question.student_answer) return 'Not Answered';

        if (question.question_type === 'NAT') {
            return question.student_answer;
        }

        if (question.question_type === 'MSQ') {
            try {
                const optionIds = JSON.parse(question.student_answer);
                return optionIds.map((id: string) => getOptionText(question, id)).join(', ');
            } catch {
                return getOptionText(question, question.student_answer);
            }
        }

        return getOptionText(question, question.student_answer);
    };

    const getCorrectAnswerDisplay = (question: QuestionWithResponse) => {
        if (question.question_type === 'NAT') {
            return question.correct_answer || 'N/A';
        }

        const correctOptions = question.options.filter((opt: any) => opt.is_correct);
        return correctOptions.map((opt: any) => opt.option_text).join(', ');
    };

    const getStatusColor = (question: QuestionWithResponse) => {
        if (!question.student_answer) return '#9CA3AF'; // Gray
        return question.is_correct ? '#10B981' : '#EF4444'; // Green or Red
    };

    const getStatusIcon = (question: QuestionWithResponse) => {
        if (!question.student_answer) return 'remove-circle-outline';
        return question.is_correct ? 'checkmark-circle' : 'close-circle';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Group questions by section
    const questionsBySection = questions.reduce((acc, q) => {
        if (!acc[q.section_title]) {
            acc[q.section_title] = [];
        }
        acc[q.section_title].push(q);
        return acc;
    }, {} as Record<string, QuestionWithResponse[]>);

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[colors.primary, '#FF8A65']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Question Analysis</Text>
            </LinearGradient>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {Object.entries(questionsBySection).map(([sectionTitle, sectionQuestions], sectionIndex) => (
                    <View key={sectionIndex} style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>{sectionTitle}</Text>

                        {sectionQuestions.map((question, index) => {
                            const isExpanded = expandedQuestions.has(question.id);
                            const statusColor = getStatusColor(question);

                            return (
                                <View key={question.id} style={styles.questionCard}>
                                    <TouchableOpacity
                                        onPress={() => toggleQuestion(question.id)}
                                        style={styles.questionHeader}
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
                                                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                                                <Text style={styles.questionType}>{question.question_type}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.questionHeaderRight}>
                                            <Text style={[styles.marksText, { color: statusColor }]}>
                                                {question.marks_obtained >= 0 ? '+' : ''}{question.marks_obtained}
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
                                            <Text style={styles.questionText}>{question.question_text}</Text>

                                            {/* Options for MCQ/MSQ */}
                                            {(question.question_type === 'MCQ' || question.question_type === 'MSQ') && (
                                                <View style={styles.optionsContainer}>
                                                    {question.options.map((option: any) => {
                                                        let optionStyle = styles.option;
                                                        if (option.is_correct) {
                                                            optionStyle = styles.optionCorrect;
                                                        }

                                                        return (
                                                            <View key={option.id} style={optionStyle}>
                                                                <Text style={styles.optionText}>{option.option_text}</Text>
                                                                {option.is_correct && (
                                                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                                                )}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}

                                            {/* Answer Summary */}
                                            <View style={styles.answerSummary}>
                                                <View style={styles.answerRow}>
                                                    <Text style={styles.answerLabel}>Your Answer:</Text>
                                                    <Text style={[
                                                        styles.answerValue,
                                                        { color: question.student_answer ? (question.is_correct ? '#10B981' : '#EF4444') : '#9CA3AF' }
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

                                            {/* Explanation */}
                                            {question.explanation && (
                                                <View style={styles.explanationContainer}>
                                                    <Text style={styles.explanationTitle}>Explanation:</Text>
                                                    <Text style={styles.explanationText}>{question.explanation}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        </View>
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
        paddingTop: 50,
        paddingBottom: 16,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: spacing.md,
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
        fontWeight: '600',
        color: '#2D3748',
    },
    questionType: {
        fontSize: 12,
        color: '#718096',
    },
    questionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    marksText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    questionDetails: {
        padding: spacing.md,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    questionText: {
        fontSize: 14,
        color: '#2D3748',
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    optionsContainer: {
        marginBottom: spacing.md,
    },
    option: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: '#F7FAFC',
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    optionCorrect: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: '#D1FAE5',
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionText: {
        fontSize: 14,
        color: '#2D3748',
    },
    answerSummary: {
        backgroundColor: '#F7FAFC',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    answerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    answerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },
    answerValue: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    explanationContainer: {
        backgroundColor: '#EBF8FF',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    explanationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C5282',
        marginBottom: spacing.xs,
    },
    explanationText: {
        fontSize: 14,
        color: '#2D3748',
        lineHeight: 20,
    },
});
