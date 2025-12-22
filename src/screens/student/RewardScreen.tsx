import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../../hooks/useAppTheme';
import { useUserRewards, useUserBadges, useRewardTransactions, useLeaderboard } from '../../hooks/useUserRewards';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const { width } = Dimensions.get('window');

const TABS = ['Missions', 'Leaderboard', 'Badges', 'History'];

export const RewardScreen = () => {
    const navigation = useNavigation();
    const { colors, shadows } = useAppTheme();
    const { data: user } = useCurrentUser();


    const [activeTab, setActiveTab] = useState('Missions');
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: rewards } = useUserRewards();
    const { data: badges } = useUserBadges();
    // Fetch enough history for calendar view
    const { data: transactions } = useRewardTransactions(100);
    const { data: leaderboard } = useLeaderboard();

    // Helper to get last 7 days including today
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                date: d,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate(),
                fullDate: d.toLocaleDateString(),
                isToday: i === 0
            });
        }
        return days;
    };

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(1); // Set to first day
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        const paddingDays = firstDay.getDay();

        for (let i = 0; i < paddingDays; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            days.push({
                date: d,
                dayNum: i,
                fullDate: d.toLocaleDateString(),
                isToday: new Date().toLocaleDateString() === d.toLocaleDateString()
            });
        }
        return days;
    };

    const monthDays = getDaysInMonth();
    const weekDays = getLast7Days();

    const isDayCompleted = (dateStr: string) => {
        if (!transactions) return false;
        return transactions.some(t =>
            t.action_type === 'login' &&
            new Date(t.created_at).toLocaleDateString() === dateStr
        );
    };

    const renderCalendar = () => {
        if (viewMode === 'week') {
            return (
                <View style={styles.calendarContainer}>
                    {weekDays.map((day, index) => {
                        const completed = isDayCompleted(day.fullDate);
                        return (
                            <View key={index} style={styles.dayItem}>
                                <Text style={styles.dayName}>{day.dayName}</Text>
                                <View style={[
                                    styles.dayCircle,
                                    day.isToday && styles.todayCircle,
                                    completed && styles.completedCircle
                                ]}>
                                    {completed ? (
                                        <Ionicons name="checkmark" size={16} color={colors.success} />
                                    ) : (
                                        <Text style={styles.dayNum}>{day.dayNum}</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            );
        }

        // Month View
        return (
            <View style={styles.monthContainer}>
                <View style={styles.monthHeader}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                        <Ionicons name="chevron-back" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                        <Ionicons name="chevron-forward" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.daysGrid}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <Text key={i} style={styles.gridHeader}>{d}</Text>
                    ))}
                    {monthDays.map((day, index) => {
                        if (!day) return <View key={`pad-${index}`} style={styles.gridItem} />;

                        const completed = isDayCompleted(day.fullDate);
                        return (
                            <View key={index} style={styles.gridItem}>
                                <View style={[
                                    styles.dayCircle,
                                    { width: 30, height: 30 },
                                    day.isToday && styles.todayCircle,
                                    completed && styles.completedCircle
                                ]}>
                                    {completed ? (
                                        <Ionicons name="checkmark" size={14} color={colors.success} />
                                    ) : (
                                        <Text style={[styles.dayNum, { fontSize: 10 }]}>{day.dayNum}</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // Mock Missions
    const missions = [
        { id: 'login', title: 'Daily Login', reward: 5, icon: 'flash', completed: true, progress: 1, total: 1 },
        { id: 'video', title: 'Watch a Video', reward: 10, icon: 'play-circle', completed: false, progress: 0, total: 1 },
        { id: 'quiz', title: 'Ace a Quiz', reward: 15, icon: 'school', completed: false, progress: 0, total: 1 },
    ];



    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backButton: {
            padding: spacing.sm,
            marginRight: spacing.sm,
        },
        headerTitle: {
            ...textStyles.h3,
            color: colors.text,
            flex: 1,
        },
        balanceCard: {
            margin: spacing.md,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        balanceItem: {
            alignItems: 'center',
            flex: 1,
        },
        balanceValue: {
            ...textStyles.h2,
            color: colors.textInverse,
            fontWeight: 'bold',
        },
        balanceLabel: {
            ...textStyles.caption,
            color: colors.textInverse,
            opacity: 0.9,
        },
        divider: {
            width: 1,
            height: 40,
            backgroundColor: 'rgba(255,255,255,0.3)',
        },
        tabContainer: {
            flexDirection: 'row',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
        },
        tab: {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            marginRight: spacing.sm,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },
        activeTab: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        tabText: {
            ...textStyles.bodySmall,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        activeTabText: {
            color: colors.textInverse,
        },
        contentContainer: {
            padding: spacing.md,
        },
        sectionTitle: {
            ...textStyles.h4,
            color: colors.text,
            marginBottom: spacing.md,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            ...shadows.small,
        },
        iconBox: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        cardContent: {
            flex: 1,
        },
        cardTitle: {
            ...textStyles.body,
            fontWeight: 'bold',
            color: colors.text,
        },
        cardSubtitle: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        rewardTag: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.warning + '20',
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: borderRadius.sm,
        },
        rewardText: {
            ...textStyles.caption,
            color: colors.warning,
            fontWeight: 'bold',
            marginLeft: 4,
        },
        progressBar: {
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            marginTop: spacing.sm,
            width: '100%',
        },
        progressFill: {
            height: '100%',
            backgroundColor: colors.success,
            borderRadius: 2,
        },
        emptyState: {
            alignItems: 'center',
            padding: spacing.xl,
        },
        emptyText: {
            color: colors.textSecondary,
            marginTop: spacing.md,
        },
        calendarContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            ...shadows.small,
        },
        dayItem: {
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
        },
        dayName: {
            ...textStyles.caption,
            color: colors.textSecondary,
            fontSize: 10,
            marginBottom: 4,
        },
        dayCircle: {
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        todayCircle: {
            borderColor: colors.primary,
            borderWidth: 2,
        },
        completedCircle: {
            backgroundColor: colors.success + '20',
            borderColor: colors.success,
        },
        dayNum: {
            ...textStyles.caption,
            color: colors.text,
            fontWeight: '600',
        },
        monthContainer: {
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
            ...shadows.small,
        },
        monthHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        monthTitle: {
            ...textStyles.h4,
            color: colors.text,
        },
        navButton: {
            padding: spacing.xs,
        },
        daysGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        gridHeader: {
            width: '14.28%',
            textAlign: 'center',
            ...textStyles.caption,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            fontSize: 10,
        },
        gridItem: {
            width: '14.28%',
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
        },
        toggleButton: {
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.surfaceAlt,
        },
        toggleText: {
            ...textStyles.caption,
            color: colors.primary,
            fontWeight: '600',
        },
        leaderboardContainer: {
            paddingBottom: spacing.xl,
        },
        leaderboardItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            padding: spacing.md,
            marginBottom: spacing.sm,
            borderRadius: borderRadius.lg,
            ...shadows.small,
        },
        currentUserItem: {
            borderWidth: 1,
            borderColor: colors.primary,
            backgroundColor: colors.primary + '10',
        },
        rankContainer: {
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.sm,
        },
        rankText: {
            ...textStyles.h4,
            color: colors.textSecondary,
            fontWeight: 'bold',
        },
        userInfo: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        avatarMini: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.border,
        },
        userName: {
            ...textStyles.body,
            fontWeight: '600',
            color: colors.text,
        },
        userLevel: {
            ...textStyles.caption,
            color: colors.textSecondary,
            fontSize: 10,
        },
        scoreContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.warning + '15',
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: borderRadius.full,
        },
        scoreText: {
            ...textStyles.bodySmall,
            fontWeight: 'bold',
            color: colors.warning,
        },
    });

    const renderMissions = () => (
        <View>
            <Text style={styles.sectionTitle}>Daily Missions</Text>
            {missions.map((mission) => (
                <View key={mission.id} style={styles.card}>
                    <View style={[styles.iconBox, { backgroundColor: mission.completed ? colors.success + '20' : colors.surfaceAlt }]}>
                        <Ionicons
                            name={mission.completed ? "checkmark-circle" : mission.icon as any}
                            size={24}
                            color={mission.completed ? colors.success : colors.textSecondary}
                        />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{mission.title}</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: mission.completed ? '100%' : '0%' }]} />
                        </View>
                    </View>
                    <View style={styles.rewardTag}>
                        <Ionicons name="diamond" size={12} color={colors.warning} />
                        <Text style={styles.rewardText}>+{mission.reward}</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderBadges = () => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {badges?.map((badge) => (
                <View key={badge.id} style={{ width: '30%', alignItems: 'center', marginBottom: spacing.md }}>
                    <View style={[styles.iconBox, { width: 80, height: 80, backgroundColor: colors.surface, marginBottom: spacing.sm }]}>
                        <Ionicons name="medal" size={40} color={colors.warning} />
                    </View>
                    <Text style={[textStyles.caption, { textAlign: 'center', color: colors.text }]}>
                        {badge.badge_id.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            ))}
            {(!badges || badges.length === 0) && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No badges yet. Keep learning!</Text>
                </View>
            )}
        </View>
    );

    const renderHistory = () => (
        <View>
            {transactions?.map((tx) => (
                <View key={tx.id} style={styles.card}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons
                            name={tx.action_type === 'login' ? 'calendar' : 'trophy'}
                            size={24}
                            color={colors.primary}
                        />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{tx.description}</Text>
                        <Text style={styles.cardSubtitle}>
                            {new Date(tx.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={[textStyles.h4, { color: colors.success }]}>+{tx.amount}</Text>
                </View>
            ))}
        </View>
    );

    const renderLeaderboard = () => (
        <View style={styles.leaderboardContainer}>
            {leaderboard?.map((entry, index) => {
                const isCurrentUser = entry.user_id === user?.id;
                let rankColor = colors.text;
                let iconName = 'ribbon';
                let iconColor = colors.textSecondary;

                if (index === 0) {
                    rankColor = '#FFD700'; // Gold
                    iconName = 'trophy';
                    iconColor = '#FFD700';
                } else if (index === 1) {
                    rankColor = '#C0C0C0'; // Silver
                    iconName = 'trophy';
                    iconColor = '#C0C0C0';
                } else if (index === 2) {
                    rankColor = '#CD7F32'; // Bronze
                    iconName = 'trophy';
                    iconColor = '#CD7F32';
                }

                return (
                    <View
                        key={entry.user_id}
                        style={[
                            styles.leaderboardItem,
                            isCurrentUser && styles.currentUserItem
                        ]}
                    >
                        <View style={styles.rankContainer}>
                            {index < 3 ? (
                                <Ionicons name={iconName as any} size={24} color={iconColor} />
                            ) : (
                                <Text style={styles.rankText}>#{entry.rank}</Text>
                            )}
                        </View>

                        <View style={styles.userInfo}>
                            {entry.avatar_url ? (
                                <Image source={{ uri: entry.avatar_url }} style={styles.avatarMini} />
                            ) : (
                                <View style={[styles.avatarMini, { backgroundColor: colors.surfaceAlt }]}>
                                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                                        {entry.full_name?.charAt(0) || 'S'}
                                    </Text>
                                </View>
                            )}
                            <View>
                                <Text style={[styles.userName, isCurrentUser && { color: colors.primary, fontWeight: 'bold' }]}>
                                    {entry.full_name} {isCurrentUser && '(You)'}
                                </Text>
                                <Text style={styles.userLevel}>Lvl {entry.level}</Text>
                            </View>
                        </View>

                        <View style={styles.scoreContainer}>
                            <Ionicons name="diamond" size={16} color={colors.warning} />
                            <Text style={styles.scoreText}>{entry.total_coins}</Text>
                        </View>
                    </View>
                );
            })}

            {(!leaderboard || leaderboard.length === 0) && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Be the first to join the leaderboard!</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rewards Zone</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.balanceCard}
                >
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceValue}>{rewards?.total_coins || 0}</Text>
                        <Text style={styles.balanceLabel}>Total Coins</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceValue}>{rewards?.current_streak || 0}</Text>
                        <Text style={styles.balanceLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.balanceItem}>
                        <Text style={styles.balanceValue}>Lvl {rewards?.level || 1}</Text>
                        <Text style={styles.balanceLabel}>Rank</Text>
                    </View>
                </LinearGradient>

                {/* Calendar Strip */}
                <View style={{ paddingHorizontal: spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={styles.sectionTitle}>Streak Calendar</Text>
                        <TouchableOpacity
                            onPress={() => setViewMode(prev => prev === 'week' ? 'month' : 'week')}
                            style={styles.toggleButton}
                        >
                            <Text style={styles.toggleText}>
                                {viewMode === 'week' ? 'View Month' : 'View Week'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {renderCalendar()}
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {activeTab === 'Missions' && renderMissions()}
                    {activeTab === 'Badges' && renderBadges()}
                    {activeTab === 'History' && renderHistory()}
                    {activeTab === 'Leaderboard' && renderLeaderboard()}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
