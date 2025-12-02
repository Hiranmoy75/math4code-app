import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const ExamsScreen = () => {
    const testSeries = [
        {
            id: '1',
            title: 'JEE Main Mock Tests',
            totalExams: 10,
            completedExams: 6,
            nextExam: 'Physics Mock Test 7',
            enrolled: true,
        },
        {
            id: '2',
            title: 'NEET Practice Series',
            totalExams: 15,
            completedExams: 0,
            nextExam: null,
            enrolled: false,
        },
    ];

    const upcomingExams = [
        { id: '1', title: 'Mathematics Mock Test 5', date: 'Tomorrow, 10:00 AM', duration: 180 },
        { id: '2', title: 'Physics Chapter Test', date: 'Dec 2, 2:00 PM', duration: 60 },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Test Series & Exams</Text>
                </View>

                {/* Test Series */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Test Series</Text>
                    {testSeries.filter(ts => ts.enrolled).map((series) => (
                        <TouchableOpacity key={series.id} style={styles.seriesCard} activeOpacity={0.8}>
                            <LinearGradient
                                colors={colors.gradients.secondary as any}
                                style={styles.seriesGradient}
                            >
                                <View style={styles.seriesHeader}>
                                    <Text style={styles.seriesTitle}>{series.title}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textInverse} />
                                </View>
                                <View style={styles.seriesStats}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{series.completedExams}/{series.totalExams}</Text>
                                        <Text style={styles.statLabel}>Completed</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{Math.round((series.completedExams / series.totalExams) * 100)}%</Text>
                                        <Text style={styles.statLabel}>Progress</Text>
                                    </View>
                                </View>
                                {series.nextExam && (
                                    <View style={styles.nextExam}>
                                        <Ionicons name="play-circle" size={16} color={colors.textInverse} />
                                        <Text style={styles.nextExamText}>{series.nextExam}</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Upcoming Exams */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Exams</Text>
                    {upcomingExams.map((exam) => (
                        <TouchableOpacity key={exam.id} style={styles.examCard} activeOpacity={0.8}>
                            <View style={styles.examIcon}>
                                <Ionicons name="document-text" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.examInfo}>
                                <Text style={styles.examTitle}>{exam.title}</Text>
                                <View style={styles.examMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                                        <Text style={styles.metaText}>{exam.date}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                        <Text style={styles.metaText}>{exam.duration} min</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.startButton}>
                                <Text style={styles.startButtonText}>Start</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Available Test Series */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Available Test Series</Text>
                    {testSeries.filter(ts => !ts.enrolled).map((series) => (
                        <TouchableOpacity key={series.id} style={styles.availableCard} activeOpacity={0.8}>
                            <View style={styles.availableIcon}>
                                <Ionicons name="list" size={24} color={colors.secondary} />
                            </View>
                            <View style={styles.availableInfo}>
                                <Text style={styles.availableTitle}>{series.title}</Text>
                                <Text style={styles.availableExams}>{series.totalExams} Exams</Text>
                            </View>
                            <TouchableOpacity style={styles.enrollButton}>
                                <Text style={styles.enrollButtonText}>Enroll</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.base,
    },
    headerTitle: {
        ...textStyles.h2,
        color: colors.text,
    },
    section: {
        padding: spacing.base,
    },
    sectionTitle: {
        ...textStyles.h4,
        color: colors.text,
        marginBottom: spacing.base,
    },
    seriesCard: {
        borderRadius: borderRadius.xl,
        marginBottom: spacing.base,
        overflow: 'hidden',
        ...shadows.medium,
    },
    seriesGradient: {
        padding: spacing.base,
    },
    seriesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.base,
    },
    seriesTitle: {
        ...textStyles.h5,
        color: colors.textInverse,
        flex: 1,
    },
    seriesStats: {
        flexDirection: 'row',
        gap: spacing.xl,
        marginBottom: spacing.base,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        ...textStyles.h3,
        color: colors.textInverse,
    },
    statLabel: {
        ...textStyles.caption,
        color: colors.textInverse,
        opacity: 0.9,
    },
    nextExam: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
    nextExamText: {
        ...textStyles.bodySmall,
        color: colors.textInverse,
    },
    examCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.base,
        marginBottom: spacing.sm,
        ...shadows.small,
    },
    examIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.base,
    },
    examInfo: {
        flex: 1,
    },
    examTitle: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    examMeta: {
        gap: spacing.sm,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    metaText: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    startButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        borderRadius: borderRadius.md,
    },
    startButtonText: {
        ...textStyles.bodySmall,
        color: colors.textInverse,
        fontWeight: '600',
    },
    availableCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.base,
        marginBottom: spacing.sm,
        ...shadows.small,
    },
    availableIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.secondaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.base,
    },
    availableInfo: {
        flex: 1,
    },
    availableTitle: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    availableExams: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    enrollButton: {
        backgroundColor: colors.secondary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        borderRadius: borderRadius.md,
    },
    enrollButtonText: {
        ...textStyles.bodySmall,
        color: colors.textInverse,
        fontWeight: '600',
    },
});
