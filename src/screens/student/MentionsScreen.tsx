import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMentions } from '../../hooks/useMentions';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { MessageCard } from '../../components/community/MessageCard';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export const MentionsScreen = () => {
    const navigation = useNavigation<any>();
    const { colors } = useAppTheme();
    const { data: mentions = [], isLoading } = useMentions();
    const { data: user } = useCurrentUser();

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
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        backButton: {
            padding: spacing.sm,
            marginRight: spacing.sm,
        },
        headerTitle: {
            ...textStyles.h3,
            color: colors.text,
            fontWeight: '700',
        },
        headerIcon: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
            backgroundColor: '#DBEAFE',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.md,
        },
        loadingText: {
            ...textStyles.body,
            color: colors.textSecondary,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
        },
        emptyIllustration: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#DBEAFE',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
        },
        emptyTitle: {
            ...textStyles.h2,
            color: colors.text,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        emptyText: {
            ...textStyles.body,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: spacing.xl,
        },
        emptyHint: {
            ...textStyles.caption,
            color: colors.textSecondary,
            textAlign: 'center',
            backgroundColor: colors.surfaceAlt,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.lg,
        },
        list: {
            flex: 1,
        },
        listContent: {
            paddingVertical: spacing.sm,
        },
        countBadge: {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: borderRadius.full,
            minWidth: 24,
            alignItems: 'center',
        },
        countText: {
            ...textStyles.caption,
            color: colors.textInverse,
            fontSize: 11,
            fontWeight: '700',
        },
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerIcon}>
                            <Ionicons name="at" size={22} color="#3B82F6" />
                        </View>
                        <Text style={styles.headerTitle}>Mentions</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading mentions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerIcon}>
                        <Ionicons name="at" size={22} color="#3B82F6" />
                    </View>
                    <Text style={styles.headerTitle}>Mentions</Text>
                </View>
                {mentions.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{mentions.length}</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            {mentions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <Ionicons name="at" size={60} color="#3B82F6" />
                    </View>
                    <Text style={styles.emptyTitle}>No Mentions Yet</Text>
                    <Text style={styles.emptyText}>
                        When someone mentions you in a message using @{user?.full_name || 'your name'}, it will appear here.
                    </Text>
                    <Text style={styles.emptyHint}>
                        💡 Tip: Type @ in any channel to mention someone
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={mentions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MessageCard
                            message={item}
                            currentUserId={user?.id || ''}
                            channelId={item.channel_id}
                        />
                    )}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
};
