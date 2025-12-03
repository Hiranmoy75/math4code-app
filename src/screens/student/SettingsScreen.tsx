import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const SettingsScreen = () => {
    const navigation = useNavigation();
    const { toggleTheme, isDark } = useTheme();
    const { colors, shadows } = useAppTheme();

    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

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
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="lock-closed" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="document-text" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Data & Storage */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data & Storage</Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="download" size={24} color={colors.primary} />
                        <Text style={styles.menuLabel}>Download Data</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="trash" size={24} color={colors.error} />
                        <Text style={[styles.menuLabel, { color: colors.error }]}>Clear Cache</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};
