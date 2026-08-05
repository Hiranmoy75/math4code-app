import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { supabase } from '../../services/supabase';
import Toast from 'react-native-toast-message';
import { clearTenantCache, logTenantInfo } from '../../utils/clearTenantCache';

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { toggleTheme, isDark } = useTheme();
    const { colors, shadows } = useAppTheme();

    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClearTenantCache = () => {
        Alert.alert(
            'Clear Tenant Cache',
            'This will clear all cached data and sign you out. Use this if you changed the tenant ID in settings. Continue?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Clear Cache',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Log current tenant info before clearing
                            logTenantInfo();

                            // Clear all tenant cache
                            await clearTenantCache();

                            Toast.show({
                                type: 'success',
                                text1: 'Cache Cleared',
                                text2: 'Please restart the app to see changes',
                                visibilityTime: 5000,
                            });
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: error.message || 'Failed to clear cache',
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) {
                                Toast.show({
                                    type: 'error',
                                    text1: 'Error',
                                    text2: 'User not found',
                                });
                                return;
                            }

                            // Call delete account function
                            const { error } = await supabase.rpc('delete_user_account', {
                                user_id: user.id
                            });

                            if (error) {
                                Toast.show({
                                    type: 'error',
                                    text1: 'Deletion Failed',
                                    text2: error.message,
                                });
                            } else {
                                // Sign out after successful deletion
                                await supabase.auth.signOut();
                                Toast.show({
                                    type: 'success',
                                    text1: 'Account Deleted',
                                    text2: 'Your account has been permanently deleted',
                                });
                            }
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: error.message || 'Failed to delete account',
                            });
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        },
        backButton: {
            padding: spacing.xs,
        },
        headerTitle: {
            ...textStyles.h3,
            color: colors.text,
        },
        content: {
            flex: 1,
        },
        section: {
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        sectionTitle: {
            ...textStyles.h4,
            color: colors.text,
            marginBottom: spacing.md,
            fontWeight: '700',
        },
        settingItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.small,
        },
        settingInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            gap: spacing.md,
        },
        settingText: {
            flex: 1,
        },
        settingLabel: {
            ...textStyles.body,
            color: colors.text,
            fontWeight: '600',
        },
        settingDescription: {
            ...textStyles.caption,
            color: colors.textSecondary,
            marginTop: 2,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            gap: spacing.md,
            ...shadows.small,
        },
        menuLabel: {
            ...textStyles.body,
            color: colors.text,
            flex: 1,
        },
        deleteButton: {
            backgroundColor: colors.error + '20',
            borderWidth: 1,
            borderColor: colors.error,
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="notifications" size={24} color={colors.primary} />
                            <View style={styles.settingText}>
                                <Text style={styles.settingLabel}>Push Notifications</Text>
                                <Text style={styles.settingDescription}>
                                    Receive notifications about your courses
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={pushNotifications}
                            onValueChange={setPushNotifications}
                            trackColor={{ false: colors.border, true: colors.primary + '80' }}
                            thumbColor={pushNotifications ? colors.primary : colors.surface}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="mail" size={24} color={colors.primary} />
                            <View style={styles.settingText}>
                                <Text style={styles.settingLabel}>Email Notifications</Text>
                                <Text style={styles.settingDescription}>
                                    Receive email updates
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={emailNotifications}
                            onValueChange={setEmailNotifications}
                            trackColor={{ false: colors.border, true: colors.primary + '80' }}
                            thumbColor={emailNotifications ? colors.primary : colors.surface}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="volume-high" size={24} color={colors.primary} />
                            <View style={styles.settingText}>
                                <Text style={styles.settingLabel}>Sound</Text>
                                <Text style={styles.settingDescription}>
                                    Enable notification sounds
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            trackColor={{ false: colors.border, true: colors.primary + '80' }}
                            thumbColor={soundEnabled ? colors.primary : colors.surface}
                        />
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="moon" size={24} color={colors.primary} />
                            <View style={styles.settingText}>
                                <Text style={styles.settingLabel}>Dark Mode</Text>
                                <Text style={styles.settingDescription}>
                                    Use dark theme
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary + '80' }}
                            thumbColor={isDark ? colors.primary : colors.surface}
                        />
                    </View>
                </View>

                {/* Privacy & Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy & Security</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('ResetPassword')}
                    >
                        <Ionicons name="lock-closed" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('LegalPage', { type: 'privacy' })}
                    >
                        <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('LegalPage', { type: 'terms' })}
                    >
                        <Ionicons name="document-text" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('LegalPage', { type: 'refund' })}
                    >
                        <Ionicons name="card" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Refund Policy</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Data & Storage */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data & Storage</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            Toast.show({
                                type: 'info',
                                text1: 'Download Data',
                                text2: 'Contact support to request your data',
                            });
                        }}
                    >
                        <Ionicons name="download" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Download Data</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleClearTenantCache}
                    >
                        <Ionicons name="refresh" size={24} color={colors.warning || colors.primary} />
                        <Text style={[styles.menuLabel, { color: colors.warning || colors.primary }]}>Clear Tenant Cache</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.deleteButton]}
                        onPress={handleDeleteAccount}
                        disabled={isDeleting}
                    >
                        <Ionicons name="warning" size={24} color={colors.error} />
                        <Text style={[styles.menuLabel, { color: colors.error, fontWeight: '700' }]}>
                            {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};
