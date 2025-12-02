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
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { useExam } from '../../hooks/useExam';

export const ResultScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
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
                    <Text style={styles.headerTitle}>Exam Result</Text>
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
                        <Ionicons name="list-outline" size={20} color="#fff" />
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
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    headerTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    scoreCard: {
        alignItems: 'center',
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
    },
    passedCard: {
        backgroundColor: '#E8F5E9',
        borderColor: colors.success,
    },
    failedCard: {
        backgroundColor: '#FFEBEE',
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
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        ...textStyles.body,
        fontWeight: 'bold',
    },
    sectionScore: {
        ...textStyles.body,
        fontWeight: 'bold',
        color: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
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
