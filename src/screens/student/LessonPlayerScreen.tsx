import React, { useEffect, useState, createElement } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Alert,
    Linking,
    Platform,
} from 'react-native';
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

type LessonPlayerScreenRouteProp = RouteProp<RootStackParamList, 'LessonPlayer'>;

export const LessonPlayerScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<LessonPlayerScreenRouteProp>();
    const { colors } = useAppTheme();
    const { courseId, lessonId } = route.params;

    const { data, isLoading, error, refetch } = useCourseDetails(courseId);
    const { refetch: refetchProgress } = useCourseProgress(courseId);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [allLessons, setAllLessons] = useState<Lesson[]>([]);
    const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(-1);
    const [isLessonCompleted, setIsLessonCompleted] = useState<boolean>(false);

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
            backgroundColor: colors.surface, // Changed from black to surface
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
            padding: 20,
        },
        lessonTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 10,
        },
        lessonDescription: {
            fontSize: 16,
            color: colors.textSecondary,
            lineHeight: 24,
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
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

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
        // If it's a quiz, navigate to ExamScreen (handled in useEffect or render logic)
        // For now, we'll just show the QuizLandingView if it's a quiz type
        if (currentLesson.content_type === 'quiz') {
            // Show QuizLandingView regardless of exam_id
            // If exam_id is null, it will trigger placeholder UI in ExamScreen
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
                // Check if this is a live class
                if (currentLesson.is_live && currentLesson.meeting_url) {
                    const meetingDate = currentLesson.meeting_date ? new Date(currentLesson.meeting_date) : null;
                    const now = new Date();
                    const isLive = meetingDate ? (now >= new Date(meetingDate.getTime() - 15 * 60000) && now <= new Date(meetingDate.getTime() + 2 * 60 * 60000)) : false;
                    const isUpcoming = meetingDate ? meetingDate > now && !isLive : false;

                    const handleJoinMeeting = async () => {
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
                            <View style={[styles.lessonDetails, { paddingTop: 40 }]}>
                                {/* Live Class Badge */}
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                                        <Text style={{ color: colors.textInverse, fontSize: 12, fontWeight: '600' }}>
                                            📹 {currentLesson.meeting_platform?.toUpperCase() || 'GOOGLE MEET'}
                                        </Text>
                                    </View>
                                    {isLive && (
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

                                {/* Status Banner */}
                                {isLive && (
                                    <View style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 2, borderColor: '#EF4444' }}>
                                        <Text style={{ color: '#DC2626', fontWeight: '600', textAlign: 'center' }}>
                                            🎓 Class is live! Join now to participate
                                        </Text>
                                    </View>
                                )}

                                {isUpcoming && meetingDate && (
                                    <View style={{ backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 2, borderColor: colors.primary }}>
                                        <Text style={{ color: colors.primary, fontWeight: '600', textAlign: 'center' }}>
                                            ⏰ Class starts {Math.floor((meetingDate.getTime() - now.getTime()) / 60000)} minutes from now
                                        </Text>
                                    </View>
                                )}

                                {!isLive && !isUpcoming && (
                                    <View style={{ backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                                        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                                            This class has ended
                                        </Text>
                                    </View>
                                )}

                                {/* Join Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.completeButton,
                                        { backgroundColor: isLive || isUpcoming ? colors.primary : colors.textSecondary }
                                    ]}
                                    onPress={handleJoinMeeting}
                                    disabled={!isLive && !isUpcoming}
                                >
                                    <Ionicons name="videocam" size={20} color={colors.textInverse} />
                                    <Text style={styles.completeButtonText}>
                                        {isLive ? '🚀 Join Class Now' : isUpcoming ? '🚀 Join Class' : 'Class Ended'}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                                    Clicking will open {currentLesson.meeting_platform || 'Google Meet'} in your browser
                                </Text>
                            </View>
                        </View>
                    );
                }

                // Regular video lesson
                return (
                    <View style={styles.content}>
                        {/* Check if it's a Bunny.net video */}
                        {currentLesson.video_provider === 'bunny' && (currentLesson.bunny_video_id || currentLesson.bunny_stream_id) ? (
                            <View style={{ height: Dimensions.get('window').width * (9 / 16), backgroundColor: '#000' }}>
                                {/* Check if we have required IDs */}
                                {currentLesson.bunny_library_id && (currentLesson.bunny_video_id || currentLesson.bunny_stream_id) ? (
                                    <>
                                        {Platform.OS === 'web' ? (
                                            // For web, use createElement for iframe
                                            createElement('iframe', {
                                                src: `https://iframe.mediadelivery.net/embed/${currentLesson.bunny_library_id}/${currentLesson.bunny_video_id || currentLesson.bunny_stream_id}?autoplay=false&preload=true`,
                                                style: {
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none',
                                                },
                                                allow: 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture',
                                                allowFullScreen: true,
                                            })
                                        ) : (
                                            // For mobile, use WebView
                                            <WebView
                                                source={{
                                                    uri: `https://iframe.mediadelivery.net/embed/${currentLesson.bunny_library_id}/${currentLesson.bunny_video_id || currentLesson.bunny_stream_id}?autoplay=false&preload=true`
                                                }}
                                                style={{ flex: 1 }}
                                                allowsFullscreenVideo={true}
                                                mediaPlaybackRequiresUserAction={false}
                                                javaScriptEnabled={true}
                                                domStorageEnabled={true}
                                                startInLoadingState={true}
                                                onError={(syntheticEvent) => {
                                                    const { nativeEvent } = syntheticEvent;
                                                    console.error('WebView error:', nativeEvent);
                                                    Alert.alert('Video Error', 'Failed to load video player');
                                                }}
                                                renderLoading={() => (
                                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                                                        <ActivityIndicator size="large" color={colors.primary} />
                                                        <Text style={{ color: '#fff', marginTop: 10 }}>Loading video...</Text>
                                                    </View>
                                                )}
                                            />
                                        )}
                                    </>
                                ) : (
                                    // Missing library or video ID
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                                        <Text style={{ color: colors.error, marginTop: 10, textAlign: 'center' }}>
                                            Video configuration error. Missing library or video ID.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <VideoPlayer
                                url={currentLesson.content_url || currentLesson.video_url || ''}
                                onComplete={markLessonComplete}
                            />
                        )}
                        <View style={styles.lessonDetails}>
                            <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
                            <Text style={styles.lessonDescription}>{currentLesson.description}</Text>

                            <TouchableOpacity
                                style={[
                                    styles.completeButton,
                                    isLessonCompleted && styles.completeButtonCompleted
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
        <SafeAreaView style={styles.container}>
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
                            isLessonCompleted && styles.completeHeaderButtonCompleted
                        ]}
                        onPress={markLessonComplete}
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
