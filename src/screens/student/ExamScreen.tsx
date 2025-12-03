import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    BackHandler,
    TextInput,
    Modal,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { useExam } from '../../hooks/useExam';
import { supabase } from '../../services/supabase';
import { MathText } from '../../components/MathText';
import { ConfirmationModal } from '../../components/ConfirmationModal';

const { width } = Dimensions.get('window');

export const ExamScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors } = useAppTheme();
    const { examId, attemptId } = route.params;

    const {
        exam,
        sections,
        isLoading,
        checkExamEligibility,
        startAttempt,
        saveResponse,
        submitAttempt,
        isSubmitting
    } = useExam(examId);

    const [currentAttempt, setCurrentAttempt] = useState<any>(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    // Global question index across all sections
    const [globalQuestionIndex, setGlobalQuestionIndex] = useState(0);

    const [responses, setResponses] = useState<{ [key: string]: any }>({});
    const [markedForReview, setMarkedForReview] = useState<{ [key: string]: boolean }>({});
    const [visited, setVisited] = useState<{ [key: string]: boolean }>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isExamStarted, setIsExamStarted] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [checkingEligibility, setCheckingEligibility] = useState(true);
    const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [pauseModalVisible, setPauseModalVisible] = useState(false);
    const [submitModalVisible, setSubmitModalVisible] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Flatten questions for easier global navigation
    const allQuestions = useMemo(() => {
        if (!sections) return [];
        return sections.flatMap((section, sIndex) =>
            section.questions?.map((q, qIndex) => ({
                ...q,
                sectionId: section.id,
                sectionIndex: sIndex,
                sectionTitle: section.title,
                localIndex: qIndex
            })) || []
        );
    }, [sections]);

    // Sync Section Tab with Global Question Index
    useEffect(() => {
        if (allQuestions.length > 0) {
            const currentQ = allQuestions[globalQuestionIndex];
            if (currentQ && currentQ.sectionIndex !== currentSectionIndex) {
                setCurrentSectionIndex(currentQ.sectionIndex);
            }
        }
    }, [globalQuestionIndex, allQuestions]);

    // Check Eligibility and Load Attempt on Mount
    useEffect(() => {
        const check = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    Alert.alert("Error", "Please login to continue");
                    navigation.goBack();
                    return;
                }

                // If resuming existing attempt
                if (attemptId) {
                    // Load existing attempt
                    const { data: existingAttempt } = await supabase
                        .from('exam_attempts')
                        .select('*')
                        .eq('id', attemptId)
                        .single();

                    if (existingAttempt && existingAttempt.status === 'in_progress') {


                        setCurrentAttempt(existingAttempt);
                        setIsExamStarted(true);

                        // Fetch exam duration to calculate remaining time
                        const { data: examData, error: examError } = await supabase
                            .from('exams')
                            .select('duration_minutes')
                            .eq('id', examId)
                            .single();



                        if (examData && examData.duration_minutes && existingAttempt.started_at) {
                            // Calculate remaining time
                            const startTime = new Date(existingAttempt.started_at).getTime();
                            const currentTime = Date.now();
                            const elapsedMilliseconds = currentTime - startTime;
                            const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
                            const totalSeconds = examData.duration_minutes * 60;
                            const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);












                            if (remainingSeconds > 0) {
                                setTimeLeft(remainingSeconds);

                            } else {

                                setTimeLeft(0);
                                // Auto-submit if time expired
                                setTimeout(() => {
                                    handleSubmitExam(true);
                                }, 1000);
                            }
                        } else {
                            console.error('Missing exam data or started_at:', {
                                examData,
                                started_at: existingAttempt.started_at
                            });
                            // Fallback: set to full duration if data is missing
                            if (examData?.duration_minutes) {
                                setTimeLeft(examData.duration_minutes * 60);
                            }
                        }

                        // Load existing responses
                        const { data: savedResponses } = await supabase
                            .from('responses')
                            .select('question_id, student_answer, is_marked_for_review')
                            .eq('attempt_id', attemptId);

                        if (savedResponses) {
                            const responsesMap: { [key: string]: any } = {};
                            const reviewMap: { [key: string]: boolean } = {};
                            const visitedMap: { [key: string]: boolean } = {};

                            savedResponses.forEach((r: any) => {
                                if (r.student_answer) {
                                    responsesMap[r.question_id] = r.student_answer;
                                    visitedMap[r.question_id] = true;
                                }
                                if (r.is_marked_for_review) {
                                    reviewMap[r.question_id] = true;
                                }
                            });

                            setResponses(responsesMap);
                            setMarkedForReview(reviewMap);
                            setVisited(visitedMap);
                        }
                    }
                } else {
                    // Check eligibility for new attempt
                    const result = await checkExamEligibility(user.id);
                    if (!result.eligible) {
                        setEligibilityMessage(result.message || "Not eligible");
                    } else {
                        setRemainingAttempts(result.remainingAttempts);
                    }
                }
            } catch (error) {
                console.error(error);
                setEligibilityMessage("Failed to load exam");
            } finally {
                setCheckingEligibility(false);
            }
        };
        if (exam) {
            check();
        }
    }, [exam, attemptId]);

    // Prevent back button during exam
    useEffect(() => {
        const backAction = () => {
            if (isExamStarted) {
                if (Platform.OS === 'web') {
                    if (window.confirm("Are you sure you want to exit? Your progress will be lost.")) {
                        navigation.goBack();
                        return true;
                    }
                    return true;
                }
                Alert.alert("Hold on!", "Are you sure you want to exit? Your progress will be lost.", [
                    { text: "Cancel", onPress: () => null, style: "cancel" },
                    { text: "YES", onPress: () => navigation.goBack() }
                ]);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, [isExamStarted]);

    // Timer Logic
    useEffect(() => {
        if (isExamStarted && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleSubmitExam(true); // Auto submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isExamStarted, timeLeft]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleStartExam = async () => {
        if (eligibilityMessage) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const attempt = await startAttempt(user.id);
            setCurrentAttempt(attempt);
            setTimeLeft(exam?.duration_minutes ? exam.duration_minutes * 60 : 0);
            setIsExamStarted(true);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to start exam");
        }
    };

    const handleAnswerChange = async (questionId: string, answer: any) => {
        setResponses(prev => ({ ...prev, [questionId]: answer }));
        setVisited(prev => ({ ...prev, [questionId]: true }));

        // Real-time save
        if (currentAttempt) {
            try {
                await saveResponse({
                    attemptId: currentAttempt.id,
                    questionId,
                    answer
                });
            } catch (error) {
                console.error("Failed to save response", error);
            }
        }
    };

    const handleSubmitExam = async (autoSubmit = false) => {
        if (!currentAttempt) {
            Alert.alert("Error", "No active exam session found. Please refresh.");
            return;
        }

        try {
            await submitAttempt({ attemptId: currentAttempt.id });

            if (exam?.show_results_immediately) {
                navigation.replace('ResultScreen', {
                    attemptId: currentAttempt.id,
                    examId: exam.id
                });
            } else {
                if (Platform.OS === 'web') {
                    window.alert("Exam submitted successfully!");
                    navigation.goBack();
                } else {
                    Alert.alert("Success", "Exam submitted successfully!", [
                        { text: "OK", onPress: () => navigation.goBack() }
                    ]);
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to submit exam. Please try again.");
        }
    };

    const confirmSubmit = () => {
        setSubmitModalVisible(true);
    };

    const jumpToSection = (sectionIndex: number) => {
        // Find first question of this section
        const firstQIndex = allQuestions.findIndex(q => q.sectionIndex === sectionIndex);
        if (firstQIndex !== -1) {
            setGlobalQuestionIndex(firstQIndex);
            setCurrentSectionIndex(sectionIndex);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        },
        backButton: {
            padding: spacing.sm,
        },
        headerTitle: {
            ...textStyles.h4,
            flex: 1,
            textAlign: 'center',
            marginRight: 40,
            color: colors.text,
        },
        content: {
            flex: 1,
            padding: spacing.lg,
        },
        examTitle: {
            ...textStyles.h2,
            marginBottom: spacing.md,
            color: colors.text,
        },
        infoRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: spacing.xl,
            gap: spacing.lg,
        },
        infoItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
        },
        infoText: {
            ...textStyles.body,
            color: colors.textSecondary,
        },
        sectionTitle: {
            ...textStyles.h4,
            marginBottom: spacing.sm,
            color: colors.text,
        },
        instructionText: {
            ...textStyles.body,
            color: colors.textSecondary,
            lineHeight: 24,
        },
        footer: {
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
        },
        primaryButton: {
            backgroundColor: colors.primary,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
        },
        disabledButton: {
            backgroundColor: colors.textDisabled,
        },
        primaryButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
        },
        errorBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.errorBg,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginBottom: spacing.lg,
            gap: spacing.sm,
        },
        errorBannerText: {
            ...textStyles.body,
            color: colors.error,
            flex: 1,
        },
        // Exam Interface Styles
        examHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        timerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            gap: spacing.xs,
        },
        timerText: {
            ...textStyles.body,
            color: colors.textInverse,
            fontWeight: 'bold',
        },
        timerTextWarning: {
            color: colors.error,
        },
        headerRightButtons: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        pauseButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.sm,
            gap: spacing.xs,
        },
        pauseText: {
            ...textStyles.button,
            color: colors.text,
        },
        paletteButton: {
            padding: spacing.sm,
        },
        sectionTabsContainer: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        sectionTabsContent: {
            paddingHorizontal: spacing.md,
        },
        sectionTab: {
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        sectionTabActive: {
            borderBottomColor: colors.primary,
        },
        sectionTabText: {
            ...textStyles.button,
            color: colors.textSecondary,
        },
        sectionTabTextActive: {
            color: colors.primary,
        },
        questionContainer: {
            flex: 1,
            padding: spacing.lg,
        },
        questionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
        },
        questionNumber: {
            ...textStyles.h4,
            color: colors.primary,
        },
        marksContainer: {
            flexDirection: 'row',
            gap: spacing.sm,
        },
        marksText: {
            ...textStyles.caption,
            color: colors.success,
            fontWeight: 'bold',
        },
        negativeMarksText: {
            ...textStyles.caption,
            color: colors.error,
        },
        questionText: {
            marginBottom: spacing.xl,
            color: colors.text,
        },
        optionsContainer: {
            gap: spacing.md,
            paddingBottom: spacing.xxl,
        },
        optionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
        },
        optionSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primaryLight + '20', // 20% opacity
        },
        radioCircle: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: colors.textSecondary,
            marginRight: spacing.md,
        },
        radioSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primary,
        },
        checkbox: {
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: colors.textSecondary,
            marginRight: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        checkboxSelected: {
            borderColor: colors.primary,
            backgroundColor: colors.primary,
        },
        optionText: {
            ...textStyles.body,
            flex: 1,
            color: colors.text,
        },
        optionTextSelected: {
            color: colors.primary,
            fontWeight: 'bold',
        },
        natInput: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            fontSize: 16,
            backgroundColor: colors.surface,
            color: colors.text,
        },
        examFooter: {
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        navRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        navButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.sm,
            gap: spacing.xs,
        },
        navButtonDisabled: {
            opacity: 0.5,
        },
        navText: {
            ...textStyles.button,
            color: colors.text,
        },
        navTextDisabled: {
            color: colors.textDisabled,
        },
        reviewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
        },
        reviewText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        submitButton: {
            backgroundColor: colors.success,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
        },
        submitButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
        },
        // Palette Modal
        modalOverlay: {
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'flex-end',
        },
        paletteContainer: {
            backgroundColor: colors.background,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            height: '70%',
        },
        paletteHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        paletteTitle: {
            ...textStyles.h4,
            color: colors.text,
        },
        paletteContent: {
            padding: spacing.lg,
        },
        paletteGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.md,
        },
        paletteItem: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
        },
        paletteItemActive: {
            borderColor: colors.primary,
            borderWidth: 2,
        },
        paletteItemNotVisited: {
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        paletteItemVisited: {
            borderColor: colors.warning,
            backgroundColor: colors.warningBg,
        },
        paletteItemAnswered: {
            borderColor: colors.success,
            backgroundColor: colors.success,
        },
        paletteItemMarked: {
            borderColor: colors.primary,
            backgroundColor: colors.primary,
        },
        paletteItemText: {
            ...textStyles.caption,
            color: colors.text,
        },
        paletteItemTextLight: {
            color: colors.textInverse,
        },
        legendContainer: {
            marginTop: spacing.xl,
            gap: spacing.sm,
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },
        legendBox: {
            width: 24,
            height: 24,
            borderRadius: 4,
        },
        legendText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
    });

    // Render Logic
    if (isLoading || checkingEligibility || !exam) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!isExamStarted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Exam Instructions</Text>
                </View>

                <ScrollView style={styles.content}>
                    <Text style={styles.examTitle}>{exam.title}</Text>

                    {eligibilityMessage ? (
                        <View style={styles.errorBanner}>
                            <Ionicons name="alert-circle" size={24} color={colors.error} />
                            <Text style={styles.errorBannerText}>{eligibilityMessage}</Text>
                        </View>
                    ) : (
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                                <Text style={styles.infoText}>{exam.duration_minutes} mins</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                                <Text style={styles.infoText}>{exam.total_marks} Marks</Text>
                            </View>
                            {remainingAttempts !== Infinity && (
                                <View style={styles.infoItem}>
                                    <Ionicons name="repeat-outline" size={20} color={colors.textSecondary} />
                                    <Text style={styles.infoText}>{remainingAttempts} Attempts Left</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Instructions:</Text>
                    <Text style={styles.instructionText}>
                        1. Read all questions carefully.{'\n'}
                        2. You can navigate between questions using Next/Previous buttons.{'\n'}
                        3. You can mark questions for review.{'\n'}
                        4. The exam will auto-submit when the timer ends.{'\n'}
                        {exam.negative_marking > 0 && `5. There is negative marking of ${exam.negative_marking} for wrong answers.\n`}
                    </Text>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.primaryButton, !!eligibilityMessage && styles.disabledButton]}
                        onPress={handleStartExam}
                        disabled={!!eligibilityMessage}
                    >
                        <Text style={styles.primaryButtonText}>Start Exam</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handlePauseExam = () => {
        setPauseModalVisible(true);
    };

    const currentQuestion = allQuestions[globalQuestionIndex];

    if (!currentQuestion) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.examHeader}>
                <View style={styles.timerContainer}>
                    <Ionicons name="time" size={16} color={timeLeft < 300 ? colors.error : colors.textInverse} />
                    <Text style={[styles.timerText, timeLeft < 300 && styles.timerTextWarning]}>
                        {formatTime(timeLeft)}
                    </Text>
                </View>

                <View style={styles.headerRightButtons}>
                    <TouchableOpacity onPress={handlePauseExam} style={styles.pauseButton}>
                        <Ionicons name="pause-circle-outline" size={24} color={colors.text} />
                        <Text style={styles.pauseText}>Pause</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsPaletteOpen(true)} style={styles.paletteButton}>
                        <Ionicons name="grid-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Section Tabs */}
            <View style={styles.sectionTabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabsContent}>
                    {sections?.map((section, index) => (
                        <TouchableOpacity
                            key={section.id}
                            style={[styles.sectionTab, currentSectionIndex === index && styles.sectionTabActive]}
                            onPress={() => jumpToSection(index)}
                        >
                            <Text style={[styles.sectionTabText, currentSectionIndex === index && styles.sectionTabTextActive]}>
                                {section.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Question Area */}
            <ScrollView style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>
                        Q{globalQuestionIndex + 1}.
                    </Text>
                    <View style={styles.marksContainer}>
                        <Text style={styles.marksText}>+{currentQuestion.marks}</Text>
                        {currentQuestion.negative_marks > 0 && (
                            <Text style={styles.negativeMarksText}>-{currentQuestion.negative_marks}</Text>
                        )}
                    </View>
                </View>

                <MathText content={currentQuestion.question_text} style={styles.questionText} />

                {/* Question Types */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.question_type === 'MCQ' && currentQuestion.options?.map((option: any) => {
                        const isSelected = responses[currentQuestion.id] === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.optionButton, isSelected && styles.optionSelected]}
                                onPress={() => handleAnswerChange(currentQuestion.id, option.id)}
                            >
                                <View style={[styles.radioCircle, isSelected && styles.radioSelected]} />
                                <View style={{ flex: 1 }}>
                                    <MathText
                                        content={option.option_text}
                                        textColor={isSelected ? colors.primary : colors.text}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {currentQuestion.question_type === 'MSQ' && currentQuestion.options?.map((option: any) => {
                        const currentAnswers = (responses[currentQuestion.id] || []) as string[];
                        const isSelected = currentAnswers.includes(option.id);
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.optionButton, isSelected && styles.optionSelected]}
                                onPress={() => {
                                    const newAnswers = isSelected
                                        ? currentAnswers.filter(id => id !== option.id)
                                        : [...currentAnswers, option.id];
                                    handleAnswerChange(currentQuestion.id, newAnswers);
                                }}
                            >
                                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                    {isSelected && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <MathText
                                        content={option.option_text}
                                        textColor={isSelected ? colors.primary : colors.text}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {currentQuestion.question_type === 'NAT' && (
                        <TextInput
                            style={styles.natInput}
                            placeholder="Enter your numerical answer"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={responses[currentQuestion.id] || ''}
                            onChangeText={(text) => handleAnswerChange(currentQuestion.id, text)}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Footer Navigation */}
            <View style={styles.examFooter}>
                <View style={styles.navRow}>
                    <TouchableOpacity
                        style={[styles.navButton, globalQuestionIndex === 0 && styles.navButtonDisabled]}
                        disabled={globalQuestionIndex === 0}
                        onPress={() => setGlobalQuestionIndex(prev => prev - 1)}
                    >
                        <Ionicons name="chevron-back" size={24} color={globalQuestionIndex === 0 ? colors.textDisabled : colors.text} />
                        <Text style={[styles.navText, globalQuestionIndex === 0 && styles.navTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => setMarkedForReview(prev => ({
                            ...prev,
                            [currentQuestion.id]: !prev[currentQuestion.id]
                        }))}
                    >
                        <Ionicons
                            name={markedForReview[currentQuestion.id] ? "flag" : "flag-outline"}
                            size={20}
                            color={markedForReview[currentQuestion.id] ? colors.warning : colors.textSecondary}
                        />
                        <Text style={styles.reviewText}>Review</Text>
                    </TouchableOpacity>

                    {globalQuestionIndex < allQuestions.length - 1 ? (
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => setGlobalQuestionIndex(prev => prev + 1)}
                        >
                            <Text style={styles.navText}>Next</Text>
                            <Ionicons name="chevron-forward" size={24} color={colors.text} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={confirmSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Question Palette Modal */}
            <Modal
                visible={isPaletteOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsPaletteOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.paletteContainer}>
                        <View style={styles.paletteHeader}>
                            <Text style={styles.paletteTitle}>Question Palette</Text>
                            <TouchableOpacity onPress={() => setIsPaletteOpen(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.paletteContent}>
                            <View style={styles.paletteGrid}>
                                {allQuestions.map((q, index) => {
                                    const isAnswered = responses[q.id] !== undefined && responses[q.id] !== '' && (Array.isArray(responses[q.id]) ? responses[q.id].length > 0 : true);
                                    const isMarked = markedForReview[q.id];
                                    const isVisited = visited[q.id];

                                    let statusStyle = styles.paletteItemNotVisited;
                                    if (isMarked) statusStyle = styles.paletteItemMarked;
                                    else if (isAnswered) statusStyle = styles.paletteItemAnswered;
                                    else if (isVisited) statusStyle = styles.paletteItemVisited;

                                    return (
                                        <TouchableOpacity
                                            key={q.id}
                                            style={[styles.paletteItem, statusStyle, globalQuestionIndex === index && styles.paletteItemActive]}
                                            onPress={() => {
                                                setGlobalQuestionIndex(index);
                                                setIsPaletteOpen(false);
                                            }}
                                        >
                                            <Text style={[styles.paletteItemText, (isAnswered || isMarked) && styles.paletteItemTextLight]}>
                                                {index + 1}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Legend */}
                            <View style={styles.legendContainer}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.paletteItem, styles.paletteItemAnswered, styles.legendBox]} />
                                    <Text style={styles.legendText}>Answered</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.paletteItem, styles.paletteItemMarked, styles.legendBox]} />
                                    <Text style={styles.legendText}>Marked</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.paletteItem, styles.paletteItemVisited, styles.legendBox]} />
                                    <Text style={styles.legendText}>Visited</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.paletteItem, styles.paletteItemNotVisited, styles.legendBox]} />
                                    <Text style={styles.legendText}>Not Visited</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <ConfirmationModal
                visible={pauseModalVisible}
                title="Pause Exam"
                message={"Are you sure you want to stop for now? You can resume later from where you left off.\n\nNote: The timer will continue running."}
                onConfirm={() => {
                    setPauseModalVisible(false);
                    navigation.goBack();
                }}
                onCancel={() => setPauseModalVisible(false)}
                confirmText="Pause & Exit"
                type="warning"
                icon="pause-circle"
            />

            <ConfirmationModal
                visible={submitModalVisible}
                title="Submit Exam"
                message={`You have answered ${Object.keys(responses).length} out of ${allQuestions.length} questions.\nAre you sure you want to submit?`}
                onConfirm={() => {
                    setSubmitModalVisible(false);
                    handleSubmitExam(false);
                }}
                onCancel={() => setSubmitModalVisible(false)}
                confirmText="Submit"
                type="success"
                icon="checkmark-circle"
            />
        </SafeAreaView>
    );
};
