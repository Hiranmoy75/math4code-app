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
    StatusBar,
    Platform,
    BackHandler,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useEnrolledCourses } from '../../hooks/useEnrolledCourses';
import { useCourses } from '../../hooks/useCourses';
import { useCategories } from '../../hooks/useCategories';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useStatusBar } from '../../hooks/useStatusBar';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Course } from '../../types';
import { HomeSkeleton } from '../../components/HomeSkeleton';
import { HomeBanner } from '../../components/HomeBanner';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { data: user } = useCurrentUser();
    const { colors, isDark } = useAppTheme();
    const { data: enrolledCourses, isLoading: loadingEnrolled, refetch: refetchEnrolled } = useEnrolledCourses();

    const { data: popularData, isLoading: loadingPopular, refetch: refetchPopular } = useCourses('popular');
    const popularCourses = popularData?.pages.flatMap(page => page) || [];

    const { data: newData, isLoading: loadingNew, refetch: refetchNew } = useCourses('new');
    const newCourses = newData?.pages.flatMap(page => page) || [];

    const { data: allData, isLoading: loadingAll, refetch: refetchAll } = useCourses('all', 3);
    const allCourses = allData?.pages.flatMap(page => page) || [];
    const { data: categories, isLoading: loadingCategories } = useCategories();
    const { unreadCount, refetch: refetchNotifications } = useNotifications();

    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Auto-scroll logic for HomeBanner
    const bannerRef = React.useRef<FlatList>(null);
    const [bannerIndex, setBannerIndex] = useState(0);

    const bannerData = React.useMemo(() => {
        const enrolledIds = new Set(enrolledCourses?.map(c => c.id) || []);
        const validCourses = popularCourses.filter(course => !enrolledIds.has(course.id));

        return validCourses.slice(0, 5).map((course, index) => {
            const themes = [
                { gradient: ['#FFF5E1', '#FFFFFF'], color: '#2563EB', accent: '#FACC15' },
                { gradient: ['#F0FDF4', '#FFFFFF'], color: '#16A34A', accent: '#4ADE80' },
                { gradient: ['#EEF2FF', '#FFFFFF'], color: '#4F46E5', accent: '#818CF8' },
                { gradient: ['#FEF2F2', '#FFFFFF'], color: '#DC2626', accent: '#F87171' },
            ];
            const theme = themes[index % themes.length];

            return {
                id: course.id,
                title: 'Recommended For You',
                subtitle: course.title,
                discountPercent: course.price === 0 ? 'FREE' : 'BEST',
                discountText: course.price === 0 ? 'Start' : 'Seller',
                gradientColors: theme.gradient,
                themeColor: theme.color,
                courseId: course.id,
            };
        });
    }, [popularCourses, enrolledCourses]);

    React.useEffect(() => {
        if (bannerData.length === 0) return;

        const interval = setInterval(() => {
            const nextIndex = (bannerIndex + 1) % bannerData.length;
            setBannerIndex(nextIndex);

            try {
                bannerRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                    viewPosition: 0.5, // Center the item
                });
            } catch (e) {
                // Ignore scroll errors
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [bannerIndex, bannerData.length]);

    // Status bar control
    useStatusBar(isDark ? 'light-content' : 'dark-content');

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            refetchEnrolled(),
            refetchPopular(),
            refetchNew(),
            refetchAll(),
            refetchNotifications(),
        ]);
        setRefreshing(false);
    };

    // Filter courses based on selection
    const filteredPopular = selectedCategory === 'All'
        ? popularCourses
        : popularCourses?.filter(c => c.category === selectedCategory);

    const filteredNew = selectedCategory === 'All'
        ? newCourses
        : newCourses?.filter(c => c.category === selectedCategory);

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            refetchEnrolled();
            refetchNotifications();

            // Handle hardware back button
            let lastBackPress = 0;
            const onBackPress = () => {
                const now = Date.now();
                if (now - lastBackPress < 2000) {
                    BackHandler.exitApp();
                    return true;
                }

                lastBackPress = now;
                Toast.show({
                    type: 'info',
                    text1: 'Press back again to exit',
                    visibilityTime: 1500,
                });
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [refetchEnrolled, refetchNotifications])
    );

    // Show Skeleton only on initial load (not refreshing)
    const isLoading = !refreshing && (loadingEnrolled || loadingPopular || loadingCategories);

    if (isLoading) {
        return <HomeSkeleton />;
    }

    const renderCourseCard = ({ item, style }: { item: Course; style?: any }) => {
        const isTestSeries = item.course_type === 'test_series';

        return (
            <TouchableOpacity
                style={[styles.courseCard, style]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
            >
                <View style={[styles.cardContent, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }]}>
                    <View style={styles.courseThumbnail}>
                        {item.thumbnail_url ? (
                            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
                        ) : (
                            <LinearGradient
                                colors={['#F3E5F5', '#E1F5FE']}
                                style={styles.thumbnailGradient}
                            >
                                <Ionicons name="image-outline" size={40} color="#90CAF9" />
                            </LinearGradient>
                        )}

                        {isTestSeries && (
                            <View style={styles.testSeriesBadge}>
                                <Text style={styles.testSeriesText}>TEST SERIES</Text>
                            </View>
                        )}

                        <View style={styles.priceTag}>
                            <Text style={styles.priceText}>
                                {item.price === 0 ? 'Free' : `₹${item.price}`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardInfo}>
                        <View style={styles.categoryContainer}>
                            <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                        </View>
                        <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.courseFooter}>
                            <View style={styles.lessonsContainer}>
                                <Ionicons name={isTestSeries ? "document-text-outline" : "book-outline"} size={14} color={colors.textSecondary} />
                                <Text style={[styles.lessonsText, { color: colors.textSecondary }]}>
                                    {isTestSeries
                                        ? 'Tests Included'
                                        : ((item.total_lessons || 0) > 0 ? `${item.total_lessons} Lessons` : 'Start Learning')
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEnrolledCard = ({ item }: { item: Course }) => {
        const isTestSeries = item.course_type === 'test_series';

        return (
            <TouchableOpacity
                style={styles.enrolledCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
            >
                <View style={[styles.enrolledContent, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }]}>
                    <View style={styles.enrolledThumbnail}>
                        <LinearGradient
                            colors={isTestSeries ? ['#D1FAE5', '#A7F3D0'] : ['#E8EAF6', '#C5CAE9']}
                            style={styles.thumbnailGradient}
                        >
                            <Ionicons
                                name={isTestSeries ? "checkbox-outline" : "play-circle-outline"}
                                size={28}
                                color={isTestSeries ? "#10B981" : "#5C6BC0"}
                            />
                        </LinearGradient>
                    </View>
                    <View style={styles.enrolledInfo}>
                        <View style={styles.enrolledHeader}>
                            <Text style={[styles.enrolledTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                            {isTestSeries && <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>TEST</Text></View>}
                        </View>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressFill, { width: `${item.progress_percentage || 0}%`, backgroundColor: usersPrimaryColor(isDark) }]} />
                            </View>
                            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{Math.ceil(item.progress_percentage || 0)}% Completed</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    };

    const renderVerticalCourseCard = ({ item }: { item: Course }) => {
        const isTestSeries = item.course_type === 'test_series';

        return (
            <TouchableOpacity
                style={styles.verticalCourseCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
            >
                <View style={[styles.verticalCardContent, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }]}>
                    <View style={styles.verticalThumbnail}>
                        {item.thumbnail_url ? (
                            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
                        ) : (
                            <LinearGradient
                                colors={['#F3E5F5', '#E1F5FE']}
                                style={styles.thumbnailGradient}
                            >
                                <Ionicons name="image-outline" size={24} color="#90CAF9" />
                            </LinearGradient>
                        )}
                        {isTestSeries && (
                            <View style={styles.miniTestBadge}>
                                <Text style={styles.miniTestBadgeText}>TEST</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.verticalInfo}>
                        <View style={styles.verticalHeader}>
                            <Text style={[styles.categorySmall, { color: colors.primary }]}>{item.category || 'Course'}</Text>
                            <Text style={[styles.priceTextSmall, { color: colors.text }]}>
                                {item.price === 0 ? 'Free' : `₹${item.price}`}
                            </Text>
                        </View>
                        <Text style={[styles.verticalTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.verticalFooter}>
                            <View style={styles.metaItem}>
                                <Ionicons name={isTestSeries ? "list-outline" : "book-outline"} size={12} color={colors.textSecondary} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                    {isTestSeries
                                        ? 'Series'
                                        : ((item.total_lessons || 0) > 0 ? `${item.total_lessons} Lessons` : 'Start Learning')
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const displayCategories = ['All', ...(categories || [])];

    // Helper for primary color based on theme
    const usersPrimaryColor = (dark: boolean) => dark ? '#818CF8' : '#4F46E5';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1E293B' : '#F9FAFB' }]}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: isDark ? '#1E293B' : '#F9FAFB' }]}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.profileWrapper}
                            onPress={() => navigation.navigate('ProfileTab')}
                        >
                            {user?.avatar_url ? (
                                <Image source={{ uri: user.avatar_url }} style={styles.profileImage} />
                            ) : (
                                <LinearGradient
                                    colors={['#6366F1', '#4F46E5']}
                                    style={styles.profileImagePlaceholder}
                                >
                                    <Text style={styles.profileImageText}>{user?.full_name?.[0] || 'S'}</Text>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>
                        <View style={styles.headerTitles}>
                            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Welcome back,</Text>
                            <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name?.split(' ')[0] || 'Student'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.notificationButton, { backgroundColor: isDark ? '#27272A' : '#FFFFFF', borderColor: isDark ? '#3F3F46' : '#E4E4E7' }]}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications-outline" size={22} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Search Bar - Visual Only for now */}
                    <TouchableOpacity
                        style={[styles.searchBar, { backgroundColor: isDark ? '#334155' : '#FFFFFF', borderColor: isDark ? '#475569' : '#E5E7EB' }]}
                        onPress={() => navigation.navigate('AllCourses')}
                        activeOpacity={1}
                    >
                        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                        <Text style={[styles.searchText, { color: colors.textSecondary }]}>Search for courses...</Text>
                    </TouchableOpacity>



                    {/* Banner Carousel */}
                    {allCourses.length > 0 && (
                        <View style={styles.section}>
                            <FlatList
                                ref={bannerRef}
                                data={bannerData}
                                renderItem={({ item }) => (
                                    <HomeBanner
                                        title={item.title}
                                        subtitle={item.subtitle}
                                        discountPercent={item.discountPercent}
                                        discountText={item.discountText}
                                        gradientColors={item.gradientColors}
                                        themeColor={item.themeColor}
                                        onPress={() => navigation.navigate('CourseDetails', { courseId: item.courseId })}
                                        ctaText="View Course"
                                    />
                                )}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.bannerList}
                                snapToInterval={width - (spacing.lg * 2) + spacing.md}
                                decelerationRate="fast"
                                onScrollToIndexFailed={() => { }}
                                onMomentumScrollEnd={(event) => {
                                    const index = Math.round(event.nativeEvent.contentOffset.x / (width - (spacing.lg * 2) + spacing.md));
                                    setBannerIndex(index);
                                }}
                            />

                            {/* Pagination Dots */}
                            <View style={styles.paginationContainer}>
                                {bannerData.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.paginationDot,
                                            {
                                                backgroundColor: index === bannerIndex ? colors.primary : (isDark ? '#475569' : '#CBD5E1'),
                                                width: index === bannerIndex ? 24 : 8,
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Continue Learning */}
                    {enrolledCourses && enrolledCourses.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Learning</Text>
                            </View>
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
                    <View style={styles.categoriesSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                            {displayCategories.map((category, index) => {
                                const isActive = selectedCategory === category;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedCategory(category)}
                                        style={[
                                            styles.categoryChip,
                                            isActive
                                                ? { backgroundColor: usersPrimaryColor(isDark) }
                                                : { backgroundColor: isDark ? '#334155' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#475569' : '#E5E7EB' }
                                        ]}
                                    >
                                        <Text style={[styles.categoryText, { color: isActive ? '#FFF' : colors.text }]}>
                                            {category}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Popular Courses */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Courses</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AllCourses')}>
                                <Text style={[styles.seeAll, { color: usersPrimaryColor(isDark) }]}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            horizontal
                            data={filteredPopular}
                            renderItem={renderCourseCard}
                            keyExtractor={(item) => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>

                    {/* New Courses */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Newly Added</Text>
                        </View>
                        <FlatList
                            horizontal
                            data={filteredNew}
                            renderItem={renderCourseCard}
                            keyExtractor={(item) => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                        />
                    </View>

                    {/* All Courses (Vertical) */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>All Courses</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AllCourses')}>
                                <Text style={[styles.seeAll, { color: usersPrimaryColor(isDark) }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {allCourses?.map((course) => (
                            <View key={course.id}>
                                {renderVerticalCourseCard({ item: course })}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileWrapper: {
        marginRight: spacing.md,
    },
    profileImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#E0E7FF',
    },
    profileImagePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImageText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    headerTitles: {
        justifyContent: 'center',
    },
    greetingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    notificationBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    searchBar: {
        flexDirection: 'row',

        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
        paddingVertical: 12,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    searchText: {
        fontSize: 14,
        marginLeft: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
    },
    horizontalList: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    categoriesSection: {
        marginBottom: spacing.lg,
    },
    categoriesList: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: borderRadius.full,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
    },
    bannerList: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    // Course Card Styles
    courseCard: {
        width: 240,
        borderRadius: borderRadius.lg,
        marginBottom: 4, // for shadow
    },
    cardContent: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 2,
    },
    courseThumbnail: {
        height: 135,
        position: 'relative',
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
        top: 10,
        left: 10,
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    testSeriesText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    priceTag: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priceText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    cardInfo: {
        padding: spacing.md,
    },
    categoryContainer: {
        marginBottom: 4,
    },
    courseTitle: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: spacing.sm,
        height: 40,
    },
    courseFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lessonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lessonsText: {
        fontSize: 12,
        marginLeft: 4,
    },
    // Enrolled Card Styles
    enrolledCard: {
        width: 260,
    },
    enrolledContent: {
        flexDirection: 'row',
        padding: spacing.sm,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    enrolledThumbnail: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    enrolledInfo: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    enrolledHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    enrolledTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        marginRight: 4,
    },
    miniBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniBadgeText: {
        fontSize: 8,
        color: '#047857',
        fontWeight: '700',
    },
    progressContainer: {
        width: '100%',
    },
    progressBarBg: {
        height: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 11,
    },
    // Vertical Card Styles (All Courses)
    verticalCourseCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    verticalCardContent: {
        flexDirection: 'row',
        padding: spacing.sm,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    verticalThumbnail: {
        width: 110,
        height: 70,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    miniTestBadge: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        alignItems: 'center',
        paddingVertical: 2,
    },
    miniTestBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: '700',
    },
    verticalInfo: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    verticalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    categorySmall: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    priceTextSmall: {
        fontSize: 12,
        fontWeight: '700',
    },
    verticalTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    verticalFooter: {
        flexDirection: 'row',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 11,
        marginLeft: 4,
    },
    arrowContainer: {
        paddingHorizontal: spacing.sm,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: 6,
    },
    paginationDot: {
        height: 6,
        borderRadius: 3,
    },
});

