import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUserRewards, useUserBadges } from '../../hooks/useUserRewards';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { authService } from '../../services/supabase';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const { data: user } = useCurrentUser();
    const { colors, shadows } = useAppTheme();
    const { data: rewards } = useUserRewards();
    const { data: badges } = useUserBadges();
    const { data: enrolledCourses } = useEnrolledCourses();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = () => {
        setShowLogoutDialog(true);
    };

    const confirmLogout = async () => {
        setShowLogoutDialog(false);
        await authService.signOut();
    };

    const getBadgeIcon = (badgeId: string) => {
        const badgeMap: { [key: string]: string } = {
            'first_login': 'star',
            'streak_7': 'flame',
            'streak_30': 'trophy',
            'course_complete': 'school',
            'exam_master': 'ribbon',
        };
        return badgeMap[badgeId] || 'medal';
    };

    const getBadgeColor = (badgeId: string) => {
        if (badgeId.includes('streak')) return colors.warning;
        if (badgeId.includes('course')) return colors.success;
        if (badgeId.includes('exam')) return colors.primary;
        return colors.textSecondary;
    };


    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingVertical: spacing['3xl'],
            alignItems: 'center',
            borderBottomLeftRadius: borderRadius['3xl'],
            borderBottomRightRadius: borderRadius['3xl'],
        },
        avatarContainer: {
            marginBottom: spacing.base,
        },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: colors.textInverse,
        },
        avatarText: {
            ...textStyles.h1,
            color: colors.primary,
        },
        userName: {
            ...textStyles.h2,
            color: colors.textInverse,
            marginBottom: spacing.xs,
        },
        userEmail: {
            ...textStyles.body,
            color: colors.textInverse,
            opacity: 0.9,
            marginBottom: spacing.md,
        },
        levelBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            gap: spacing.xs,
        },
        levelText: {
            ...textStyles.bodySmall,
            color: colors.textInverse,
            fontWeight: '700',
        },
        rewardsContainer: {
            flexDirection: 'row',
            padding: spacing.md,
            gap: spacing.sm,
            marginTop: -spacing['2xl'],
        },
        rewardBox: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.md,
            alignItems: 'center',
            ...shadows.medium,
        },
        streakBox: {
            borderWidth: 2,
            borderColor: colors.warning + '40',
        },
        rewardValue: {
            ...textStyles.h2,
            color: colors.text,
            marginTop: spacing.xs,
            fontWeight: '700',
        },
        rewardLabel: {
            ...textStyles.caption,
            color: colors.textSecondary,
            marginTop: 2,
            fontWeight: '600',
        },
        rewardSubtext: {
            ...textStyles.caption,
            color: colors.textSecondary,
            fontSize: 10,
            marginTop: 2,
        },
        section: {
            padding: spacing.md,
        },
        sectionTitle: {
            ...textStyles.h3,
            color: colors.text,
            marginBottom: spacing.md,
        },
        statsGrid: {
            flexDirection: 'row',
            gap: spacing.sm,
        },
        statCard: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            alignItems: 'center',
            ...shadows.small,
        },
        statValue: {
            ...textStyles.h3,
            color: colors.text,
            marginTop: spacing.xs,
        },
        statLabel: {
            ...textStyles.caption,
            color: colors.textSecondary,
            marginTop: 4,
        },
        badgesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
        },
        badgeItem: {
            width: '30%',
        },
        badgeIcon: {
            width: '100%',
            aspectRatio: 1,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.small,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.small,
        },
        menuIconContainer: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primaryLight + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        menuLabel: {
            ...textStyles.body,
            color: colors.text,
            flex: 1,
        },
        logoutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.errorBg,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            margin: spacing.md,
            gap: spacing.sm,
        },
        logoutText: {
            ...textStyles.body,
            color: colors.error,
            fontWeight: '600',
        },
        version: {
            ...textStyles.caption,
            color: colors.textSecondary,
            textAlign: 'center',
            marginVertical: spacing.md,
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.header}
                >
                    <View style={styles.avatarContainer}>
                        {user?.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {user?.full_name?.charAt(0).toUpperCase() || 'S'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>{user?.full_name || 'Student'}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text>

                    {/* Level Badge */}
                    <View style={styles.levelBadge}>
                        <Ionicons name="trophy" size={16} color={colors.warning} />
                        <Text style={styles.levelText}>Level {rewards?.level || 1}</Text>
                    </View>
                </LinearGradient>

                {/* Rewards Stats */}
                <View style={styles.rewardsContainer}>
                    {/* Streak */}
                    <View style={[styles.rewardBox, styles.streakBox]}>
                        <Ionicons name="flame" size={32} color={colors.warning} />
                        <Text style={styles.rewardValue}>{rewards?.current_streak || 0}</Text>
                        <Text style={styles.rewardLabel}>Day Streak</Text>
                        <Text style={styles.rewardSubtext}>
                            Best: {rewards?.longest_streak || 0} days
                        </Text>
                    </View>

                    {/* XP */}
                    <View style={styles.rewardBox}>
                        <Ionicons name="flash" size={32} color={colors.primary} />
                        <Text style={styles.rewardValue}>{rewards?.xp || 0}</Text>
                        <Text style={styles.rewardLabel}>Total XP</Text>
                        <Text style={styles.rewardSubtext}>
                            This week: {rewards?.weekly_xp || 0}
                        </Text>
                    </View>

                    {/* Coins */}
                    <View style={styles.rewardBox}>
                        <Ionicons name="diamond" size={32} color={colors.success} />
                        <Text style={styles.rewardValue}>{rewards?.total_coins || 0}</Text>
                        <Text style={styles.rewardLabel}>Coins</Text>
                        <Text style={styles.rewardSubtext}>
                            Today: {rewards?.daily_coins_earned || 0}
                        </Text>
                    </View>
                </View>

                {/* Learning Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Learning Progress</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="book" size={24} color={colors.primary} />
                            <Text style={styles.statValue}>{enrolledCourses?.length || 0}</Text>
                            <Text style={styles.statLabel}>Courses</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                            <Text style={styles.statValue}>
                                {enrolledCourses?.filter(c => c.progress_percentage === 100).length || 0}
                            </Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="time" size={24} color={colors.warning} />
                            <Text style={styles.statValue}>
                                {enrolledCourses?.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length || 0}
                            </Text>
                            <Text style={styles.statLabel}>In Progress</Text>
                        </View>
                    </View>
                </View>

                {/* Badges */}
                {badges && badges.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Badges ({badges.length})</Text>
                        <View style={styles.badgesContainer}>
                            {badges.slice(0, 6).map((badge) => (
                                <View key={badge.id} style={styles.badgeItem}>
                                    <View style={[styles.badgeIcon, { backgroundColor: getBadgeColor(badge.badge_id) + '20' }]}>
                                        <Ionicons
                                            name={getBadgeIcon(badge.badge_id) as any}
                                            size={24}
                                            color={getBadgeColor(badge.badge_id)}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Menu Items */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="person-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="settings-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('HelpSupport')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.menuLabel}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.version}>Version 1.0.0</Text>
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Logout Confirmation Dialog */}
            <ConfirmDialog
                visible={showLogoutDialog}
                title="Logout"
                message="Are you sure you want to logout? You'll need to sign in again to access your account."
                confirmText="Logout"
                cancelText="Cancel"
                icon="log-out-outline"
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </SafeAreaView>
    );
};
