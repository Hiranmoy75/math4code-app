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
import { useBookmarkedMessages } from '../../hooks/useBookmarks';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { MessageCard } from '../../components/community/MessageCard';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export const BookmarksScreen = () => {
    const navigation = useNavigation<any>();
    const { colors } = useAppTheme();
    const { data: bookmarks = [], isLoading } = useBookmarkedMessages();
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
            backgroundColor: '#FEF3C7',
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
            backgroundColor: '#FEF3C7',
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
            backgroundColor: '#F59E0B',
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
        infoCard: {
            backgroundColor: colors.surfaceAlt,
            margin: spacing.md,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            borderLeftWidth: 3,
            borderLeftColor: '#F59E0B',
        },
        infoIcon: {
            width: 32,
            height: 32,
            borderRadius: borderRadius.full,
            backgroundColor: '#FEF3C7',
            alignItems: 'center',
            justifyContent: 'center',
        },
        infoText: {
            ...textStyles.caption,
            color: colors.textSecondary,
            flex: 1,
            lineHeight: 18,
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
                            <Ionicons name="bookmark" size={22} color="#F59E0B" />
                        </View>
                        <Text style={styles.headerTitle}>Bookmarks</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading bookmarks...</Text>
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
                        <Ionicons name="bookmark" size={22} color="#F59E0B" />
                    </View>
                    <Text style={styles.headerTitle}>Bookmarks</Text>
                </View>
                {bookmarks.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{bookmarks.length}</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            {bookmarks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <Ionicons name="bookmark" size={60} color="#F59E0B" />
                    </View>
                    <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
                    <Text style={styles.emptyText}>
                        Save important messages by tapping the bookmark icon. They'll appear here for easy access later.
                    </Text>
                    <Text style={styles.emptyHint}>
                        ⭐ Tip: Tap the star icon on any message to bookmark it
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="information-circle" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.infoText}>
                            Tap the bookmark icon again to remove a message from your saved items
                        </Text>
                    </View>
                    <FlatList
                        data={bookmarks}
                        keyExtractor={(item) => item.bookmarkId}
                        renderItem={({ item }) => (
                            <MessageCard
                                message={item.message}
                                currentUserId={user?.id || ''}
                                channelId={item.message.channel_id}
                            />
                        )}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                    />
                </>
            )}
        </SafeAreaView>
    );
};
