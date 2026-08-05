import React, { useEffect, useState, createElement } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Alert,
    Linking,
    Platform,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { VideoPlayer } from '../../components/VideoPlayer';
import { PDFViewer } from '../../components/PDFViewer';
import { TextContentViewer } from '../../components/TextContentViewer';
import { QuizLandingView } from '../../components/QuizLandingView';
import { useCourseDetails } from '../../hooks/useCourseDetails';
import { useCourseProgress } from '../../hooks/useLessonProgress';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootStackParamList, Lesson } from '../../types';
import { supabase } from '../../services/supabase';
import Toast from 'react-native-toast-message';
import { rewardService } from '../../services/rewards';
import { TENANT_ID } from '../../utils/tenant';

type LessonPlayerScreenRouteProp = RouteProp<RootStackParamList, 'LessonPlayer'>;

export const LessonPlayerScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<LessonPlayerScreenRouteProp>();
    const { colors } = useAppTheme();
    const { courseId, lessonId } = route.params;

    const { data, isLoading, error, refetch } = useCourseDetails(courseId);
    const { data: progressData, refetch: refetchProgress } = useCourseProgress(courseId);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [allLessons, setAllLessons] = useState<Lesson[]>([]);
    const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);
    const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);

    // Destructure enrollment status
    const isEnrolled = data?.isEnrolled ?? false;

    // Live Timer Logic (Lifted to top level to avoid Rules of Hooks violation)
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'discussions' | 'description'>('discussions');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Handle Back Press to ensure correct navigation
    useEffect(() => {
        const backAction = () => {
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                // Return to course details or main if no history
                navigation.navigate('CourseDetails', { courseId });
            }
            return true; // Prevent default behavior (exit app)
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, [courseId, navigation]);

    useEffect(() => {
        if (data?.modules) {
            // Flatten all lessons from all modules
            const lessons = data.modules.flatMap(m => m.lessons || []);
            setAllLessons(lessons);

            // Find the current lesson and its index
            const index = lessons.findIndex(l => l.id === lessonId);
            setCurrentLessonIndex(index);

            if (index !== -1) {
                setCurrentLesson(lessons[index]);
            }
        }
    }, [data, lessonId]);

    const markLessonComplete = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !currentLesson) return;

            // Check if already completed
            const { data: existingProgress } = await supabase
                .from('lesson_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('lesson_id', currentLesson.id)
                .single();

            if (existingProgress?.completed) {
                setIsLessonCompleted(true);
                return;
            }

            // Mark as complete
            const { error } = await supabase
                .from('lesson_progress')
                .upsert({
                    user_id: user.id,
                    lesson_id: currentLesson.id,
                    course_id: courseId,
                    tenant_id: TENANT_ID,
                    completed: true,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,lesson_id'
                });

            if (error) throw error;

            setIsLessonCompleted(true);

            // --- Reward Logic ---
            let rewardMessage = "Lesson marked as complete!";

            // 1. Generic Lesson Reward (Video, PDF, Text)
            // We use 'lesson_completion' for all types now
            const res = await rewardService.awardCoins(user.id, 'lesson_completion', currentLesson.id);
            if (res.success) {
                rewardMessage = `⭐ ${res.message}`;
            }

            // 2. Module Completion Reward
            if (currentLesson.module_id) {
                const modRes = await rewardService.checkModuleCompletion(user.id, currentLesson.module_id);
                if (modRes?.success) {
                    rewardMessage += `\n📦 ${modRes.message}`;
                }
            }

            Toast.show({
                type: 'success',
                text1: 'Well Done!',
                text2: rewardMessage,
                visibilityTime: 4000
            });
            // --------------------

            // Refresh progress
            refetch();
            refetchProgress();

        } catch (error) {
            console.error('Error marking lesson complete:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to save progress'
            });
        }
    };

    const handleNextLesson = () => {
        if (currentLessonIndex < allLessons.length - 1) {
            const nextLesson = allLessons[currentLessonIndex + 1];
            navigation.replace('LessonPlayer', {
                courseId,
                lessonId: nextLesson.id
            });
        }
    };

    const handlePreviousLesson = () => {
        if (currentLessonIndex > 0) {
            const prevLesson = allLessons[currentLessonIndex - 1];
            navigation.replace('LessonPlayer', {
                courseId,
                lessonId: prevLesson.id
            });
        }
    };

    const styles = StyleSheet.create({
        // ... (existing styles)
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        // ... (Add new styles here, keeping existing ones if needed, but for replacement I'll rewrite the styles object to be safe/clean or append if possible. Since I'm replacing a large chunk I'll include the new styles)
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        errorText: {
            color: colors.error,
            marginBottom: 20,
            fontSize: 16,
        },
        backButton: {
            padding: 10,
            backgroundColor: colors.primary,
            borderRadius: 8,
        },
        backButtonText: {
            color: colors.textInverse,
            fontWeight: 'bold',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerButton: {
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            flex: 1,
            color: colors.text,
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            marginHorizontal: 10,
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        navButton: {
            width: 32,
            height: 32,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 6,
            backgroundColor: colors.surfaceAlt,
        },
        navButtonDisabled: {
            opacity: 0.3,
        },
        navButtonText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.text,
        },
        navButtonTextDisabled: {
            color: colors.textDisabled,
        },
        completeHeaderButton: {
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 6,
            paddingHorizontal: 8,
            height: 32,
            marginHorizontal: 8,
        },
        completeHeaderButtonActive: {
            backgroundColor: colors.primary,
        },
        completeHeaderButtonCompleted: {
            backgroundColor: 'transparent',
        },
        completeHeaderButtonText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textInverse,
        },
        content: {
            flex: 1,
            backgroundColor: colors.background,
        },
        placeholderContainer: {
            height: Dimensions.get('window').width * (9 / 16),
            backgroundColor: colors.surfaceAlt,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        placeholderText: {
            marginTop: 10,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        lessonDetails: {
            // padding: 20, // Removing default padding for tabs
            flex: 1,
        },
        lessonTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
            paddingHorizontal: 20,
            paddingTop: 16,
        },
        lessonDescription: {
            fontSize: 16,
            color: colors.textSecondary,
            lineHeight: 24,
            paddingHorizontal: 20,
        },
        completeButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.success,
            padding: 12,
            borderRadius: 8,
            marginTop: 20,
            gap: 8,
            marginHorizontal: 20,
            marginBottom: 20,
        },
        completeButtonCompleted: {
            backgroundColor: colors.textSecondary,
            opacity: 0.8,
        },
        completeButtonText: {
            color: colors.textInverse,
            fontWeight: '600',
            fontSize: 16,
        },
        // Type specific styles
        tabBar: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
            marginTop: 12,
        },
        tabItem: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        tabItemActive: {
            borderBottomColor: '#F59E0B', // Orange color from screenshot
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        tabTextActive: {
            color: '#F59E0B',
        },
        tabContent: {
            padding: 20,
            flex: 1,
        },
        chipsContainer: {
            flexDirection: 'row',
            gap: 8,
            marginBottom: 20,
            flexWrap: 'wrap',
        },
        chip: {
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: '#F1F5F9',
        },
        chipActive: {
            backgroundColor: '#F59E0B',
        },
        chipText: {
            fontSize: 12,
            fontWeight: '500',
            color: colors.textSecondary,
        },
        chipTextActive: {
            color: '#FFF',
        },
        commentInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
        },
        avatarPlaceholder: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#CBD5E1',
            justifyContent: 'center',
            alignItems: 'center',
        },
        commentInput: {
            flex: 1,
            color: colors.textSecondary,
            fontSize: 14,
        },
        emptyStateText: {
            textAlign: 'center',
            color: colors.textSecondary,
            marginTop: 40,
            fontStyle: 'italic',
        },
    });

    if (isLoading) {
        // ... (loading state)
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }
    // ... (error state)
    if (error || !currentLesson) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load lesson</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }
    const renderContent = () => {
        // 1. Check for Sequential Unlock Lock
        if (currentLesson.sequential_unlock_enabled && currentLesson.prerequisite_lesson_id) {
            const prereqCompleted = progressData?.lessons?.find(p => p.id === currentLesson.prerequisite_lesson_id)?.completed;

            // If prerequisite NOT completed AND lesson is NOT a free preview (optional, usually sequential applies to all)
            // AND user is NOT a global admin (if applicable, but simple check for now)
            // AND it's not the first lesson (implied by having a prerequisite)

            if (!prereqCompleted) {
                // Get prerequisite title for message
                const prereqLesson = allLessons.find(l => l.id === currentLesson.prerequisite_lesson_id);
                const prereqTitle = prereqLesson?.title || "Previous Lesson";

                return (
                    <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: colors.surfaceAlt,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <Ionicons name="lock-closed" size={40} color={colors.warning || '#F59E0B'} />
                        </View>

                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: colors.text,
                            marginBottom: 10,
                            textAlign: 'center'
                        }}>
                            Lesson Locked
                        </Text>

                        <Text style={{
                            fontSize: 16,
                            color: colors.textSecondary,
                            textAlign: 'center',
                            marginBottom: 30,
                            lineHeight: 24
                        }}>
                            You need to complete <Text style={{ fontWeight: 'bold', color: colors.primary }}>"{prereqTitle}"</Text> before accessing this lesson.
                        </Text>

                        {/* Optional: Button to go to prerequisite */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.surfaceAlt,
                                paddingHorizontal: 30,
                                paddingVertical: 14,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                borderWidth: 1,
                                borderColor: colors.border
                            }}
                            onPress={() => {
                                if (prereqLesson) {
                                    navigation.replace('LessonPlayer', {
                                        courseId,
                                        lessonId: prereqLesson.id
                                    });
                                }
                            }}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.text} />
                            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                                Go to Previous Lesson
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            }
        }

        // 2. Check for locked content (Not Enrolled)
        if (!isEnrolled && !currentLesson.is_free_preview) {
            return (
                <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                    <View style={{
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.surfaceAlt,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 20
                    }}>
                        <Ionicons name="lock-closed" size={40} color={colors.textSecondary} />
                    </View>

                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: colors.text,
                        marginBottom: 10,
                        textAlign: 'center'
                    }}>
                        Content Locked
                    </Text>

                    <Text style={{
                        fontSize: 16,
                        color: colors.textSecondary,
                        textAlign: 'center',
                        marginBottom: 30,
                        lineHeight: 24
                    }}>
                        This lesson is part of the premium course content. Please enroll to access it.
                    </Text>

                    <TouchableOpacity
                        style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 30,
                            paddingVertical: 14,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 4
                        }}
                        onPress={() => navigation.navigate('CourseDetails', { courseId })}
                    >
                        <Text style={{ color: colors.textInverse, fontSize: 16, fontWeight: 'bold' }}>
                            Enroll Now
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
                    </TouchableOpacity>
                </View>
            );
        }

        if (currentLesson.content_type === 'quiz') {
            return (
                <QuizLandingView
                    examId={currentLesson.exam_id}
                    lessonId={currentLesson.id}
                    title={currentLesson.title}
                    description={currentLesson.description}
                />
            );
        }

        switch (currentLesson.content_type) {
            case 'video':
                if (currentLesson.is_live && currentLesson.meeting_url) {
                    // ... Live class remains similar, could wrap it but keeping it separate for now is fine
                    // Reusing logic from previous step, but ensuring hooks are used from top level
                    const meetingDate = currentLesson.meeting_date ? new Date(currentLesson.meeting_date) : null;
                    const startTime = meetingDate ? meetingDate.getTime() : 0;
                    const joinTime = startTime - (5 * 60 * 1000); // 5 mins before
                    const endTime = startTime + (2 * 60 * 60 * 1000); // 2 hours after
                    const nowMs = currentTime.getTime();

                    const isJoinable = meetingDate ? (nowMs >= joinTime && nowMs < endTime) : false;
                    const isUpcoming = meetingDate ? (nowMs < joinTime) : false;
                    const isEnded = meetingDate ? (nowMs >= endTime) : false;
                    const isLiveNow = meetingDate ? (nowMs >= startTime && nowMs < endTime) : false;

                    const getCountdown = () => {
                        if (!meetingDate) return '';
                        const diff = startTime - nowMs;
                        if (diff <= 0) return '00d : 00h : 00m : 00s';
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        return `${days.toString().padStart(2, '0')}d : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`;
                    };

                    const handleJoinMeeting = async () => {
                        // ... same as before
                        try {
                            const supported = await Linking.canOpenURL(currentLesson.meeting_url!);
                            if (supported) {
                                await Linking.openURL(currentLesson.meeting_url!);
                            } else {
                                Alert.alert('Error', 'Cannot open meeting link');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to open meeting link');
                        }
                    };

                    return (
                        <View style={styles.content}>
                            <View style={[styles.lessonDetails, { padding: 20, paddingTop: 40 }]}>
                                {/* Live Class content... same as before roughly */}
                                {/* Live Class Badge */}
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                                        <Text style={{ color: colors.textInverse, fontSize: 12, fontWeight: '600' }}>
                                            📹 {currentLesson.meeting_platform?.toUpperCase() || 'GOOGLE MEET'}
                                        </Text>
                                    </View>
                                    {isLiveNow && (
                                        <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                                                🔴 LIVE NOW
                                            </Text>
                                        </View>
                                    )}
                                    {isUpcoming && (
                                        <View style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.primary }}>
                                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                                📅 Upcoming
                                            </Text>
                                        </View>
                                    )}
                                    {isEnded && (
                                        <View style={{ backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.textSecondary }}>
                                            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                                                🏁 Ended
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
                                <Text style={[styles.lessonDescription, { marginBottom: 20 }]}>Live Class Session</Text>

                                {/* Meeting Info Card */}
                                <View style={{ backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                                    {meetingDate && (
                                        <>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                                <Text style={{ color: colors.text, marginLeft: 8, fontSize: 14 }}>
                                                    {meetingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                                <Text style={{ color: colors.text, marginLeft: 8, fontSize: 14 }}>
                                                    {meetingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                        </>
                                    )}
                                </View>

                                {/* Countdown / Status Banner */}
                                {isLiveNow && (
                                    <View style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 2, borderColor: '#EF4444', marginTop: 20 }}>
                                        <Text style={{ color: '#DC2626', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>
                                            🎓 Class is LIVE! Join now
                                        </Text>
                                    </View>
                                )}
                                {isUpcoming && meetingDate && (
                                    <View style={{ backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 2, borderColor: colors.primary, marginTop: 20 }}>
                                        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 8 }}>
                                            Class starts in:
                                        </Text>
                                        <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center', fontSize: 24, fontVariant: ['tabular-nums'] }}>
                                            {getCountdown()}
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.completeButton,
                                        { backgroundColor: isJoinable ? colors.primary : colors.textDisabled, opacity: isJoinable ? 1 : 0.7, marginHorizontal: 0 }
                                    ]}
                                    onPress={handleJoinMeeting}
                                    disabled={!isJoinable}
                                >
                                    <Ionicons name="videocam" size={20} color={colors.textInverse} />
                                    <Text style={styles.completeButtonText}>
                                        {isLiveNow ? '🚀 Join Class Now' : isUpcoming ? 'Wait for Class to Start' : 'Class Ended'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }

                // Regular video lesson
                return (
                    <View style={styles.content}>
                        {/* Video Player Section */}
                        {currentLesson.video_provider === 'bunny' && (currentLesson.bunny_video_id || currentLesson.bunny_stream_id) ? (
                            <View style={{ height: Dimensions.get('window').width * (9 / 16), backgroundColor: '#000' }}>
                                {/* Check if we have required IDs */}
                                {currentLesson.bunny_library_id && (currentLesson.bunny_video_id || currentLesson.bunny_stream_id) ? (
                                    <>
                                        {Platform.OS === 'web' ? (
                                            createElement('iframe', {
                                                src: `https://iframe.mediadelivery.net/embed/${currentLesson.bunny_library_id}/${currentLesson.bunny_video_id || currentLesson.bunny_stream_id}?autoplay=false&preload=true`,
                                                style: { width: '100%', height: '100%', border: 'none' },
                                                allow: 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture',
                                                allowFullScreen: true,
                                            })
                                        ) : (
                                            <WebView
                                                source={{ uri: `https://iframe.mediadelivery.net/embed/${currentLesson.bunny_library_id}/${currentLesson.bunny_video_id || currentLesson.bunny_stream_id}?autoplay=false&preload=true` }}
                                                style={{ flex: 1 }}
                                                allowsFullscreenVideo={true}
                                                mediaPlaybackRequiresUserAction={false}
                                                javaScriptEnabled={true}
                                                domStorageEnabled={true}
                                                startInLoadingState={true}
                                                renderLoading={() => (
                                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                                                        <ActivityIndicator size="large" color={colors.primary} />
                                                    </View>
                                                )}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'white' }}>Error</Text></View>
                                )}
                            </View>
                        ) : (

                            <VideoPlayer
                                url={currentLesson.content_url || currentLesson.video_url || ''}
                                thumbnailUrl={currentLesson.thumbnail_url}
                                onComplete={markLessonComplete}
                            />
                        )}

                        {/* Title Section */}
                        <Text style={styles.lessonTitle}>{currentLesson.title}</Text>

                        {/* Tabs */}
                        <View style={styles.tabBar}>
                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === 'discussions' && styles.tabItemActive]}
                                onPress={() => setActiveTab('discussions')}
                            >
                                <Text style={[styles.tabText, activeTab === 'discussions' && styles.tabTextActive]}>Discussions</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === 'description' && styles.tabItemActive]}
                                onPress={() => setActiveTab('description')}
                            >
                                <Text style={[styles.tabText, activeTab === 'description' && styles.tabTextActive]}>Description</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tab Content */}
                        <View style={styles.tabContent}>
                            {activeTab === 'discussions' ? (
                                <>
                                    <View style={styles.chipsContainer}>
                                        <View style={[styles.chip, styles.chipActive]}><Text style={[styles.chipText, styles.chipTextActive]}>All</Text></View>
                                        <View style={styles.chip}><Text style={styles.chipText}>Started</Text></View>
                                        <View style={styles.chip}><Text style={styles.chipText}>Commented</Text></View>
                                        <View style={styles.chip}><Text style={styles.chipText}>Tagged</Text></View>
                                    </View>

                                    <View style={styles.commentInputContainer}>
                                        <View style={styles.avatarPlaceholder}><Ionicons name="person" size={20} color="#FFF" /></View>
                                        <Text style={styles.commentInput}>Add a comment...</Text>
                                    </View>

                                    <Text style={styles.emptyStateText}>Comment features coming soon...</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.lessonDescription}>
                                        {currentLesson.description || 'No description available for this lesson.'}
                                    </Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.completeButton,
                                            isLessonCompleted && styles.completeButtonCompleted,
                                            { marginHorizontal: 0, marginTop: 40 }
                                        ]}
                                        onPress={markLessonComplete}
                                    >
                                        <Ionicons
                                            name={isLessonCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
                                            size={20}
                                            color={colors.textInverse}
                                        />
                                        <Text style={styles.completeButtonText}>
                                            {isLessonCompleted ? 'Completed' : 'Mark as Complete'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                );

            case 'pdf':
                return (
                    <PDFViewer
                        pdfUrl={currentLesson.content_url || currentLesson.pdf_url || ''}
                        isDownloadable={currentLesson.is_downloadable}
                        onComplete={markLessonComplete}
                    />
                );
            case 'text': // text content
                return (
                    <TextContentViewer
                        content={currentLesson.content_text || currentLesson.text_content || ''}
                        onComplete={markLessonComplete}
                    />
                );
            default:
                return (
                    <View style={styles.placeholderContainer}>
                        <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.placeholderText}>
                            Content type '{currentLesson.content_type}' not supported yet.
                        </Text>
                    </View>
                );
        }
    };

    // Special handling for Quiz type - might want to redirect immediately
    // But if we stay here, we render the QuizLandingView


    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle={colors.text === '#F1F5F9' ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                    {currentLesson.title}
                </Text>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[styles.navButton, currentLessonIndex === 0 && styles.navButtonDisabled]}
                        onPress={handlePreviousLesson}
                        disabled={currentLessonIndex === 0}
                    >
                        <Ionicons name="chevron-back" size={20} color={currentLessonIndex === 0 ? colors.textDisabled : colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.completeHeaderButton,
                            !isLessonCompleted && styles.completeHeaderButtonActive,
                            isLessonCompleted && styles.completeHeaderButtonCompleted,
                            // Hide for quiz/exam
                            (currentLesson.content_type === 'quiz' || currentLesson.content_type === 'exam') && { display: 'none' }
                        ]}
                        onPress={markLessonComplete}
                        disabled={currentLesson.content_type === 'quiz' || currentLesson.content_type === 'exam'}
                    >
                        {isLessonCompleted ? (
                            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        ) : (
                            <Text style={styles.completeHeaderButtonText}>Mark Complete</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, currentLessonIndex === allLessons.length - 1 && styles.navButtonDisabled]}
                        onPress={handleNextLesson}
                        disabled={currentLessonIndex === allLessons.length - 1}
                    >
                        <Ionicons name="chevron-forward" size={20} color={currentLessonIndex === allLessons.length - 1 ? colors.textDisabled : colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {renderContent()}
        </SafeAreaView>
    );
};

