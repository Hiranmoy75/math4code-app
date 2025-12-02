import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from '../../components/VideoPlayer';
import { useCourseDetails } from '../../hooks/useCourseDetails';
import { colors } from '../../constants/colors';
import { RootStackParamList, Lesson } from '../../types';

type LessonPlayerScreenRouteProp = RouteProp<RootStackParamList, 'LessonPlayer'>;

export const LessonPlayerScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<LessonPlayerScreenRouteProp>();
    const { courseId, lessonId } = route.params;

    const { data, isLoading, error } = useCourseDetails(courseId);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

    useEffect(() => {
        if (data?.modules) {
            // Find the lesson in the modules
            for (const module of data.modules) {
                const foundLesson = module.lessons?.find(l => l.id === lessonId);
                if (foundLesson) {
                    setCurrentLesson(foundLesson);
                    break;
                }
            }
        }
    }, [data, lessonId]);

    const handleBack = () => {
        navigation.goBack();
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading lesson...</Text>
            </View>
        );
    }

    if (error || !currentLesson) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    {error ? 'Failed to load course details' : 'Lesson not found'}
                </Text>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {currentLesson.title}
                </Text>
                <View style={styles.headerButton} /> 
            </View>

            {/* Content */}
            <View style={styles.content}>
                {currentLesson.content_type === 'video' && currentLesson.content_url ? (
                    <VideoPlayer
                        url={currentLesson.content_url}
                        thumbnailUrl={currentLesson.thumbnail_url}
                        onComplete={() => {
                            console.log('Video completed');
                            // TODO: Mark lesson as completed
                        }}
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Ionicons 
                            name={currentLesson.content_type === 'pdf' ? 'document-text' : 'alert-circle'} 
                            size={64} 
                            color={colors.textSecondary} 
                        />
                        <Text style={styles.placeholderText}>
                            {currentLesson.content_type === 'pdf' 
                                ? 'This is a PDF lesson. Please view it in the course details.' 
                                : 'Content not available for this lesson type.'}
                        </Text>
                    </View>
                )}

                <View style={styles.lessonDetails}>
                    <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
                    {currentLesson.content_text && (
                        <Text style={styles.lessonDescription}>{currentLesson.content_text}</Text>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: 10,
        color: colors.textSecondary,
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
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#000',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    content: {
        flex: 1,
        backgroundColor: colors.background,
    },
    placeholderContainer: {
        height: Dimensions.get('window').width * (9 / 16),
        backgroundColor: '#f0f0f0',
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
});
