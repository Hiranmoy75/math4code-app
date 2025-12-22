import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to my Academy',
        description: 'Boost your technical and practical skills through online learning.',
        icon: 'school-outline',
        color: '#E0F2FE', // Light Blue bg
        iconColor: '#0284C7',
    },
    {
        id: '2',
        title: 'Learn workplace and soft skills',
        description: 'Get the skills you need to thrive in your career. Aim higher with online learning.',
        icon: 'briefcase-outline',
        color: '#F0F9FF', // Lighter Blue
        iconColor: '#0EA5E9',
    },
    {
        id: '3',
        title: 'Learn through visuals',
        description: 'Learn from interactive audio visual sessions and gain expert knowledge online.',
        icon: 'play-circle-outline',
        color: '#F0FDFA', // Light Teal
        iconColor: '#14B8A6',
    }
];

export const OnboardingScreen = ({ onFinish }: { onFinish: () => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
        } else {
            // Finish onboarding
            await AsyncStorage.setItem('hasOnboarded', 'true');
            onFinish();
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        onFinish();
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        return (
            <View style={styles.slide}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>

                <View style={[styles.imageContainer, { backgroundColor: 'transparent' }]}>
                    {/* Placeholder for the illustration - Using Icon for now */}
                    <View style={[styles.iconPlaceholder, { backgroundColor: item.color }]}>
                        <Ionicons name={item.icon as any} size={120} color={item.iconColor} />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
            />

            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.activeDot
                            ]}
                        />
                    ))}
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                        {currentIndex === SLIDES.length - 1 ? (
                            <Text style={styles.nextText}>Get Started</Text>
                        ) : (
                            <Ionicons name="arrow-forward" size={24} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Force white background
    },
    slide: {
        width,
        alignItems: 'center',
        paddingTop: height * 0.1, // Start text higher up
        paddingHorizontal: spacing.xl,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937', // Dark gray
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6B7280', // Medium gray
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: spacing.sm,
    },
    imageContainer: {
        width: width * 0.9,
        height: height * 0.45, // Allocate significant space for image
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    iconPlaceholder: {
        width: width * 0.8,
        height: width * 0.7,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.xl,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB', // Light gray
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: colors.primary,
        width: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
    },
    skipButton: {
        padding: spacing.md,
    },
    skipText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: colors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        // If it's "Get Started", we might want a wider button, logic handled in render
        minWidth: 50,
        paddingHorizontal: 0,
    },
    nextText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        paddingHorizontal: 12,
    },
});
