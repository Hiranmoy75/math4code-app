import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useEnrolledCoursesWithChannels } from '../../hooks/useEnrolledCoursesWithChannels';
import { useCommunityMessages } from '../../hooks/useCommunityMessages';
import { useSendMessage } from '../../hooks/useCommunityActions';
import { ChannelSidebar } from '../../components/community/ChannelSidebar';
import { MessageCard } from '../../components/community/MessageCard';
import { MessageInput } from '../../components/community/MessageInput';
import { supabase } from '../../services/supabase';

export const CommunityScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, shadows } = useAppTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const flatListRef = useRef<FlatList>(null);

    // Fetch enrolled courses with channels
    const { data: courses, isLoading: coursesLoading, error: coursesError } = useEnrolledCoursesWithChannels();

    // Fetch messages for active channel
    const {
        data: messagesData,
        isLoading: messagesLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchMessages,
    } = useCommunityMessages(activeChannelId);

    // Send message mutation
    const { mutate: sendMessage, isPending: isSending } = useSendMessage(activeChannelId);

    // Get current user
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUserId(user.id);
        });
    }, []);

    // Auto-select first channel when courses load
    useEffect(() => {
        if (courses && courses.length > 0 && !activeChannelId) {
            const firstCourse = courses[0];
            if (firstCourse.channels && firstCourse.channels.length > 0) {
                setActiveChannelId(firstCourse.channels[0].id);
                setActiveCourseId(firstCourse.id);
            }
        }
    }, [courses, activeChannelId]);

    const handleSelectChannel = (channelId: string, courseId: string) => {
        setActiveChannelId(channelId);
        setActiveCourseId(courseId);
    };

    const handleSendMessage = (content: string) => {
        sendMessage({ content });
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    // Get current user role
    const [userRole, setUserRole] = useState<string>('student');
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // Fetch user profile to get role
                supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                    .then(({ data }) => {
                        if (data) setUserRole(data.role);
                    });
            }
        });
    }, []);

    // Flatten messages from all pages and reverse to show newest at bottom
    const messages = messagesData?.pages.flat().reverse() || [];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    // Get active channel name
    const activeChannel = courses
        ?.flatMap(c => c.channels)
        .find(ch => ch.id === activeChannelId);

    const activeCourse = courses?.find(c => c.id === activeCourseId);

    // Check if current channel is announcement and user is not admin
    const isAnnouncementChannel = activeChannel?.type === 'announcement';
    const canSendMessage = !isAnnouncementChannel || userRole === 'admin';

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
            ...shadows.small,
        },
        menuButton: {
            padding: spacing.sm,
            marginRight: spacing.sm,
        },
        headerContent: {
            flex: 1,
            justifyContent: 'center',
        },
        headerActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
        },
        headerButton: {
            padding: spacing.sm,
        },
        channelName: {
            ...textStyles.body,
            fontWeight: '600',
            color: colors.text,
        },
        courseName: {
            ...textStyles.caption,
            color: colors.textSecondary,
            marginTop: 2,
        },
        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingText: {
            ...textStyles.body,
            color: colors.textSecondary,
            marginTop: spacing.md,
        },
        errorContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
        },
        errorText: {
            ...textStyles.h4,
            color: colors.error,
            marginBottom: spacing.md,
            textAlign: 'center',
        },
        retryButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
        },
        retryButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
        },
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xl * 2,
        },
        emptyIllustration: {
            marginBottom: spacing.xl,
        },
        illustrationCircle: {
            width: 140,
            height: 140,
            borderRadius: 70,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyIcon: {
            marginBottom: spacing.lg,
        },
        emptyTitle: {
            ...textStyles.h3,
            color: colors.text,
            marginBottom: spacing.sm,
            textAlign: 'center',
            fontWeight: '700',
        },
        emptyText: {
            ...textStyles.body,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: spacing.lg,
        },
        emptyButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.full,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        emptyButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
            fontWeight: '700',
        },
        emptyBadges: {
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.md,
        },
        emptyBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: colors.border,
        },
        emptyBadgeText: {
            ...textStyles.caption,
            color: colors.text,
            fontWeight: '600',
        },
        messagesList: {
            flex: 1,
        },
        messagesContent: {
            paddingVertical: spacing.sm,
        },
        loadMoreContainer: {
            paddingVertical: spacing.md,
            alignItems: 'center',
        },
        loadMoreText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        lockedInput: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.surfaceAlt,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        lockedText: {
            ...textStyles.body,
            color: colors.textSecondary,
            fontStyle: 'italic',
        },
    });

    // Loading state
    if (coursesLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading community...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (coursesError) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={colors.error} />
                    <Text style={styles.errorText}>Failed to load community</Text>
                    <TouchableOpacity style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // No enrolled courses
    if (!courses || courses.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <View style={[styles.illustrationCircle, { backgroundColor: '#FEF3C7' }]}>
                            <View style={[styles.illustrationCircle, { backgroundColor: '#FCD34D', width: 100, height: 100 }]}>
                                <Ionicons name="school" size={50} color="#F59E0B" />
                            </View>
                        </View>
                    </View>
                    <Text style={styles.emptyTitle}>No Community Access</Text>
                    <Text style={styles.emptyText}>
                        Enroll in courses to join their communities and connect with instructors and peers. Start your learning journey today!
                    </Text>
                    <View style={styles.emptyBadges}>
                        <View style={styles.emptyBadge}>
                            <Ionicons name="people" size={16} color={colors.primary} />
                            <Text style={styles.emptyBadgeText}>Connect</Text>
                        </View>
                        <View style={styles.emptyBadge}>
                            <Ionicons name="chatbubbles" size={16} color="#3B82F6" />
                            <Text style={styles.emptyBadgeText}>Discuss</Text>
                        </View>
                        <View style={styles.emptyBadge}>
                            <Ionicons name="bulb" size={16} color="#F59E0B" />
                            <Text style={styles.emptyBadgeText}>Learn</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setSidebarOpen(true)}
                >
                    <Ionicons name="menu" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.channelName}>
                        #{activeChannel?.name || 'Community'}
                    </Text>
                    {activeCourse && (
                        <Text style={styles.courseName} numberOfLines={1}>
                            {activeCourse.title}
                        </Text>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {/* TODO: Add search functionality */ }}
                    >
                        <Ionicons name="search" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('HomeTab')}
                    >
                        <Ionicons name="close" size={26} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages List */}
            {!activeChannelId ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <View style={[styles.illustrationCircle, { backgroundColor: colors.primary + '20' }]}>
                            <View style={[styles.illustrationCircle, { backgroundColor: colors.primary + '40', width: 100, height: 100 }]}>
                                <Ionicons name="chatbubbles" size={50} color={colors.primary} />
                            </View>
                        </View>
                    </View>
                    <Text style={styles.emptyTitle}>Select a Channel</Text>
                    <Text style={styles.emptyText}>
                        Choose a channel from the menu to start chatting with your instructors and peers
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => setSidebarOpen(true)}
                    >
                        <Ionicons name="menu" size={20} color={colors.textInverse} />
                        <Text style={styles.emptyButtonText}>Browse Channels</Text>
                    </TouchableOpacity>
                </View>
            ) : messagesLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
            ) : messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIllustration}>
                        <View style={[styles.illustrationCircle, { backgroundColor: '#DBEAFE' }]}>
                            <View style={[styles.illustrationCircle, { backgroundColor: '#93C5FD', width: 100, height: 100 }]}>
                                <Ionicons name="chatbubble-ellipses" size={50} color="#3B82F6" />
                            </View>
                        </View>
                    </View>
                    <Text style={styles.emptyTitle}>No Messages Yet</Text>
                    <Text style={styles.emptyText}>
                        Be the first to start the conversation! Share your thoughts, ask questions, or say hello.
                    </Text>
                    <View style={styles.emptyBadges}>
                        <View style={styles.emptyBadge}>
                            <Ionicons name="people" size={16} color={colors.primary} />
                            <Text style={styles.emptyBadgeText}>Community</Text>
                        </View>
                        <View style={styles.emptyBadge}>
                            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                            <Text style={styles.emptyBadgeText}>Safe Space</Text>
                        </View>
                    </View>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MessageCard message={item} currentUserId={currentUserId} channelId={activeChannelId} />
                    )}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={refetchMessages}
                            tintColor={colors.primary}
                        />
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View style={styles.loadMoreContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.loadMoreText}>Loading more...</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Message Input */}
            {activeChannelId && (
                canSendMessage ? (
                    <MessageInput
                        onSend={handleSendMessage}
                        isSending={isSending}
                        disabled={!activeChannelId}
                        courseId={activeCourseId}
                    />
                ) : (
                    <View style={styles.lockedInput}>
                        <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
                        <Text style={styles.lockedText}>Only admins can send messages here</Text>
                    </View>
                )
            )}

            {/* Sidebar */}
            <ChannelSidebar
                courses={courses}
                activeChannelId={activeChannelId}
                onSelectChannel={handleSelectChannel}
                onNavigateToMentions={() => {
                    navigation.navigate('Mentions');
                }}
                onNavigateToBookmarks={() => {
                    navigation.navigate('Bookmarks');
                }}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
        </SafeAreaView>
    );
};
