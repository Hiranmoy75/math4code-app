import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';

const { width } = Dimensions.get('window');

const SkeletonItem = ({ style }: { style: any }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.skeleton, style, { opacity }]} />
    );
};

export const HomeSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Header Skeleton */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <SkeletonItem style={styles.avatar} />
                    <View style={styles.headerIcons}>
                        <SkeletonItem style={styles.icon} />
                        <SkeletonItem style={styles.icon} />
                    </View>
                </View>
            </View>

            {/* Welcome Text */}
            <View style={styles.section}>
                <SkeletonItem style={styles.title} />
                <SkeletonItem style={styles.subtitle} />
            </View>

            {/* Continue Learning Skeleton */}
            <View style={styles.section}>
                <SkeletonItem style={styles.sectionTitle} />
                <View style={styles.horizontalList}>
                    <SkeletonItem style={styles.enrolledCard} />
                    <SkeletonItem style={styles.enrolledCard} />
                </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
                <SkeletonItem style={styles.sectionTitle} />
                <View style={styles.categoryRow}>
                    <SkeletonItem style={styles.categoryChip} />
                    <SkeletonItem style={styles.categoryChip} />
                    <SkeletonItem style={styles.categoryChip} />
                </View>
            </View>

            {/* Popular Courses */}
            <View style={styles.section}>
                <SkeletonItem style={styles.sectionTitle} />
                <View style={styles.horizontalList}>
                    <SkeletonItem style={styles.courseCard} />
                    <SkeletonItem style={styles.courseCard} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    skeleton: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden',
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.background,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    icon: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    section: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    title: {
        width: 200,
        height: 32,
        borderRadius: 8,
        marginBottom: 8,
    },
    subtitle: {
        width: 150,
        height: 24,
        borderRadius: 8,
    },
    sectionTitle: {
        width: 140,
        height: 20,
        borderRadius: 4,
        marginBottom: spacing.md,
    },
    horizontalList: {
        flexDirection: 'row',
        gap: spacing.md,
        overflow: 'hidden',
    },
    enrolledCard: {
        width: 280,
        height: 80,
        borderRadius: borderRadius.xl,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    categoryChip: {
        width: 100,
        height: 36,
        borderRadius: borderRadius.full,
    },
    courseCard: {
        width: 220,
        height: 200,
        borderRadius: borderRadius.xl,
    },
});
