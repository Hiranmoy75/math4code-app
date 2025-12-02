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

export const RewardsScreen = () => {
    const rewards = {
        totalCoins: 1250,
        currentStreak: 7,
        dailyEarned: 45,
        dailyCap: 100,
    };

    const missions = [
        { id: '1', title: 'Daily Login', reward: 10, progress: 1, goal: 1, completed: true },
        { id: '2', title: 'Complete 3 Quizzes', reward: 30, progress: 2, goal: 3, completed: false },
        { id: '3', title: 'Watch 2 Videos', reward: 20, progress: 1, goal: 2, completed: false },
    ];

    const transactions = [
        { id: '1', action: 'Daily Login', coins: 10, date: 'Today' },
        { id: '2', action: 'Quiz Completed', coins: 15, date: 'Today' },
        { id: '3', action: 'Video Watched', coins: 10, date: 'Yesterday' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={colors.gradients.warm as any}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.coinDisplay}>
                            <Ionicons name="diamond" size={48} color={colors.textInverse} />
                            <Text style={styles.coinAmount}>{rewards.totalCoins}</Text>
                            <Text style={styles.coinLabel}>Total Coins</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Ionicons name="flame" size={32} color={colors.streak} />
                        <Text style={styles.statValue}>{rewards.currentStreak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-up" size={32} color={colors.success} />
                        <Text style={styles.statValue}>{rewards.dailyEarned}/{rewards.dailyCap}</Text>
                        <Text style={styles.statLabel}>Today's Coins</Text>
                    </View>
                </View>

                {/* Daily Missions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Daily Missions</Text>
                    {missions.map((mission) => (
                        <View key={mission.id} style={styles.missionCard}>
                            <View style={styles.missionIcon}>
                                <Ionicons
                                    name={mission.completed ? 'checkmark-circle' : 'hourglass-outline'}
                                    size={24}
                                    color={mission.completed ? colors.success : colors.textSecondary}
                                />
                            </View>
                            <View style={styles.missionInfo}>
                                <Text style={styles.missionTitle}>{mission.title}</Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${(mission.progress / mission.goal) * 100}%` }]} />
                                </View>
                                <Text style={styles.missionProgress}>{mission.progress}/{mission.goal}</Text>
                            </View>
                            <View style={styles.missionReward}>
                                <Ionicons name="diamond" size={16} color={colors.coin} />
                                <Text style={styles.rewardText}>{mission.reward}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Transaction History */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {transactions.map((transaction) => (
                        <View key={transaction.id} style={styles.transactionCard}>
                            <View style={styles.transactionIcon}>
                                <Ionicons name="add-circle" size={20} color={colors.success} />
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={styles.transactionAction}>{transaction.action}</Text>
                                <Text style={styles.transactionDate}>{transaction.date}</Text>
                            </View>
                            <Text style={styles.transactionCoins}>+{transaction.coins}</Text>
                        </View>
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
        paddingVertical: spacing['3xl'],
        borderBottomLeftRadius: borderRadius['3xl'],
        borderBottomRightRadius: borderRadius['3xl'],
    },
    headerContent: {
        alignItems: 'center',
    },
    coinDisplay: {
        alignItems: 'center',
    },
    coinAmount: {
        ...textStyles.h1,
        color: colors.textInverse,
        marginTop: spacing.sm,
    },
    coinLabel: {
        ...textStyles.body,
        color: colors.textInverse,
        opacity: 0.9,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: spacing.base,
        gap: spacing.sm,
        marginTop: -spacing['2xl'],
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.base,
        alignItems: 'center',
        ...shadows.medium,
    },
    statValue: {
        ...textStyles.h3,
        color: colors.text,
        marginTop: spacing.sm,
    },
    statLabel: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    section: {
        padding: spacing.base,
    },
    sectionTitle: {
        ...textStyles.h4,
        color: colors.text,
        marginBottom: spacing.base,
    },
    missionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.base,
        marginBottom: spacing.sm,
        ...shadows.small,
    },
    missionIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.base,
    },
    missionInfo: {
        flex: 1,
    },
    missionTitle: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    missionProgress: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    missionReward: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    rewardText: {
        ...textStyles.bodySmall,
        color: colors.coin,
        fontWeight: '700',
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.base,
        marginBottom: spacing.sm,
        ...shadows.small,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.base,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionAction: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '600',
    },
    transactionDate: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    transactionCoins: {
        ...textStyles.bodySmall,
        color: colors.success,
        fontWeight: '700',
    },
});
