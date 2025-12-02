import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { useCourses } from '../../hooks/useCourses';

export const CoursesScreen = () => {
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = React.useState<'my' | 'all'>('my');
    const { data: courses, isLoading, refetch } = useCourses();

    const filteredCourses = activeTab === 'my'
        ? courses?.filter(c => c.is_enrolled)
        : courses;

    const handleCoursePress = (courseId: string) => {
        navigation.navigate('CourseDetails', { courseId });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Courses</Text>
                <TouchableOpacity>
                    <Ionicons name="search" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'my' && styles.activeTab]}
                    onPress={() => setActiveTab('my')}
                >
                    <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
                        My Courses
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                        All Courses
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Courses List */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
            >
                {filteredCourses?.map((course) => (
                    <TouchableOpacity
                        key={course.id}
                        style={styles.courseCard}
                        activeOpacity={0.8}
                        onPress={() => handleCoursePress(course.id)}
                    >
                        <View style={styles.courseThumbnail}>
                            {course.thumbnail_url ? (
                                <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnailImage} />
                            ) : (
                                <LinearGradient
                                    colors={colors.gradients.primary as any}
                                    style={styles.thumbnailGradient}
                                >
                                    <Ionicons name="book" size={40} color={colors.textInverse} />
                                </LinearGradient>
                            )}
                        </View>
                        <View style={styles.courseInfo}>
                            <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                            <Text style={styles.courseInstructor}>{course.instructor_name || 'Math4Code'}</Text>

                            {course.is_enrolled && (
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${course.progress_percentage || 0}%` }]} />
                                    </View>
                                    <Text style={styles.progressText}>{course.progress_percentage || 0}% Complete</Text>
                                </View>
                            )}

                            <View style={styles.courseFooter}>
                                {course.price === 0 ? (
                                    <Text style={styles.freeTag}>FREE</Text>
                                ) : (
                                    <Text style={styles.price}>₹{course.price}</Text>
                                )}
                                <TouchableOpacity
                                    style={styles.enrollButton}
                                    onPress={() => handleCoursePress(course.id)}
                                >
                                    <Text style={styles.enrollButtonText}>
                                        {course.is_enrolled ? 'Continue' : 'Enroll'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
                {!filteredCourses?.length && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {activeTab === 'my'
                                ? "You haven't enrolled in any courses yet."
                                : "No courses available."}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.base,
    },
    headerTitle: {
        ...textStyles.h2,
        color: colors.text,
    },
    tabs: {
        flexDirection: 'row',
        padding: spacing.base,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...textStyles.body,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.textInverse,
    },
    content: {
        flex: 1,
        padding: spacing.base,
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.base,
        overflow: 'hidden',
        ...shadows.medium,
    },
    courseThumbnail: {
        width: 120,
        height: 120,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    thumbnailGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    courseInfo: {
        flex: 1,
        padding: spacing.base,
    },
    courseTitle: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    courseInstructor: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    progressContainer: {
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    progressText: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    courseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    freeTag: {
        ...textStyles.caption,
        color: colors.success,
        fontWeight: '700',
    },
    price: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '700',
    },
    enrollButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.base,
        borderRadius: borderRadius.md,
    },
    enrollButtonText: {
        ...textStyles.caption,
        color: colors.textInverse,
        fontWeight: '600',
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
