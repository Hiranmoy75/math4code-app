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
    const { data: popularCourses, isLoading: loadingPopular, refetch: refetchPopular } = useCourses('popular');
    const { data: newCourses, isLoading: loadingNew, refetch: refetchNew } = useCourses('new');
    const { data: allCourses, isLoading: loadingAll, refetch: refetchAll } = useCourses('all', 3);
    const { data: categories, isLoading: loadingCategories } = useCategories();
    const { unreadCount, refetch: refetchNotifications } = useNotifications();

    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Status bar control
    useStatusBar(colors.background);

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
        }, [refetchEnrolled, refetchNotifications])
    );

    // Show Skeleton only on initial load (not refreshing)
    const isLoading = !refreshing && (loadingEnrolled || loadingPopular || loadingCategories);

    if (isLoading) {
        return <HomeSkeleton />;
    }

    const renderCourseCard = ({ item, style }: { item: Course; style?: any }) => (
        <TouchableOpacity
            style={[styles.courseCard, style]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
        >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }]}>
                <View style={styles.courseThumbnail}>
                    {item.thumbnail_url ? (
                        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
                    ) : (
                        <LinearGradient
                            colors={['#5C6BC0', '#7E57C2']}
                            style={styles.thumbnailGradient}
                        >
                            <Ionicons name="image-outline" size={40} color="#FFF" />
                        </LinearGradient>
                    )}
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>
                            {item.price === 0 ? 'Free' : `₹${item.price}`}
                        </Text>
                    </View>
                </View>
                <View style={styles.courseContent}>
                    <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.courseFooter}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text style={styles.ratingText}>4.8</Text>
                        </View>
                        <Text style={[styles.lessonsText, { color: colors.textSecondary }]}>{item.total_lessons || 0} Lessons</Text>
                    </View>
                </View>
            </BlurView>
        </TouchableOpacity>
    );

    const renderEnrolledCard = ({ item }: { item: Course }) => (
        <TouchableOpacity
            style={styles.enrolledCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
        >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.enrolledGlass, { backgroundColor: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }]}>
                <View style={styles.enrolledThumbnail}>
                    <LinearGradient
                        colors={['#5C6BC0', '#7E57C2']}
                        style={styles.thumbnailGradient}
                    >
                        <Ionicons name="play-circle" size={32} color="#FFF" />
                    </LinearGradient>
                </View>
                <View style={styles.enrolledInfo}>
                    <Text style={[styles.enrolledTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${item.progress_percentage || 0}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>{item.progress_percentage || 0}% Complete</Text>
                </View>
            </BlurView>
        </TouchableOpacity>
    );

    const renderVerticalCourseCard = ({ item }: { item: Course }) => (
        <TouchableOpacity
            style={styles.verticalCourseCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
        >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.verticalGlass, { backgroundColor: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }]}>
                <View style={styles.verticalThumbnail}>
                    {item.thumbnail_url ? (
                        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnailImage} />
                    ) : (
                        <LinearGradient
                            colors={['#5C6BC0', '#7E57C2']}
                            style={styles.thumbnailGradient}
                        >
                            <Ionicons name="image-outline" size={32} color="#FFF" />
                        </LinearGradient>
                    )}
                </View>
                <View style={styles.verticalInfo}>
                    <Text style={[styles.verticalTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.verticalSubtitle, { color: colors.textSecondary }]}>{item.category || 'General'}</Text>
                    <View style={styles.verticalFooter}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text style={styles.ratingText}>4.8</Text>
                        </View>
                        <Text style={[styles.priceText, { color: colors.primary }]}>
                            {item.price === 0 ? 'Free' : `₹${item.price}`}
                        </Text>
                    </View>
                </View>
            </BlurView>
        </TouchableOpacity>
    );

    const displayCategories = ['All', ...(categories || [])];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Background - Remove Gradient for Dark Mode consistency, or make it subtle */}
            {!isDark && (
                <LinearGradient
                    colors={['#E8EAF6', '#F3E5F5', '#E1F5FE']}
                    style={styles.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            )}

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.header, { backgroundColor: isDark ? 'rgba(30,30,30,0.6)' : 'rgba(255, 255, 255, 0.6)', borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.3)' }]}>
                    <TouchableOpacity
                        style={styles.profileImageButton}
                        onPress={() => navigation.navigate('ProfileTab')}
                    >
                        {user?.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} style={styles.profileImage} />
                        ) : (
                            <LinearGradient
                                colors={['#5C6BC0', '#7E57C2']}
                                style={styles.profileImagePlaceholder}
                            >
                                <Text style={styles.profileImageText}>{user?.full_name?.[0] || 'S'}</Text>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>

                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="search-outline" size={24} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <Ionicons name="notifications-outline" size={24} color={colors.text} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </BlurView>

                {/* Scrollable Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                >
                    {/* Welcome Message */}
                    <View style={styles.welcomeSection}>
                        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
                        <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name || 'Student'}</Text>
                    </View>

                    {/* Banner Carousel */}
                    {(!enrolledCourses || enrolledCourses.length === 0) && (
                        <View style={styles.bannerContainer}>
                            <FlatList
                                data={[
                                    {
                                        id: '1',
                                        title: 'Zero to Hero',
                                        subtitle: 'Web Development\nMega Course',
                                        discountPercent: '50% OFF',
                                        gradientColors: ['#FFF5E1', '#FFF'],
                                        themeColor: '#2563EB'
                                    },
                                    {
                                        id: '2',
                                        title: 'Master Class',
                                        subtitle: 'Python for\nData Science',
                                        discountPercent: '30% OFF',
                                        gradientColors: ['#F0FDF4', '#FFF'],
                                        themeColor: '#16A34A'
                                    },
                                    {
                                        id: '3',
                                        title: 'Best Seller',
                                        subtitle: 'Mobile App\nDevelopment',
                                        discountPercent: '40% OFF',
                                        gradientColors: ['#FFF7ED', '#FFF'],
                                        themeColor: '#EA580C'
                                    }
                                ]}
                                renderItem={({ item }) => (
                                    <HomeBanner
                                        title={item.title}
                                        subtitle={item.subtitle}
                                        discountPercent={item.discountPercent}
                                        gradientColors={item.gradientColors}
                                        themeColor={item.themeColor}
                                    />
                                )}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.bannerList}
                                snapToInterval={width - (spacing.lg * 2) + spacing.md}
                                decelerationRate="fast"
                            />
                        </View>
                    )}

                    {/* Continue Learning */}
                    {enrolledCourses && enrolledCourses.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Learning</Text>
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
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                            {displayCategories.map((category, index) => {
                                const isActive = selectedCategory === category;
                                // Use simpler styling for unselected items to ensure visibility
                                const containerStyle = isActive
                                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                    : {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                        borderWidth: 1
                                    };

                                const textStyle = isActive
                                    ? { color: '#FFF', fontWeight: '700' as const }
                                    : { color: colors.text, fontWeight: '500' as const };

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedCategory(category)}
                                        style={[styles.categoryChip, { marginRight: spacing.sm, borderRadius: 20, overflow: 'hidden' }]}
                                    >
                                        <View style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, containerStyle]}>
                                            <Text style={[styles.categoryText, textStyle]}>
                                                {category}
                                            </Text>
                                        </View>
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
                                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
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
                                <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        {allCourses?.map((course) => (
                            <View key={course.id}>
                                {renderVerticalCourseCard({ item: course })}
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    },
    profileImageButton: {
        position: 'relative',
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    profileImagePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImageText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconButton: {
        position: 'relative',
        padding: spacing.xs,
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notificationBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    welcomeSection: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    welcomeText: {
        fontSize: 16,
        color: '#616161',
        fontWeight: '500',
    },
    userName: {
        fontSize: 28,
        color: '#212121',
        fontWeight: '700',
        marginTop: 4,
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
        fontSize: 20,
        fontWeight: '700',
        color: '#212121',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    seeAll: {
        fontSize: 14,
        color: '#5C6BC0',
        fontWeight: '600',
    },
    horizontalList: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    categoriesList: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    categoryChip: {
        marginRight: spacing.sm,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    },
    categoryBlur: {
        paddingHorizontal: spacing.xl,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#616161',
    },
    activeCategoryText: {
        color: '#FFF',
        fontWeight: '700',
    },
    courseCard: {
        width: 220,
        marginRight: spacing.md,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        overflow: 'hidden',
    },
    courseThumbnail: {
        height: 120,
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    priceText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '700',
    },
    courseContent: {
        padding: spacing.md,
    },
    courseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212121',
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
        fontSize: 12,
        color: '#616161',
        marginLeft: 4,
        fontWeight: '600',
    },
    lessonsText: {
        fontSize: 12,
        color: '#616161',
    },
    enrolledCard: {
        width: 280,
        marginRight: spacing.md,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    enrolledGlass: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.xl,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
        fontSize: 14,
        fontWeight: '600',
        color: '#212121',
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#5C6BC0',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: '#616161',
        fontWeight: '500',
    },
    verticalCourseCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    verticalGlass: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.xl,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
        fontSize: 15,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 4,
    },
    verticalSubtitle: {
        fontSize: 12,
        color: '#616161',
        marginBottom: spacing.xs,
    },
    verticalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerContainer: {
        marginTop: spacing.md,
    },
    bannerList: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        gap: spacing.md,
    },
});
