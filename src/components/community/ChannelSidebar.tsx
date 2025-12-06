import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnrolledCourseWithChannels, CommunityChannel } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useBookmarkedMessages } from '../../hooks/useBookmarks';
import { useMentions } from '../../hooks/useMentions';

interface ChannelSidebarProps {
    courses: EnrolledCourseWithChannels[];
    activeChannelId: string | null;
    onSelectChannel: (channelId: string, courseId: string) => void;
    onNavigateToMentions: () => void;
    onNavigateToBookmarks: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
    courses,
    activeChannelId,
    onSelectChannel,
    onNavigateToMentions,
    onNavigateToBookmarks,
    isOpen,
    onClose,
}) => {
    const { colors } = useAppTheme();
    const { data: bookmarkedMessages = [] } = useBookmarkedMessages();
    const { data: mentions = [] } = useMentions();
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
        new Set(courses.map(c => c.id))
    );

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'announcement':
                return 'megaphone';
            case 'qa':
                return 'help-circle';
            default:
                return 'chatbubbles';
        }
    };

    const toggleCourse = (courseId: string) => {
        const newExpanded = new Set(expandedCourses);
        if (newExpanded.has(courseId)) {
            newExpanded.delete(courseId);
        } else {
            newExpanded.add(courseId);
        }
        setExpandedCourses(newExpanded);
    };

    const styles = StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        sidebar: {
            width: 280,
            flex: 1,
            backgroundColor: colors.surface,
            borderRightWidth: 1,
            borderRightColor: colors.border,
        },
        header: {
            padding: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surfaceAlt,
        },
        headerTitle: {
            ...textStyles.h3,
            color: colors.text,
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerIcon: {
            marginRight: spacing.sm,
        },
        closeButton: {
            position: 'absolute',
            right: spacing.md,
            top: spacing.md,
            padding: spacing.xs,
        },
        content: {
            flex: 1,
        },
        section: {
            paddingVertical: spacing.md,
        },
        sectionTitle: {
            ...textStyles.caption,
            color: colors.textSecondary,
            fontWeight: '700',
            textTransform: 'uppercase',
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            letterSpacing: 0.5,
        },
        forYouItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            marginHorizontal: spacing.sm,
            borderRadius: borderRadius.md,
        },
        forYouIcon: {
            width: 32,
            height: 32,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        forYouText: {
            ...textStyles.body,
            color: colors.text,
            fontWeight: '600',
            flex: 1,
        },
        badge: {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: borderRadius.full,
            minWidth: 20,
            alignItems: 'center',
        },
        badgeText: {
            ...textStyles.caption,
            color: colors.textInverse,
            fontSize: 10,
            fontWeight: '700',
        },
        courseItem: {
            marginBottom: spacing.xs,
        },
        courseHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginHorizontal: spacing.sm,
            borderRadius: borderRadius.md,
        },
        courseHeaderActive: {
            backgroundColor: colors.surfaceAlt,
        },
        expandIcon: {
            marginRight: spacing.sm,
        },
        courseThumbnail: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.md,
            marginRight: spacing.md,
            backgroundColor: colors.border,
        },
        courseTitle: {
            ...textStyles.body,
            color: colors.text,
            fontWeight: '600',
            flex: 1,
        },
        channelsList: {
            paddingLeft: spacing.xl + spacing.md,
            paddingTop: spacing.xs,
        },
        channelItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginHorizontal: spacing.sm,
            marginBottom: spacing.xs,
            borderRadius: borderRadius.md,
        },
        channelItemActive: {
            backgroundColor: colors.primary + '20',
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
        },
        channelIcon: {
            marginRight: spacing.md,
        },
        channelName: {
            ...textStyles.body,
            color: colors.textSecondary,
            flex: 1,
        },
        channelNameActive: {
            color: colors.primary,
            fontWeight: '600',
        },
    });

    const content = (
        <View style={styles.sidebar}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                        name="chatbubbles"
                        size={24}
                        color={colors.primary}
                        style={styles.headerIcon}
                    />
                    <Text style={styles.headerTitle}>Community</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* For You Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>For You</Text>
                    <TouchableOpacity
                        style={styles.forYouItem}
                        onPress={() => {
                            onNavigateToMentions();
                            onClose();
                        }}
                    >
                        <View style={[styles.forYouIcon, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="at" size={18} color="#3B82F6" />
                        </View>
                        <Text style={styles.forYouText}>Mentions</Text>
                        {mentions.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{mentions.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.forYouItem}
                        onPress={() => {
                            onNavigateToBookmarks();
                            onClose();
                        }}
                    >
                        <View style={[styles.forYouIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="bookmark" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.forYouText}>Bookmarks</Text>
                        {bookmarkedMessages.length > 0 && (
                            <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                                <Text style={styles.badgeText}>{bookmarkedMessages.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* All Channels Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Channels</Text>
                    {courses.map((course) => {
                        const isExpanded = expandedCourses.has(course.id);
                        const hasActiveChannel = course.channels.some(
                            ch => ch.id === activeChannelId
                        );

                        return (
                            <View key={course.id} style={styles.courseItem}>
                                {/* Course Header */}
                                <TouchableOpacity
                                    style={[
                                        styles.courseHeader,
                                        hasActiveChannel && styles.courseHeaderActive,
                                    ]}
                                    onPress={() => toggleCourse(course.id)}
                                >
                                    <Ionicons
                                        name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                                        size={20}
                                        color={colors.textSecondary}
                                        style={styles.expandIcon}
                                    />
                                    {course.thumbnail_url ? (
                                        <Image
                                            source={{ uri: course.thumbnail_url }}
                                            style={styles.courseThumbnail}
                                        />
                                    ) : (
                                        <View style={styles.courseThumbnail}>
                                            <Ionicons
                                                name="book"
                                                size={20}
                                                color={colors.textSecondary}
                                            />
                                        </View>
                                    )}
                                    <Text style={styles.courseTitle} numberOfLines={2}>
                                        {course.title}
                                    </Text>
                                </TouchableOpacity>

                                {/* Channels List */}
                                {isExpanded && (
                                    <View style={styles.channelsList}>
                                        {course.channels.map((channel) => {
                                            const isActive = channel.id === activeChannelId;
                                            return (
                                                <TouchableOpacity
                                                    key={channel.id}
                                                    style={[
                                                        styles.channelItem,
                                                        isActive && styles.channelItemActive,
                                                    ]}
                                                    onPress={() => {
                                                        onSelectChannel(channel.id, course.id);
                                                        onClose();
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={getChannelIcon(channel.type)}
                                                        size={18}
                                                        color={isActive ? colors.primary : colors.textSecondary}
                                                        style={styles.channelIcon}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.channelName,
                                                            isActive && styles.channelNameActive,
                                                        ]}
                                                    >
                                                        {channel.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0 }}>
                    {content}
                </View>
            </View>
        </Modal>
    );
};
