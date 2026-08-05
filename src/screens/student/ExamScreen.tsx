import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, BackHandler, AppState, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useExam } from '../../hooks/useExam';
import { QuestionDisplay } from '../../components/exam/QuestionDisplay';
import { ExamTimer } from '../../components/exam/ExamTimer';
import { QuestionPalette } from '../../components/exam/QuestionPalette';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ExamScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors } = useAppTheme();
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const params = route.params || {};
    const { examId } = params;

    // Safety check for deep linking or navigation errors
    if (!examId) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.error }}>Invalid Exam URL: Missing ID</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 20 }}>
                    <Text style={{ color: colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { fetchSession, startAttempt, updateTimer, saveResponse, submitAttempt } = useExam(examId);
    const { data: session, isLoading, refetch, error } = fetchSession(user?.id || '');



    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'red' }}>Error: {(error as any).message}</Text>
            </View>
        );
    }

    if (isUserLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.text }}>Authenticating...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
                <Ionicons name="lock-closed-outline" size={64} color={colors.textSecondary} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 20 }}>Login Required</Text>
                <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 10, marginBottom: 20 }}>
                    Please log in to access this exam.
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 }}
                >
                    <Text style={{ color: colors.textInverse, fontWeight: 'bold' }}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // State
    const [activeAttempt, setActiveAttempt] = useState<any>(null);
    const [responses, setResponses] = useState<any>({});
    const [marked, setMarked] = useState<any>({});
    const [visited, setVisited] = useState<any>({});
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    const [paletteVisible, setPaletteVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showPauseDialog, setShowPauseDialog] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const syncRef = useRef<number>(0);

    // Flat list of questions for easier navigation
    const allQuestions = useMemo(() => {
        if (!session?.sections) return [];
        return session.sections.flatMap((section: any, sIndex: any) =>
            section.questions?.map((q: any, qIndex: any) => ({
                ...q,
                sectionId: section.id,
                sectionIndex: sIndex,
                localIndex: qIndex
            })) || []
        );
    }, [session]);

    // Initialize Session
    useEffect(() => {
        if (session && !activeAttempt && !isLoading) {
            initExam();
        }
    }, [session, isLoading]);

    const initExam = async () => {
        try {
            // Already have an attempt from hook?
            if (session?.activeAttempt) {
                const attempt = session.activeAttempt;
                setActiveAttempt(attempt);
                setResponses(session.previousResponses || {});

                // Calculate time left with two modes
                const totalDuration = (session.exam.duration_minutes || 60) * 60;
                let remaining = 0;

                if (session.exam.allow_pause === false) {
                    // MODE 1: Deadline-based (pause not allowed)
                    if (attempt.exam_deadline) {
                        const deadline = new Date(attempt.exam_deadline).getTime();
                        remaining = Math.max(0, (deadline - Date.now()) / 1000);
                    } else {
                        remaining = Math.max(0, totalDuration - (attempt.total_time_spent || 0));
                    }
                } else {
                    // MODE 2: Elapsed-based (pause allowed)
                    const elapsed = attempt.elapsed_time_seconds || 0;

                    if (attempt.is_paused) {
                        // Auto-resume from pause
                        remaining = Math.max(0, totalDuration - elapsed);
                        await updateTimer({
                            attemptId: attempt.id,
                            elapsedSeconds: elapsed,
                            isPaused: false
                        });
                    } else {
                        // Active: elapsed + (now - last_activity)
                        const lastActivity = attempt.last_activity_at
                            ? new Date(attempt.last_activity_at).getTime()
                            : Date.now();
                        const currentSession = (Date.now() - lastActivity) / 1000;
                        remaining = Math.max(0, totalDuration - (elapsed + currentSession));
                    }
                }

                setTimeLeft(remaining);

                if (remaining > 0) {
                    startTimer();
                } else {
                    handleSubmit(true);
                }
            } else {
                // New Attempt
                const newAttempt = await startAttempt(user?.id || '');
                setActiveAttempt(newAttempt);
                setTimeLeft((session?.exam.duration_minutes || 60) * 60);
                startTimer();
            }
        } catch (error: any) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Failed to start exam', text2: error.message });
            navigation.goBack();
        }
    };

    // Timer Implementation
    const startTimer = () => {

        setIsPaused(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                const newValue = prev - 1;

                // Sync to DB every 30 seconds
                syncRef.current += 1;
                if (syncRef.current >= 30) {
                    syncRef.current = 0;
                    if (activeAttempt?.id) {
                        // Calculate true elapsed
                        const totalDuration = (session?.exam.duration_minutes || 60) * 60;
                        const trueElapsed = totalDuration - newValue;
                        updateTimer({ attemptId: activeAttempt.id, elapsedSeconds: trueElapsed })
                            .catch(err => console.log('Ping failed', err));
                    }
                }

                if (newValue <= 0) {

                    clearInterval(timerRef.current!);
                    handleSubmit(true); // Auto submit
                    return 0;
                }
                return newValue;
            });
        }, 1000);
        // console.log('[TIMER] Interval created:', timerRef.current);
    };


    const handlePause = () => {
        if (!session?.exam.allow_pause) {
            Toast.show({ type: 'info', text1: 'Pause not allowed for this exam' });
            return;
        }
        setShowPauseDialog(true);
    };

    const confirmPause = async () => {

        try {
            if (timerRef.current) clearInterval(timerRef.current);

            const totalDuration = (session?.exam.duration_minutes || 60) * 60;
            const elapsed = totalDuration - timeLeft;
            await updateTimer({
                attemptId: activeAttempt.id,
                elapsedSeconds: elapsed,
                isPaused: true
            });

            setShowPauseDialog(false);

            navigation.goBack();
        } catch (error) {
            console.error('[PAUSE] Error pausing exam:', error);
            Toast.show({ type: 'error', text1: 'Failed to pause exam' });
            setShowPauseDialog(false);
        }
    };

    const handleResume = async () => {

        try {
            // Update database to mark as not paused
            if (activeAttempt?.id) {
                const totalDuration = (session?.exam.duration_minutes || 60) * 60;
                const elapsed = totalDuration - timeLeft;
                await updateTimer({
                    attemptId: activeAttempt.id,
                    elapsedSeconds: elapsed,
                    isPaused: false
                });
            }

            // Update local state and restart timer
            setIsPaused(false);
            startTimer();

        } catch (error) {
            console.error('[RESUME] Error resuming exam:', error);
            Toast.show({ type: 'error', text1: 'Failed to resume exam' });
        }
    };

    // Navigation & Logic
    const handleNext = () => {
        if (activeQuestionIdx < allQuestions.length - 1) {
            setActiveQuestionIdx(prev => prev + 1);
            setVisited((prev: any) => ({ ...prev, [allQuestions[activeQuestionIdx + 1].id]: true }));
        }
    };

    const handlePrev = () => {
        if (activeQuestionIdx > 0) {
            setActiveQuestionIdx(prev => prev - 1);
        }
    };

    const handleSave = (qid: string, ans: any) => {
        setResponses((prev: any) => ({ ...prev, [qid]: ans }));
        // Debounce network save could go here, for now simple async fire-and-forget
        if (activeAttempt) {
            saveResponse({ attemptId: activeAttempt.id, questionId: qid, answer: ans });
        }
    };

    const handleMark = (qid: string) => {
        const newVal = !marked[qid];
        setMarked((prev: any) => ({ ...prev, [qid]: newVal }));
    };

    // Submit Dialog State
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);

    const handleSubmit = async (auto = false) => {


        if (auto) {
            performSubmit();
            return;
        }

        setShowSubmitDialog(true);
    };

    const performSubmit = async () => {

        setIsSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            if (!activeAttempt?.id) throw new Error("No active attempt ID");

            await submitAttempt({ attemptId: activeAttempt.id });

            Toast.show({ type: 'success', text1: 'Exam Submitted Successfully' });
            navigation.replace('ResultScreen', { attemptId: activeAttempt.id, examId: session?.exam.id });
        } catch (error: any) {
            console.error('Submission error:', error);
            Toast.show({ type: 'error', text1: 'Submission Failed', text2: error.message });
            setIsSubmitting(false);
            // If manual submit failed, resume timer? Or keep paused? 
            // Ideally keep user in exam screen to retry.
        }
    };

    // Back Button Handling
    useEffect(() => {
        const backAction = () => {
            if (isSubmitting) return true;
            Alert.alert('Hold on!', 'Do you want to exit the exam? Timer will continue running.', [
                {
                    text: 'Cancel',
                    onPress: () => null,
                    style: 'cancel',
                },
                { text: 'YES', onPress: () => navigation.goBack() },
            ]);
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isSubmitting]);

    // App Background Handling
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState.match(/inactive|background/) && activeAttempt && !isPaused) {
                // If app mostly backgrounded, we might wanna pause if allowed?
                // Or just let it run. Usually exams run in background.
                // If pause allowed, maybe auto-pause? 
                // Let's stick to manual pause for now to be safe.
            }
        });

        return () => {
            subscription.remove();
            // DON'T clear interval here - it breaks the timer!
            // Interval is managed by startTimer/handlePause/performSubmit
        };
    }, [activeAttempt, isPaused]);


    if (isLoading || !session) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.text }}>Loading Exam...</Text>
            </View>
        );
    }

    if (isPaused) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, gap: 20 }}>
                <Ionicons name="pause-circle" size={80} color={colors.primary} />
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Exam Paused</Text>
                <Text style={{ color: colors.textSecondary }}>Timer stopped at {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</Text>

                <TouchableOpacity
                    onPress={handleResume}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 10 }}
                >
                    <Text style={{ color: '#white', fontWeight: 'bold', fontSize: 18 }}>Resume Exam</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQ = allQuestions[activeQuestionIdx];

    if (!currentQ) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={{ marginTop: 10, color: colors.text }}>No questions available for this exam.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => setPaletteVisible(true)} style={styles.paletteButton}>
                    <Ionicons name="grid-outline" size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{session.exam.title}</Text>
                </View>

                {session.exam.allow_pause && (
                    <TouchableOpacity onPress={handlePause} style={{ marginRight: 10 }}>
                        <Ionicons name="pause-circle-outline" size={26} color={colors.text} />
                    </TouchableOpacity>
                )}

                <ExamTimer timeLeft={timeLeft} />
            </View>

            {/* Content */}
            <QuestionDisplay
                question={currentQ}
                activeQuestionIdx={activeQuestionIdx}
                totalQuestions={allQuestions.length}
                response={responses[currentQ?.id]}
                isMarked={!!marked[currentQ?.id]}
                onSave={handleSave}
                onMark={handleMark}
                onNext={handleNext}
                onPrev={handlePrev}
                onClear={() => handleSave(currentQ.id, '')}
                onSubmit={() => handleSubmit(false)}
                isFirst={activeQuestionIdx === 0}
                isLast={activeQuestionIdx === allQuestions.length - 1}
            />

            {/* Palette Modal */}
            <QuestionPalette
                visible={paletteVisible}
                onClose={() => setPaletteVisible(false)}
                questions={allQuestions}
                sections={session.sections}
                responses={responses}
                markedForReview={marked}
                visited={visited}
                activeQuestionIdx={activeQuestionIdx}
                onSelectQuestion={idx => {
                    setActiveQuestionIdx(idx);
                    setVisited((prev: any) => ({ ...prev, [allQuestions[idx].id]: true }));
                }}
                onSubmit={() => handleSubmit(false)}
            />

            {/* Overlay Loader for submission */}
            {isSubmitting && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={{ color: '#FFF', marginTop: 10, fontWeight: 'bold' }}>Submitting...</Text>
                </View>
            )}
            {/* Submit Confirmation Dialog */}
            <ConfirmDialog
                visible={showSubmitDialog}
                title="Submit Exam?"
                message={`You have answered ${Object.keys(responses).length} out of ${allQuestions.length} questions.\n\nAre you sure you want to finish the exam?`}
                confirmText="Submit Exam"
                cancelText="Keep Working"
                confirmColor={colors.error}
                icon="alert-circle"
                onConfirm={() => {
                    setShowSubmitDialog(false);
                    performSubmit();
                }}
                onCancel={() => setShowSubmitDialog(false)}
            />

            {/* Pause Confirmation Dialog */}
            <ConfirmDialog
                visible={showPauseDialog}
                title="Pause Exam?"
                message="Are you sure you want to pause the exam? You can resume later from where you left off."
                confirmText="Yes, Pause"
                cancelText="Continue Exam"
                confirmColor={colors.warning}
                icon="pause-circle"
                onConfirm={confirmPause}
                onCancel={() => setShowPauseDialog(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        elevation: 2,
    },
    paletteButton: {
        marginRight: 10,
    }
});
