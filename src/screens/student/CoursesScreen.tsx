import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Dimensions,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { useCourses } from '../../hooks/useCourses';
import { useCategories } from '../../hooks/useCategories';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';

const { width } = Dimensions.get('window');

export const CoursesScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, shadows } = useAppTheme();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const {
        data,
        isLoading,
        refetch,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useCourses('all'); // Filter is handled in UI for now, but hook supports it.
    // ideally pass filter state to hook if backend filtering desired.

    const { data: enrolledCourses } = useEnrolledCourses();
    const { data: categories } = useCategories();

    const allCourses = data?.pages.flatMap(page => page) || [];

    const filteredCourses = allCourses.map(course => {
        // Merge with enrolled data to get accurate progress
        const enrolled = enrolledCourses?.find(ec => ec.id === course.id);
        return enrolled ? { ...course, ...enrolled, is_enrolled: true } : course;
    }).filter(course => {
        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleCoursePress = (courseId: string) => {
        navigation.navigate('CourseDetails', { courseId });
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleRow}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Explore Courses</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for courses..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Categories */}
            <View style={{ marginBottom: spacing.md, marginTop: spacing.sm }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: spacing.lg }}
                >
                    <TouchableOpacity
                        style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory('all')}
                    >
                        <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    {categories?.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (!isFetchingNextPage) return <View style={{ height: 100 }} />;
        return (
            <View style={{ padding: spacing.md, alignItems: 'center', height: 100 }}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderCourseItem = ({ item: course }: { item: any }) => {
        const isTestSeries = course.course_type === 'test_series';
        const lessonCount = course.total_lessons || 0;

        return (
            <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                activeOpacity={0.9}
                onPress={() => handleCoursePress(course.id)}
            >
                <View style={styles.courseThumbnail}>
                    {course.thumbnail_url ? (
                        <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnailImage} />
                    ) : (
                        <LinearGradient
                            colors={isTestSeries ? ['#D1FAE5', '#A7F3D0'] : (colors.gradients.primary as any)}
                            style={styles.thumbnailGradient}
                        >
                            <Ionicons
                                name={isTestSeries ? "checkbox-outline" : "book"}
                                size={48}
                                color={isTestSeries ? "#10B981" : colors.textInverse}
                            />
                        </LinearGradient>
                    )}

                    {isTestSeries && (
                        <View style={styles.testSeriesBadge}>
                            <Text style={styles.testSeriesText}>TEST SERIES</Text>
                        </View>
                    )}

                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>
                            {course.price === 0 ? 'Free' : `₹${course.price}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.courseInfo}>
                    <View style={styles.courseHeader}>
                        <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                        {!isTestSeries && (
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={12} color={colors.warning} />
                                <Text style={styles.ratingText}>4.8</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.instructorRow}>
                        <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.instructorText}>{course.instructor_name || 'Math4Code'}</Text>
                    </View>

                    {course.is_enrolled && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${course.progress_percentage || 0}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{Math.round(course.progress_percentage || 0)}% Complete</Text>
                        </View>
                    )}

                    <View style={styles.cardFooter}>
                        <View style={styles.lessonsCount}>
                            <Ionicons
                                name={isTestSeries ? "document-text-outline" : "play-circle-outline"}
                                size={16}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.lessonsText}>
                                {isTestSeries
                                    ? 'Tests Included'
                                    : (lessonCount > 0 ? `${lessonCount} Lessons` : 'Start Learning')
                                }
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleCoursePress(course.id)} style={styles.enrollButton}>
                            <Text style={styles.enrollText}>
                                {course.is_enrolled ? 'Continue Learning' : 'Enroll Now'}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
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
            backgroundColor: colors.background,
        },
        header: {
            paddingTop: spacing.md,
            backgroundColor: colors.background,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
            paddingHorizontal: spacing.md,
        },
        backButton: {
            padding: spacing.sm,
            marginRight: spacing.sm,
        },
        headerTitle: {
            ...textStyles.h2,
            color: colors.text,
        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.md,
            marginHorizontal: spacing.md,
        },
        searchIcon: {
            marginRight: spacing.sm,
        },
        searchInput: {
            flex: 1,
            ...textStyles.body,
            color: colors.text,
            height: 40,
        },
        categoriesContainer: {
            paddingHorizontal: spacing.lg,
        },
        categoryChip: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surface,
            marginRight: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
        },
        categoryChipActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        categoryText: {
            ...textStyles.bodySmall,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        categoryTextActive: {
            color: colors.textInverse,
        },
        content: {
            flex: 1,
            paddingHorizontal: spacing.lg,
        },
        courseCard: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            marginBottom: spacing.lg,
            overflow: 'hidden',
            ...shadows.medium,
            borderWidth: 1,
            borderColor: colors.border,
            marginHorizontal: spacing.lg,
        },
        courseThumbnail: {
            height: 160,
            width: '100%',
            backgroundColor: colors.surfaceAlt,
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
        testSeriesBadge: {
            position: 'absolute',
            top: spacing.md,
            left: spacing.md,
            backgroundColor: '#10B981',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            zIndex: 1,
        },
        testSeriesText: {
            color: '#FFF',
            fontSize: 10,
            fontWeight: '700',
        },
        priceTag: {
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
            backgroundColor: 'rgba(0,0,0,0.7)',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
        },
        priceText: {
            ...textStyles.caption,
            color: colors.textInverse,
            fontWeight: '700',
        },
        courseInfo: {
            padding: spacing.md,
        },
        courseHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.xs,
        },
        courseTitle: {
            ...textStyles.h4,
            color: colors.text,
            flex: 1,
            marginRight: spacing.sm,
        },
        ratingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceAlt,
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
        },
        ratingText: {
            ...textStyles.caption,
            color: colors.text,
            fontWeight: 'bold',
            marginLeft: 4,
        },
        instructorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        instructorText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        progressContainer: {
            marginBottom: spacing.md,
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
        cardFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: spacing.md,
            marginTop: spacing.xs,
        },
        lessonsCount: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        lessonsText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        enrollButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        enrollText: {
            ...textStyles.bodySmall,
            color: colors.primary,
            fontWeight: '700',
        },
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.xl * 2,
        },
        emptyText: {
            ...textStyles.h4,
            color: colors.text,
            marginTop: spacing.md,
        },
        emptySubText: {
            ...textStyles.body,
            color: colors.textSecondary,
            marginTop: spacing.sm,
        },
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredCourses}
                renderItem={renderCourseItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                contentContainerStyle={{ paddingBottom: spacing.xl }}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={5}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={64} color={colors.textDisabled} />
                            <Text style={styles.emptyText}>No courses found</Text>
                            <Text style={styles.emptySubText}>Try adjusting your search or category</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};
