import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { authService } from '../../services/supabase';
import { colors, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const ProfileScreen = () => {
    const { data: user } = useCurrentUser();

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await authService.signOut();
                    },
                },
            ]
        );
    };

    const menuItems = [
        { icon: 'person-outline', label: 'Edit Profile', action: () => { } },
        { icon: 'notifications-outline', label: 'Notifications', action: () => { } },
        { icon: 'settings-outline', label: 'Settings', action: () => { } },
        { icon: 'help-circle-outline', label: 'Help & Support', action: () => { } },
        { icon: 'information-circle-outline', label: 'About', action: () => { } },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.header}
                >
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.full_name?.charAt(0).toUpperCase() || 'S'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.full_name || 'Student'}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text>
                </LinearGradient>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Exams</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>5</Text>
                        <Text style={styles.statLabel}>Courses</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>1250</Text>
                        <Text style={styles.statLabel}>Coins</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.action}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
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
    },
    statsContainer: {
        flexDirection: 'row',
        padding: spacing.base,
        gap: spacing.sm,
        marginTop: -spacing['2xl'],
    },
    statBox: {
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
    },
    statLabel: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    menuContainer: {
        padding: spacing.base,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.base,
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
        marginRight: spacing.base,
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
        padding: spacing.base,
        margin: spacing.base,
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
        marginVertical: spacing.xl,
    },
});
