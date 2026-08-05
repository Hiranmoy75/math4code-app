import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { StatusBar } from 'react-native';

interface GuideSection {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    steps: string[];
}

export const UserGuideScreen = () => {
    const navigation = useNavigation();
    const { colors, shadows } = useAppTheme();

    const guideSections: GuideSection[] = [
        {
            icon: 'school',
            title: 'Getting Started',
            description: 'Learn how to navigate and use the Math4Code app',
            steps: [
                'Browse available courses from the Courses tab',
                'View course details, curriculum, and pricing',
                'Enroll in free courses or purchase paid courses',
                'Access your enrolled courses from the Library tab',
            ],
        },
        {
            icon: 'book',
            title: 'Taking Courses',
            description: 'How to learn effectively with our platform',
            steps: [
                'Open a course from your Library',
                'Follow the sequential lesson structure',
                'Watch video lessons and read PDF materials',
                'Complete quizzes to test your knowledge',
                'Track your progress on the course page',
            ],
        },
        {
            icon: 'clipboard',
            title: 'Exams & Assessments',
            description: 'Understanding the exam system',
            steps: [
                'Exams appear as lessons in your course',
                'Read the exam instructions carefully',
                'Answer all questions within the time limit',
                'Submit your exam when complete',
                'View your results and detailed analysis',
            ],
        },
        {
            icon: 'trophy',
            title: 'Rewards & Gamification',
            description: 'Earn rewards and track your achievements',
            steps: [
                'Complete lessons and exams to earn XP and coins',
                'Maintain daily streaks by logging in every day',
                'Complete daily missions for bonus rewards',
                'Unlock badges for achievements',
                'Compete on the leaderboard with other students',
                '⚠️ Note: Coins and XP are virtual rewards for gamification only - they cannot be exchanged for real money or used to purchase courses',
            ],
        },
        {
            icon: 'card',
            title: 'Payments',
            description: 'How to purchase courses',
            steps: [
                'Select a paid course you want to enroll in',
                'Click "Buy Now" and choose your payment method',
                'Complete payment in the secure browser window',
                'Verify payment status after completion',
                'Access your course immediately after enrollment',
            ],
        },
        {
            icon: 'people',
            title: 'Community',
            description: 'Connect with instructors and peers',
            steps: [
                'Access community channels for enrolled courses',
                'Ask questions and participate in discussions',
                'Get help from instructors and fellow students',
                'Share your learning progress and insights',
            ],
        },
        {
            icon: 'chatbubbles',
            title: 'AI Assistant',
            description: 'Get instant help with AI',
            steps: [
                'Access AI Chat from Help & Support',
                'Ask coding questions or get explanations',
                'Get instant responses powered by AI',
                'Use it as your 24/7 learning companion',
            ],
        },
        {
            icon: 'help-circle',
            title: 'Getting Help',
            description: 'Support options available to you',
            steps: [
                'Visit Help & Support from the Profile tab',
                'Browse FAQs for common questions',
                'Contact support via email, WhatsApp, or phone',
                'Submit feedback to help us improve',
            ],
        },
    ];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        },
        backButton: {
            padding: spacing.xs,
        },
        headerTitle: {
            ...textStyles.h3,
            color: colors.text,
            fontWeight: '700',
        },
        content: {
            flex: 1,
        },
        introSection: {
            padding: spacing.lg,
            backgroundColor: colors.primaryLight + '20',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        introTitle: {
            ...textStyles.h3,
            color: colors.text,
            marginBottom: spacing.sm,
            fontWeight: '700',
        },
        introText: {
            ...textStyles.body,
            color: colors.textSecondary,
            lineHeight: 22,
        },
        sectionCard: {
            backgroundColor: colors.surface,
            marginHorizontal: spacing.md,
            marginTop: spacing.md,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            ...shadows.medium,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primaryLight + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
        },
        sectionTitleContainer: {
            flex: 1,
        },
        sectionTitle: {
            ...textStyles.h4,
            color: colors.text,
            fontWeight: '700',
            marginBottom: 4,
        },
        sectionDescription: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        stepsList: {
            gap: spacing.sm,
        },
        stepItem: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        stepNumber: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.sm,
            marginTop: 2,
        },
        stepNumberText: {
            ...textStyles.caption,
            color: colors.textInverse,
            fontWeight: '700',
            fontSize: 12,
        },
        stepText: {
            ...textStyles.body,
            color: colors.text,
            flex: 1,
            lineHeight: 22,
        },
        footer: {
            padding: spacing.lg,
            alignItems: 'center',
        },
        footerText: {
            ...textStyles.body,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.md,
        },
        supportButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.full,
            ...shadows.medium,
        },
        supportButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
            fontWeight: '700',
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Guide</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Introduction */}
                <View style={styles.introSection}>
                    <Text style={styles.introTitle}>Welcome to Math4Code! 👋</Text>
                    <Text style={styles.introText}>
                        This guide will help you get the most out of your learning experience.
                        Follow these sections to master the platform and achieve your coding goals.
                    </Text>
                </View>

                {/* Guide Sections */}
                {guideSections.map((section, index) => (
                    <View key={index} style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name={section.icon} size={24} color={colors.primary} />
                            </View>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <Text style={styles.sectionDescription}>{section.description}</Text>
                            </View>
                        </View>

                        <View style={styles.stepsList}>
                            {section.steps.map((step, stepIndex) => (
                                <View key={stepIndex} style={styles.stepItem}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                                    </View>
                                    <Text style={styles.stepText}>{step}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Still have questions? Our support team is here to help!
                    </Text>
                    <TouchableOpacity
                        style={styles.supportButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.supportButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};
