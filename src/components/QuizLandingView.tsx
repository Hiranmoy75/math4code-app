import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../hooks/useAppTheme';
import { textStyles } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { useExam } from '../hooks/useExam';
import { supabase } from '../services/supabase';

interface QuizLandingViewProps {
    examId: string;
    title: string;
    description?: string;
    duration?: number;
}

export const QuizLandingView = ({ examId, title, description, duration }: QuizLandingViewProps) => {
    const navigation = useNavigation<any>();
    const { colors, shadows } = useAppTheme();
    const { exam, sections, fetchAttempts, checkExamEligibility } = useExam(examId);

    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [eligibility, setEligibility] = useState<{ eligible: boolean; message?: string; remainingAttempts?: number } | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const [attemptsData, eligibilityData] = await Promise.all([
                fetchAttempts(user.id),
                checkExamEligibility(user.id)
            ]);

            setAttempts(attemptsData || []);
            setEligibility(eligibilityData);
        } catch (error) {
            console.error("Failed to load quiz data", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [examId]);

    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [examId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleStartExam = () => {
        navigation.navigate('ExamScreen', { examId });
    };

    const handleViewResult = (attempt: any) => {
        navigation.navigate('ResultScreen', {
            attemptId: attempt.id,
            examId: examId
        });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        contentContainer: {
            padding: spacing.lg,
            paddingBottom: 100,
        },
        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            backgroundColor: colors.background,
        },
        headerCard: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            marginBottom: spacing.xl,
            ...shadows.medium,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
        },
        headerGradient: {
            padding: spacing.xl,
            alignItems: 'center',
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
        },
        description: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.lg,
            lineHeight: 20,
            paddingHorizontal: spacing.md,
        },
        statsRow: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
            marginTop: spacing.md,
            gap: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: spacing.lg,
        },
        statItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        statText: {
            fontSize: 14,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        attemptsSection: {
            marginBottom: spacing.xl,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.md,
        },
        attemptCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.small,
        },
        attemptLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        attemptBadge: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        attemptNumber: {
            fontSize: 14,
            fontWeight: 'bold',
            color: colors.text,
        },
        attemptTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 2,
        },
        attemptDate: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        scoreText: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
        },
        statusText: {
            fontSize: 12,
            color: colors.warning,
            marginTop: 2,
            fontWeight: '500',
        },
        viewResultButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        viewResultText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.text,
        },
        resumeButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primary,
        },
        resumeText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textInverse,
        },
        footer: {
            marginTop: spacing.md,
        },
        startButton: {
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
            ...shadows.medium,
        },
        startButtonGradient: {
            paddingVertical: spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
        },
        startButtonText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.textInverse,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        disabledButton: {
            backgroundColor: colors.surfaceAlt,
            paddingVertical: spacing.lg,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
        },
        disabledButtonText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.textDisabled,
        },
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const questionsCount = sections?.reduce((acc, section) => acc + (section.questions?.length || 0), 0) || 0;
    const maxAttempts = exam?.max_attempts;
    const attemptsLeft = eligibility?.remainingAttempts;
    const isUnlimited = !maxAttempts;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            {/* Header Card */}
            <View style={styles.headerCard}>
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="school" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.textInverse }]}>{title}</Text>
                    {(description || exam?.description) && (
                        <Text style={[styles.description, { color: colors.textInverse }]}>{description || exam?.description}</Text>
                    )}

                    <View style={[styles.statsRow, { borderTopColor: 'rgba(255,255,255,0.2)' }]}>
                        <View style={styles.statItem}>
                            <Ionicons name="help-circle-outline" size={20} color={colors.textInverse} />
                            <Text style={[styles.statText, { color: colors.textInverse }]}>{questionsCount} questions</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={20} color={colors.textInverse} />
                            <Text style={[styles.statText, { color: colors.textInverse }]}>{duration || exam?.duration_minutes || 60} minutes</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="repeat-outline" size={20} color={colors.textInverse} />
                            <Text style={[styles.statText, { color: colors.textInverse }]}>
                                {isUnlimited ? 'Unlimited Attempts' : `${attemptsLeft} Attempts Left`}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Attempts History */}
            {attempts.length > 0 && (
                <View style={styles.attemptsSection}>
                    <Text style={styles.sectionTitle}>Your Attempts</Text>
                    {attempts.map((attempt, index) => {
                        const attemptNumber = attempts.length - index;
                        const score = attempt.results?.[0]?.obtained_marks;
                        const total = attempt.results?.[0]?.total_marks;
                        const date = new Date(attempt.created_at).toLocaleDateString();
                        const isSubmitted = attempt.status === 'submitted';
                        const hasResults = attempt.results && attempt.results.length > 0;

                        // Check result visibility
                        let canViewResult = false;
                        let statusMessage = "";

                        if (isSubmitted && hasResults) {
                            // Results exist, now check visibility settings
                            const visibility = exam?.result_visibility || 'immediate';

                            if (visibility === 'immediate') {
                                canViewResult = true;
                            } else if (visibility === 'manual') {
                                statusMessage = "Result Pending Release";
                            } else if (visibility === 'scheduled') {
                                const releaseTime = exam?.result_release_time ? new Date(exam.result_release_time) : null;
                                if (releaseTime && new Date() >= releaseTime) {
                                    canViewResult = true;
                                } else {
                                    statusMessage = releaseTime ? `Available: ${releaseTime.toLocaleDateString()}` : "Result Pending";
                                }
                            }
                        } else if (isSubmitted && !hasResults) {
                            // Submitted but results not generated yet
                            statusMessage = "Processing Results...";
                        }

                        return (
                            <View key={attempt.id} style={styles.attemptCard}>
                                <View style={styles.attemptLeft}>
                                    <View style={styles.attemptBadge}>
                                        <Text style={styles.attemptNumber}>{attemptNumber}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.attemptTitle}>Attempt {attemptNumber}</Text>
                                        <Text style={styles.attemptDate}>{date}</Text>
                                        {isSubmitted ? (
                                            canViewResult && score !== undefined ? (
                                                <Text style={styles.scoreText}>Score: {score} / {total}</Text>
                                            ) : (
                                                <Text style={styles.statusText}>{statusMessage || "Submitted"}</Text>
                                            )
                                        ) : (
                                            <Text style={styles.statusText}>
                                                {attempt.status === 'in_progress' ? 'In Progress' : 'Not Submitted'}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {canViewResult && (
                                    <TouchableOpacity
                                        style={styles.viewResultButton}
                                        onPress={() => handleViewResult(attempt)}
                                    >
                                        <Text style={styles.viewResultText}>View Result</Text>
                                    </TouchableOpacity>
                                )}
                                {attempt.status === 'in_progress' && (
                                    <TouchableOpacity
                                        style={styles.resumeButton}
                                        onPress={() => navigation.navigate('ExamScreen', {
                                            examId,
                                            attemptId: attempt.id
                                        })}
                                    >
                                        <Text style={styles.resumeText}>Resume</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Start Button */}
            <View style={styles.footer}>
                {eligibility?.eligible ? (
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleStartExam}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={colors.gradients.primary as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.startButtonGradient}
                        >
                            <Text style={styles.startButtonText}>
                                {attempts.length > 0 ? 'Retake Exam' : 'Start Exam'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.disabledButton}>
                        <Text style={styles.disabledButtonText}>
                            {eligibility?.message || 'Not Available'}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};
