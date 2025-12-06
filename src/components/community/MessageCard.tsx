import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityMessage } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useToggleReaction } from '../../hooks/useCommunityActions';
import { useToggleBookmark } from '../../hooks/useBookmarks';

interface MessageCardProps {
    message: CommunityMessage;
    currentUserId: string;
    channelId: string | null;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, currentUserId, channelId }) => {
    const { colors } = useAppTheme();
    const { mutate: toggleReaction } = useToggleReaction();
    const { mutate: toggleBookmark } = useToggleBookmark(channelId);
    const isOwnMessage = message.user_id === currentUserId;

    // Check if current user has bookmarked this message
    const isBookmarked = message.community_bookmarks?.some(
        bookmark => bookmark.user_id === currentUserId
    ) || false;

    // Group reactions by emoji
    const reactionCounts = message.community_reactions?.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const userReactions = new Set(
        message.community_reactions?.filter(r => r.user_id === currentUserId).map(r => r.emoji)
    );

    const handleReaction = (emoji: string) => {
        toggleReaction({ messageId: message.id, emoji });
    };

    const handleBookmark = () => {
        toggleBookmark({ messageId: message.id, isBookmarked });
    };

    // Parse message content for mentions
    const renderMessageContent = (content: string) => {
        const mentionRegex = /@(\w+)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(
                    <Text key={`text-${lastIndex}`}>
                        {content.substring(lastIndex, match.index)}
                    </Text>
                );
            }

            // Add mention
            parts.push(
                <Text
                    key={`mention-${match.index}`}
                    style={{
                        color: isOwnMessage ? '#FFF' : colors.primary,
                        fontWeight: '700',
                    }}
                >
                    {match[0]}
                </Text>
            );

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(
                <Text key={`text-${lastIndex}`}>
                    {content.substring(lastIndex)}
                </Text>
            );
        }

        return parts.length > 0 ? parts : content;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const styles = StyleSheet.create({
        container: {
            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            gap: spacing.sm,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.border,
        },
        avatarImage: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
        },
        avatarText: {
            ...textStyles.body,
            color: colors.textSecondary,
            fontWeight: '700',
        },
        content: {
            flex: 1,
            alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
            gap: spacing.xs,
            flexWrap: 'wrap',
        },
        name: {
            ...textStyles.caption,
            fontWeight: '700',
            color: colors.text,
        },
        badge: {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
        },
        badgeText: {
            ...textStyles.caption,
            fontSize: 9,
            color: colors.textInverse,
            fontWeight: '700',
            textTransform: 'uppercase',
        },
        pinnedBadge: {
            backgroundColor: '#F59E0B',
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
        },
        announcementBadge: {
            backgroundColor: '#3B82F6',
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
        },
        time: {
            ...textStyles.caption,
            fontSize: 11,
            color: colors.textSecondary,
        },
        bubble: {
            maxWidth: '75%',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.lg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        bubbleOwn: {
            backgroundColor: colors.primary,
            borderTopRightRadius: 4,
        },
        bubbleOther: {
            backgroundColor: colors.surface,
            borderTopLeftRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
        },
        bubblePinned: {
            borderWidth: 2,
            borderColor: '#F59E0B',
        },
        bubbleAnnouncement: {
            borderWidth: 2,
            borderColor: '#3B82F6',
        },
        messageText: {
            ...textStyles.body,
            lineHeight: 20,
        },
        messageTextOwn: {
            color: colors.textInverse,
        },
        messageTextOther: {
            color: colors.text,
        },
        reactionsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.xs,
            marginTop: spacing.xs,
        },
        reactionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            gap: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
            elevation: 1,
        },
        reactionButtonActive: {
            backgroundColor: colors.primary + '20',
            borderColor: colors.primary,
        },
        reactionButtonInactive: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
        reactionEmoji: {
            fontSize: 14,
        },
        reactionCount: {
            ...textStyles.caption,
            fontSize: 11,
            fontWeight: '700',
        },
        reactionCountActive: {
            color: colors.primary,
        },
        reactionCountInactive: {
            color: colors.textSecondary,
        },
        addReactionButton: {
            width: 28,
            height: 28,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.xs,
            borderWidth: 1,
            borderColor: colors.border,
        },
        actionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            marginTop: spacing.xs,
        },
        bookmarkButton: {
            width: 28,
            height: 28,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
    });

    return (
        <View style={styles.container}>
            {/* Avatar */}
            {!isOwnMessage && (
                <View style={styles.avatar}>
                    {message.profiles?.avatar_url ? (
                        <Image
                            source={{ uri: message.profiles.avatar_url }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {message.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                        </Text>
                    )}
                </View>
            )}

            {/* Message Content */}
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>
                        {isOwnMessage ? 'You' : (message.profiles?.full_name || 'Unknown User')}
                    </Text>
                    {message.profiles?.role === 'admin' && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Admin</Text>
                        </View>
                    )}
                    {message.is_pinned && (
                        <View style={styles.pinnedBadge}>
                            <Ionicons name="pin" size={10} color="#FFF" />
                            <Text style={styles.badgeText}>Pinned</Text>
                        </View>
                    )}
                    {message.is_announcement && (
                        <View style={styles.announcementBadge}>
                            <Ionicons name="megaphone" size={10} color="#FFF" />
                            <Text style={styles.badgeText}>Announcement</Text>
                        </View>
                    )}
                    <Text style={styles.time}>{formatTime(message.created_at)}</Text>
                </View>

                {/* Message Bubble */}
                <View style={[
                    styles.bubble,
                    isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
                    message.is_pinned && styles.bubblePinned,
                    message.is_announcement && styles.bubbleAnnouncement,
                ]}>
                    <Text style={[styles.messageText, isOwnMessage ? styles.messageTextOwn : styles.messageTextOther]}>
                        {renderMessageContent(message.content)}
                    </Text>
                </View>

                {/* Reactions */}
                {reactionCounts && Object.keys(reactionCounts).length > 0 && (
                    <View style={styles.reactionsContainer}>
                        {Object.entries(reactionCounts).map(([emoji, count]) => {
                            const isActive = userReactions.has(emoji);
                            return (
                                <TouchableOpacity
                                    key={emoji}
                                    style={[
                                        styles.reactionButton,
                                        isActive ? styles.reactionButtonActive : styles.reactionButtonInactive,
                                    ]}
                                    onPress={() => handleReaction(emoji)}
                                >
                                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                                    <Text
                                        style={[
                                            styles.reactionCount,
                                            isActive ? styles.reactionCountActive : styles.reactionCountInactive,
                                        ]}
                                    >
                                        {count}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                    {/* Add Reaction Button */}
                    <TouchableOpacity
                        style={styles.addReactionButton}
                        onPress={() => handleReaction('👍')}
                    >
                        <Ionicons name="add" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Bookmark Button */}
                    <TouchableOpacity
                        style={styles.bookmarkButton}
                        onPress={handleBookmark}
                    >
                        <Ionicons
                            name={isBookmarked ? "bookmark" : "bookmark-outline"}
                            size={16}
                            color={isBookmarked ? "#F59E0B" : colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
