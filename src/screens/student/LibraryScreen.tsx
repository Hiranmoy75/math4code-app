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
import { useNavigation } from '@react-navigation/native';

import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { useTestSeries } from '../../hooks/useTestSeries';
import { colors, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Course, TestSeries } from '../../types';

const { width } = Dimensions.get('window');

export const LibraryScreen = () => {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<'courses' | 'testSeries'>('courses');

    const { data: enrolledCourses, isLoading: loadingCourses, refetch: refetchCourses } = useEnrolledCourses();
    const { data: enrolledTestSeries, isLoading: loadingTests, refetch: refetchTests } = useTestSeries(true);

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

    const renderTestSeriesItem = ({ item }: { item: TestSeries }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('TestSeriesDetails', { seriesId: item.id })}
        >
            <View style={styles.cardContentContainer}>
                <View style={styles.thumbnailContainer}>
                    <LinearGradient
                        colors={colors.gradients.warm as any}
                        style={styles.thumbnailGradient}
                    >
                        <Ionicons name="list" size={24} color={colors.textInverse} />
                    </LinearGradient>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.instructorName}>{item.total_exams} Tests</Text>

                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>
                            {item.completedExams || 0}/{item.total_exams} Completed
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="library" size={24} color={colors.textInverse} />
                    <Text style={styles.headerTitle}>Library</Text>
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

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
                    onPress={() => setActiveTab('courses')}
                >
                    <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>
                        Courses
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'testSeries' && styles.activeTab]}
                    onPress={() => setActiveTab('testSeries')}
                >
                    <Text style={[styles.tabText, activeTab === 'testSeries' && styles.activeTabText]}>
                        Test Series
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'courses' ? (
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
                ) : (
                    <FlatList
                        data={enrolledTestSeries}
                        renderItem={renderTestSeriesItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={loadingTests} onRefresh={refetchTests} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
                                <Text style={styles.emptyText}>No test series enrolled yet</Text>
                                <TouchableOpacity
                                    style={styles.browseButton}
                                    onPress={() => navigation.navigate('ExamsTab')}
                                >
                                    <Text style={styles.browseButtonText}>Browse Test Series</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

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
        marginLeft: spacing.lg,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        ...textStyles.body,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.primary,
    },
    content: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        ...shadows.small,
        overflow: 'hidden',
    },
    cardContentContainer: {
        flexDirection: 'row',
        padding: spacing.md,
    },
    thumbnailContainer: {
        width: 100,
        height: 70,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginRight: spacing.md,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    cardTitle: {
        ...textStyles.body,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    instructorName: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    progressContainer: {
        marginTop: 'auto',
    },
    progressBarBg: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginBottom: 4,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    moreButton: {
        padding: spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['3xl'],
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    browseButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
    },
    browseButtonText: {
        ...textStyles.button,
        color: colors.textInverse,
    },
});
