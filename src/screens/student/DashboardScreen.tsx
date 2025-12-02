import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    FlatList,
    RefreshControl,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { useCourses } from '../../hooks/useCourses';
import { useCategories } from '../../hooks/useCategories';
import { colors, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Course } from '../../types';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { data: user } = useCurrentUser();
    const { data: enrolledCourses, isLoading: loadingEnrolled, refetch: refetchEnrolled } = useEnrolledCourses();
    const { data: popularCourses, isLoading: loadingPopular, refetch: refetchPopular } = useCourses('popular');
    const { data: newCourses, isLoading: loadingNew, refetch: refetchNew } = useCourses('new');
    const { data: allCourses, isLoading: loadingAll, refetch: refetchAll } = useCourses('all', 3);
    const { data: categories, isLoading: loadingCategories } = useCategories();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            refetchEnrolled(),
            refetchPopular(),
            refetchNew(),
            refetchAll(),
        ]);
        setRefreshing(false);
    };

    const renderCourseCard = ({ item, style }: { item: Course; style?: any }) => (
        <TouchableOpacity
            style={[styles.courseCard, style]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
        >
            <View style={styles.courseThumbnail}>
                {item.thumbnail_url ? (
                    <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
                ) : (
                    <LinearGradient
                        colors={colors.gradients.cool as any}
                        style={styles.thumbnailGradient}
                    >
                        <Ionicons name="image-outline" size={40} color={colors.textInverse} />
                    </LinearGradient>
                )}
                <View style={styles.priceTag}>
                    <Text style={styles.priceText}>
                        {item.price === 0 ? 'Free' : `$${item.price}`}
                    </Text>
                </View>
            </View>
            <View style={styles.courseContent}>
                <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.courseFooter}>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color={colors.warning} />
                        <Text style={styles.ratingText}>4.8</Text>
                    </View>
                    <Text style={styles.lessonsText}>{item.total_lessons || 0} Lessons</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEnrolledCard = ({ item }: { item: Course }) => (
        <TouchableOpacity
            style={styles.enrolledCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
        >
            <View style={styles.enrolledThumbnail}>
                <LinearGradient
                    colors={colors.gradients.primary as any}
                    style={styles.thumbnailGradient}
                >
                    <Ionicons name="play-circle" size={32} color={colors.textInverse} />
                </LinearGradient>
            </View>
            <View style={styles.enrolledInfo}>
                <Text style={styles.enrolledTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${item.progress_percentage || 0}%` }]} />
                </View>
                <Text style={styles.progressText}>{item.progress_percentage || 0}% Complete</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.userName}>{user?.full_name || 'Student'} 👋</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('ProfileTab')}>
                        {user?.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{user?.full_name?.[0] || 'S'}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Continue Learning */}
                {enrolledCourses && enrolledCourses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Continue Learning</Text>
                        <FlatList
                            horizontal
                            data={enrolledCourses}
                            renderItem={renderEnrolledCard}
                            keyExtractor={(item) => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>
                )}

                {/* Categories */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                        {categories?.map((category, index) => (
                            <TouchableOpacity key={index} style={styles.categoryChip}>
                                <Text style={styles.categoryText}>{category}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.categoryChip, styles.activeCategory]}>
                            <Text style={[styles.categoryText, styles.activeCategoryText]}>All</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Popular Courses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Popular Courses</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('CoursesTab')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        data={popularCourses}
                        renderItem={renderCourseCard}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* New Courses */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Newly Added</Text>
                    </View>
                    <FlatList
                        horizontal
                        data={newCourses}
                        renderItem={renderCourseCard}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* All Courses (Vertical) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>All Courses</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('CoursesTab')}>
                            <Text style={styles.seeAll}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {allCourses?.map((course) => (
                        <TouchableOpacity
                            key={course.id}
                            style={styles.verticalCourseCard}
                            onPress={() => navigation.navigate('CourseDetails', { courseId: course.id })}
                        >
                            <View style={styles.verticalThumbnail}>
                                <LinearGradient
                                    colors={colors.gradients.warm as any}
                                    style={styles.thumbnailGradient}
                                >
                                    <Ionicons name="book" size={24} color={colors.textInverse} />
                                </LinearGradient>
                            </View>
                            <View style={styles.verticalInfo}>
                                <Text style={styles.verticalTitle}>{course.title}</Text>
                                <Text style={styles.verticalSubtitle} numberOfLines={2}>{course.description}</Text>
                                <View style={styles.verticalFooter}>
                                    <Text style={styles.priceText}>${course.price}</Text>
                                    <View style={styles.ratingContainer}>
                                        <Ionicons name="star" size={12} color={colors.warning} />
                                        <Text style={styles.ratingText}>4.5</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
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
        paddingVertical: spacing.lg,
    },
    greeting: {
        ...textStyles.body,
        color: colors.textSecondary,
    },
    userName: {
        ...textStyles.h2,
        color: colors.text,
    },
    profileButton: {
        ...shadows.small,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...textStyles.h3,
        color: colors.textInverse,
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.text,
        paddingHorizontal: spacing.lg,
    },
    seeAll: {
        ...textStyles.bodySmall,
        color: colors.primary,
        fontWeight: '600',
    },
    horizontalList: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    categoriesList: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeCategory: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '500',
    },
    activeCategoryText: {
        color: colors.textInverse,
    },
    courseCard: {
        width: 220,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        marginRight: spacing.md,
        ...shadows.medium,
        overflow: 'hidden',
    },
    courseThumbnail: {
        height: 120,
        backgroundColor: colors.background,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceTag: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    priceText: {
        ...textStyles.caption,
        color: colors.textInverse,
        fontWeight: '700',
    },
    courseContent: {
        padding: spacing.md,
    },
    courseTitle: {
        ...textStyles.body,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
        height: 44,
    },
    courseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
    },
    lessonsText: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    enrolledCard: {
        width: 280,
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        marginRight: spacing.md,
        padding: spacing.sm,
        ...shadows.small,
        alignItems: 'center',
    },
    enrolledThumbnail: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    enrolledInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    enrolledTitle: {
        ...textStyles.bodySmall,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    verticalCourseCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.sm,
        ...shadows.small,
    },
    verticalThumbnail: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    verticalInfo: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    verticalTitle: {
        ...textStyles.body,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    verticalSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    verticalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});


