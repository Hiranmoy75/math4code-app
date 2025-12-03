import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Course } from '../../types';

const { width } = Dimensions.get('window');

export const LibraryScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, shadows } = useAppTheme();

    const { data: enrolledCourses, isLoading: loadingCourses, refetch: refetchCourses } = useEnrolledCourses();

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {

            refetchCourses();
        }, [refetchCourses])
    );

    const renderCourseItem = ({ item }: { item: Course }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
        >
            <View style={styles.cardContentContainer}>
                <View style={styles.thumbnailContainer}>
                    {item.thumbnail_url ? (
                        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
                    ) : (
                        <LinearGradient
                            colors={colors.gradients.cool as any}
                            style={styles.thumbnailGradient}
                        >
                            <Ionicons name="book" size={24} color={colors.textInverse} />
                        </LinearGradient>
                    )}
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.instructorName}>by {item.instructor_name || 'Math4Code'}</Text>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${item.progress_percentage || 0}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>{Math.round(item.progress_percentage || 0)}% Completed</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.primary,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerTitle: {
            ...textStyles.h3,
            color: colors.textInverse,
            marginLeft: spacing.sm,
        },
        headerRight: {
            flexDirection: 'row',
        },
        headerIcon: {
            marginLeft: spacing.md,
        },
        content: {
            flex: 1,
        },
        listContent: {
            padding: spacing.md,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            marginBottom: spacing.md,
            ...shadows.medium,
        },
        cardContentContainer: {
            flexDirection: 'row',
            padding: spacing.md,
        },
        thumbnailContainer: {
            width: 80,
            height: 80,
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
        },
        thumbnail: {
            width: '100%',
            height: '100%',
        },
        thumbnailGradient: {
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        },
        infoContainer: {
            flex: 1,
            marginLeft: spacing.md,
            justifyContent: 'center',
        },
        cardTitle: {
            ...textStyles.bodyLarge,
            color: colors.text,
            fontWeight: '700',
            marginBottom: spacing.xs,
        },
        instructorName: {
            ...textStyles.caption,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
        },
        progressContainer: {
            marginTop: spacing.xs,
        },
        progressBarBg: {
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            marginBottom: spacing.xs,
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: 2,
        },
        progressText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        moreButton: {
            padding: spacing.xs,
            justifyContent: 'center',
        },
        emptyState: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.xl * 2,
        },
        emptyText: {
            ...textStyles.body,
            color: colors.textSecondary,
            marginTop: spacing.md,
            marginBottom: spacing.lg,
        },
        browseButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.lg,
        },
        browseButtonText: {
            ...textStyles.body,
            color: colors.textInverse,
            fontWeight: '600',
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="library" size={24} color={colors.textInverse} />
                    <Text style={styles.headerTitle}>My Courses</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="archive-outline" size={24} color={colors.textInverse} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="bookmark-outline" size={24} color={colors.textInverse} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <FlatList
                    data={enrolledCourses}
                    renderItem={renderCourseItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={loadingCourses} onRefresh={refetchCourses} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>No courses enrolled yet</Text>
                            <TouchableOpacity
                                style={styles.browseButton}
                                onPress={() => navigation.navigate('CoursesTab')}
                            >
                                <Text style={styles.browseButtonText}>Browse Courses</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};
