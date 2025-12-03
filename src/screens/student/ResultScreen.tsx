import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { useExam } from '../../hooks/useExam';

export const ResultScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors } = useAppTheme();
    const { attemptId, examId } = route.params;
    const { fetchExamResult, exam } = useExam(examId);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResult = async () => {
            try {
                // Poll for result as it might take a moment to generate
                let retries = 5;
                while (retries > 0) {
                    const data = await fetchExamResult(attemptId);
                    if (data) {
                        setResult(data);
                        setLoading(false);
                        return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retries--;
                }
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        loadResult();
    }, [attemptId]);

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
        loadingText: {
            ...textStyles.body,
            marginTop: spacing.md,
            color: colors.textSecondary,
        },
        scrollContent: {
            padding: spacing.lg,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.xl,
        },
        backButton: {
            padding: spacing.sm,
            marginLeft: -spacing.sm, // Align with left edge
        },
        headerTitle: {
            ...textStyles.h3,
            color: colors.text,
            textAlign: 'center',
            flex: 1,
            marginRight: 32, // Balance the back button width roughly
        },
        scoreCard: {
            alignItems: 'center',
            padding: spacing.xl,
            borderRadius: borderRadius.xl,
            marginBottom: spacing.xl,
            borderWidth: 1,
            backgroundColor: colors.surface,
        },
        passedCard: {
            backgroundColor: colors.successBg,
            borderColor: colors.success,
        },
        failedCard: {
            backgroundColor: colors.errorBg,
            borderColor: colors.error,
        },
        scoreText: {
            ...textStyles.h2,
            marginTop: spacing.md,
            color: colors.text,
        },
        percentageText: {
            ...textStyles.h4,
            color: colors.textSecondary,
        },
        statusText: {
            ...textStyles.h4,
            marginTop: spacing.sm,
            fontWeight: 'bold',
            color: colors.text,
        },
        statsGrid: {
            flexDirection: 'row',
            gap: spacing.md,
            marginBottom: spacing.xl,
        },
        statItem: {
            flex: 1,
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            elevation: 2,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        statLabel: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        statValue: {
            ...textStyles.h4,
            color: colors.primary,
            marginTop: spacing.xs,
        },
        sectionHeader: {
            ...textStyles.h4,
            marginBottom: spacing.md,
            color: colors.text,
        },
        sectionCard: {
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.md,
            elevation: 1,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        sectionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
        },
        sectionTitle: {
            ...textStyles.body,
            fontWeight: 'bold',
            color: colors.text,
        },
        sectionScore: {
            ...textStyles.body,
            fontWeight: 'bold',
            color: colors.primary,
        },
        sectionStats: {
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.xs,
        },
        statBadge: {
            ...textStyles.caption,
            fontWeight: '600',
        },
        analysisButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.secondary,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.md,
            gap: spacing.sm,
        },
        analysisButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
        },
        mainButton: {
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            marginBottom: spacing.xl,
        },
        mainButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
        },
        errorText: {
            ...textStyles.h3,
            color: colors.text,
            marginTop: spacing.md,
        },
        errorSubText: {
            ...textStyles.body,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.sm,
            marginBottom: spacing.xl,
        },
        homeButton: {
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
        },
        homeButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
        },
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Generating Results...</Text>
            </View>
        );
    }

    if (!result) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.warning} />
                    <Text style={styles.errorText}>Result Pending</Text>
                    <Text style={styles.errorSubText}>Your result is being processed. Please check back later.</Text>
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.navigate('Main')}
                    >
                        <Text style={styles.homeButtonText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const isPassed = result.percentage >= 40; // Assuming 40% pass mark

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Exam Result</Text>
                    <View style={{ width: 24 }} /> {/* Spacer for centering */}
                </View>

                {/* Score Card */}
                <View style={[styles.scoreCard, isPassed ? styles.passedCard : styles.failedCard]}>
                    <Ionicons
                        name={isPassed ? "checkmark-circle" : "close-circle"}
                        size={48}
                        color={isPassed ? colors.success : colors.error}
                    />
                    <Text style={styles.scoreText}>{result.obtained_marks} / {result.total_marks}</Text>
                    <Text style={styles.percentageText}>{result.percentage.toFixed(1)}%</Text>
                    <Text style={styles.statusText}>{isPassed ? "PASSED" : "FAILED"}</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Rank</Text>
                        <Text style={styles.statValue}>{result.rank || '-'}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Accuracy</Text>
                        <Text style={styles.statValue}>
                            {((result.obtained_marks / result.total_marks) * 100).toFixed(1)}%
                        </Text>
                    </View>
                </View>

                {/* Section Analysis */}
                <Text style={styles.sectionHeader}>Section Analysis</Text>
                {result.section_results?.map((section: any, index: number) => (
                    <View key={index} style={styles.sectionCard}>
                        <View style={styles.sectionRow}>
                            <Text style={styles.sectionTitle}>Section {index + 1}</Text>
                            <Text style={styles.sectionScore}>{section.obtained_marks} / {section.total_marks}</Text>
                        </View>
                        <View style={styles.sectionStats}>
                            <Text style={[styles.statBadge, { color: colors.success }]}>
                                {section.correct_answers} Correct
                            </Text>
                            <Text style={[styles.statBadge, { color: colors.error }]}>
                                {section.wrong_answers} Wrong
                            </Text>
                            <Text style={[styles.statBadge, { color: colors.textSecondary }]}>
                                {section.unanswered} Skipped
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Question Analysis Button */}
                {exam?.show_answers && (
                    <TouchableOpacity
                        style={styles.analysisButton}
                        onPress={() => navigation.navigate('QuestionAnalysisScreen', { attemptId, examId })}
                    >
                        <Ionicons name="list-outline" size={20} color={colors.textInverse} />
                        <Text style={styles.analysisButtonText}>View Question Analysis</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => navigation.navigate('Main')}
                >
                    <Text style={styles.mainButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
