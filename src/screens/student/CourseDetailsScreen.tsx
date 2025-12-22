import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    LayoutAnimation,
    Platform,
    UIManager,
    Image,
    Alert,
    Linking,
    AppState,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useCourseDetails } from '../../hooks/useCourseDetails';
import { useCourseProgress } from '../../hooks/useLessonProgress';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Module, Lesson } from '../../types';
import { api } from '../../services/api';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

export const CourseDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors, shadows } = useAppTheme();
    const { courseId } = route.params;
    const appState = useRef(AppState.currentState);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingText: {
            marginTop: spacing.md,
            color: colors.textSecondary,
        },
        errorContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        errorText: {
            ...textStyles.h3,
            color: colors.error,
            marginBottom: spacing.md,
        },
        backText: {
            ...textStyles.body,
            color: colors.primary,
        },
        // Enrolled Header Styles
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
        },
        backButton: {
            padding: spacing.sm,
        },
        headerActions: {
            flexDirection: 'row',
        },
        headerIcon: {
            marginLeft: spacing.md,
            padding: spacing.xs,
            backgroundColor: '#FFE0D6', // Light orange circle bg
            borderRadius: borderRadius.full,
        },
        enrolledHeader: {
            marginBottom: spacing.xl,
            paddingHorizontal: spacing.lg,
        },
        // Landing Header Styles (Overlay)
        headerOverlay: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            zIndex: 10,
        },
        backButtonOverlay: {
            padding: spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: borderRadius.full,
        },
        headerIconOverlay: {
            marginLeft: spacing.md,
            padding: spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: borderRadius.full,
        },
        content: {
            flex: 1,
        },
        bannerContainer: {
            height: 250,
            width: '100%',
        },
        bannerImage: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        bannerGradient: {
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        },
        landingHeader: {
            padding: spacing.lg,
            backgroundColor: colors.surface,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            marginTop: -20,
        },
        courseTitle: {
            ...textStyles.h3,
            color: colors.text,
            marginBottom: spacing.xs,
        },
        instructorName: {
            ...textStyles.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
        },
        courseDescription: {
            ...textStyles.body,
            color: colors.textSecondary,
            marginBottom: spacing.lg,
            lineHeight: 22,
        },
        metaRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.lg,
            marginBottom: spacing.lg,
        },
        metaItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
        },
        metaText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        progressSection: {
            marginBottom: spacing.sm,
            marginTop: spacing.md,
        },
        progressText: {
            ...textStyles.caption,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
        },
        progressBarBg: {
            height: 6,
            backgroundColor: colors.border,
            borderRadius: 3,
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: 3,
        },
        sectionTitle: {
            ...textStyles.h4,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.md,
            marginTop: spacing.md,
        },
        modulesList: {
            paddingBottom: 100, // Space for footer
        },
        moduleCard: {
            marginBottom: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            marginHorizontal: spacing.lg,
        },
        moduleHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
            backgroundColor: colors.surfaceAlt,
        },
        moduleInfo: {
            flex: 1,
        },
        moduleTitle: {
            ...textStyles.body,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        moduleMeta: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        lessonsList: {
            backgroundColor: colors.surface,
        },
        lessonItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        lessonItemLocked: {
            opacity: 0.7,
        },
        lessonLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        iconContainer: {
            marginRight: spacing.md,
            width: 32,
            alignItems: 'center',
        },
        lessonInfo: {
            flex: 1,
        },
        lessonTitle: {
            ...textStyles.body,
            color: colors.text,
            marginBottom: 2,
        },
        lessonMeta: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        actionButton: {
            padding: spacing.xs,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            padding: spacing.lg,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            ...shadows.large,
        },
        price: {
            ...textStyles.h3,
            color: colors.text,
        },
        originalPrice: {
            ...textStyles.caption,
            color: colors.textSecondary,
            textDecorationLine: 'line-through',
        },
        buyButton: {
            backgroundColor: '#8B4513', // Brown color from image
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.full,
        },
        buyButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
        },
    });

    const { data, isLoading, error, refetch } = useCourseDetails(courseId);
    const { data: progressData } = useCourseProgress(courseId);
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [isBuying, setIsBuying] = useState(false);

    // Refetch on app focus
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                refetch();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [refetch]);

    const toggleModule = (moduleId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
    };

    const handleBuyNow = async () => {
        if (!data?.course) return;

        setIsBuying(true);
        try {
            const response = await api.buyCourse(courseId);

            if (response.success) {
                // Free course enrolled successfully
                Alert.alert("Success", "You have successfully enrolled in the course!");
                refetch();
                // Navigate to Library
                navigation.reset({
                    index: 0,
                    routes: [
                        { name: 'Main' },
                        { name: 'LibraryTab' }
                    ],
                });
            } else if (response.url) {
                // Paid course - open payment in WebView
                // Use transaction ID from the response
                const transactionId = response.transactionId;

                if (transactionId) {
                    // Navigate to PaymentWebViewScreen for in-app payment
                    navigation.navigate('PaymentWebView', {
                        paymentUrl: response.url,
                        transactionId,
                        courseId
                    });
                } else {
                    Alert.alert("Error", "Invalid payment response. Please try again.");
                }
            }
        } catch (err: any) {
            console.error('Handle Buy Now Error:', err);
            Alert.alert("Error", err.message || "Failed to initiate payment");
        } finally {
            setIsBuying(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading course details...</Text>
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load course details</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { course, modules, isEnrolled } = data;

    // Use real progress data from API
    const totalLessons = progressData?.totalLessons || modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    const completedLessons = progressData?.completedLessons || 0;
    const progressPercentage = progressData?.progressPercentage || 0;

    // --- Render Logic ---

    const renderLessonItem = (lesson: Lesson, isLocked: boolean = false) => {
        const isVideo = lesson.content_type === 'video';
        const isPdf = lesson.content_type === 'pdf';

        // Check if lesson is completed
        const lessonProgress = progressData?.lessons?.find(l => l.id === lesson.id);
        const isCompleted = lessonProgress?.completed || false;

        return (
            <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonItem, isLocked && styles.lessonItemLocked]}
                onPress={() => {
                    if (isLocked) {
                        Alert.alert("Locked", "Please enroll in the course to access this lesson.");
                        return;
                    }
                    navigation.navigate('LessonPlayer', { courseId, lessonId: lesson.id });
                }}
                disabled={isLocked && !lesson.is_free_preview}
            >
                <View style={styles.lessonLeft}>
                    <View style={styles.iconContainer}>
                        {isCompleted ? (
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.success}
                            />
                        ) : (
                            <Ionicons
                                name={isLocked ? "lock-closed-outline" : (isVideo ? "radio-outline" : "document-text-outline")}
                                size={20}
                                color={colors.textSecondary}
                            />
                        )}
                    </View>
                    <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        {lesson.video_duration && (
                            <Text style={styles.lessonMeta}>{lesson.video_duration} mins</Text>
                        )}
                        {isPdf && (
                            <Text style={styles.lessonMeta}>PDF Document</Text>
                        )}
                    </View>
                </View>
                {!isLocked && (
                    <TouchableOpacity style={styles.actionButton}>
                        <Ionicons
                            name={isPdf ? "download-outline" : "play-circle-outline"}
                            size={24}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    // 1. Enrolled View (Learning Mode) - Original Layout
    if (isEnrolled) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerIcon}>
                            <Ionicons name="create-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Course Title & Progress */}
                    <View style={styles.enrolledHeader}>
                        <Text style={styles.courseTitle}>{course.title}</Text>

                        <View style={styles.progressSection}>
                            <Text style={styles.progressText}>
                                {completedLessons}/{totalLessons} completed
                            </Text>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${progressPercentage}%` }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Modules List (Accordion) - Unlocked */}
                    <View style={styles.modulesList}>
                        {modules.map((module) => {
                            const isExpanded = expandedModuleId === module.id;
                            const pdfCount = module.lessons?.filter(l => l.content_type === 'pdf').length || 0;
                            const videoCount = module.lessons?.filter(l => l.content_type === 'video').length || 0;

                            return (
                                <View key={module.id} style={styles.moduleCard}>
                                    <TouchableOpacity
                                        style={styles.moduleHeader}
                                        onPress={() => toggleModule(module.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.moduleInfo}>
                                            <Text style={styles.moduleTitle}>{module.title}</Text>
                                            <Text style={styles.moduleMeta}>
                                                {pdfCount} pdfs • {videoCount} videos
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={24}
                                            color={colors.primary}
                                        />
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.lessonsList}>
                                            {module.lessons?.map(lesson => renderLessonItem(lesson, false))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // 2. Unenrolled View (Landing Mode) - New Layout
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonOverlay}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerIconOverlay}>
                        <Ionicons name="share-social-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Banner / Thumbnail */}
                <View style={styles.bannerContainer}>
                    {course.thumbnail_url ? (
                        <Image source={{ uri: course.thumbnail_url }} style={styles.bannerImage} />
                    ) : (
                        <LinearGradient
                            colors={colors.gradients.primary as any}
                            style={styles.bannerGradient}
                        >
                            <Ionicons name="school-outline" size={64} color={colors.textInverse} />
                        </LinearGradient>
                    )}
                </View>
                {/* Course Title & Info */}
                <View style={styles.landingHeader}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.instructorName}>{course.instructor_name || 'Math4Code'}</Text>
                    <RenderHtml
                        contentWidth={width}
                        source={{ html: course.description || '<p>No description available.</p>' }}
                        tagsStyles={{
                            body: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
                            p: { marginBottom: 10 },
                            h1: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: colors.text },
                            h2: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: colors.text },
                            h3: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: colors.text },
                            ul: { marginBottom: 10, marginLeft: 20 },
                            li: { marginBottom: 4 },
                        }}
                    />

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{modules.length} Modules</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.metaText}>English</Text>
                        </View>
                    </View>

                    <View style={styles.sectionTitle}>
                        <Text style={styles.sectionTitle}>Curriculum</Text>
                    </View>

                    {/* Modules List (Accordion) - Locked/Preview */}
                    <View style={styles.modulesList}>
                        {modules.map((module) => {
                            const isExpanded = expandedModuleId === module.id;
                            const pdfCount = module.lessons?.filter(l => l.content_type === 'pdf').length || 0;
                            const videoCount = module.lessons?.filter(l => l.content_type === 'video').length || 0;

                            return (
                                <View key={module.id} style={styles.moduleCard}>
                                    <TouchableOpacity
                                        style={styles.moduleHeader}
                                        onPress={() => toggleModule(module.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.moduleInfo}>
                                            <Text style={styles.moduleTitle}>{module.title}</Text>
                                            <Text style={styles.moduleMeta}>
                                                {pdfCount} pdfs • {videoCount} videos
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={24}
                                            color={colors.primary}
                                        />
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.lessonsList}>
                                            {module.lessons?.map(lesson => renderLessonItem(lesson, !lesson.is_free_preview))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Footer / Buy Button */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.price}>
                        {course.price === 0 ? 'Free' : `₹${course.price}`}
                    </Text>
                    {/* {course.original_price && course.original_price > course.price && ( */}
                    <Text style={styles.originalPrice}>₹{Math.round(course.price * 1.5)}</Text>
                    {/* )} */}
                </View>
                <TouchableOpacity
                    style={styles.buyButton}
                    onPress={handleBuyNow}
                    disabled={isBuying}
                >
                    {isBuying ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buyButtonText}>Buy now</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
