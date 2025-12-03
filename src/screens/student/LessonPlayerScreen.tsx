import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../../components/VideoPlayer';
import { PDFViewer } from '../../components/PDFViewer';
import { TextContentViewer } from '../../components/TextContentViewer';
import { QuizLandingView } from '../../components/QuizLandingView';
import { useCourseDetails } from '../../hooks/useCourseDetails';
import { useCourseProgress } from '../../hooks/useLessonProgress';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootStackParamList, Lesson } from '../../types';
import { supabase } from '../../services/supabase';

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
            Alert.alert("Success", "Lesson marked as complete!");

            // Refresh progress
            refetch();
            refetchProgress();

        } catch (error) {
            console.error('Error marking lesson complete:', error);
            Alert.alert("Error", "Failed to save progress");
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
        if (currentLesson.content_type === 'quiz' && currentLesson.exam_id) {
            // Auto-redirect logic is usually better, but if we want to show details first:
            // For this implementation, let's assume we show the landing view
            return (
                <QuizLandingView
                    examId={currentLesson.exam_id}
                    title={currentLesson.title}
                    description={currentLesson.description}
                />
            );
        }

        switch (currentLesson.content_type) {
            case 'video':
                return (
                    <View style={styles.content}>
                        <VideoPlayer
                            url={currentLesson.video_url || ''}
                            onComplete={markLessonComplete}
                        />
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
                        pdfUrl={currentLesson.pdf_url || ''}
                        isDownloadable={currentLesson.is_downloadable}
                        onComplete={markLessonComplete}
                    />
                );
            case 'text': // text content
                return (
                    <TextContentViewer
                        content={currentLesson.text_content || ''}
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
