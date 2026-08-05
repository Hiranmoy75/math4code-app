import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { feedbackService } from '../../services/feedback';
import Toast from 'react-native-toast-message';

export const HelpSupportScreen = () => {
    const navigation = useNavigation();
    const { colors, shadows } = useAppTheme();
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const faqs = [
        {
            question: 'How do I enroll in a course?',
            answer: 'Browse courses from the Courses tab, select a course, and click the "Enroll" or "Buy Now" button. For free courses, you\'ll be enrolled immediately. For paid courses, complete the payment process.',
        },
        {
            question: 'How do I track my progress?',
            answer: 'Your progress is automatically tracked as you complete lessons. View your overall progress in the Library tab or on individual course pages.',
        },
        {
            question: 'Can I download course materials?',
            answer: 'Yes, downloadable materials like PDFs can be saved for offline viewing. Look for the download icon on lesson pages.',
        },
        {
            question: 'How do streaks work?',
            answer: 'Maintain your streak by logging in daily and completing at least one activity. Your current and longest streaks are displayed on your profile.',
        },
        {
            question: 'What are coins and XP?',
            answer: 'Coins and XP are virtual rewards earned by completing courses, quizzes, and daily activities. They help you level up, climb the leaderboard, and unlock badges. Note: These are for gamification only and cannot be exchanged for real money or used to purchase courses.',
        },
    ];

    const contactOptions = [
        {
            icon: 'mail',
            label: 'Email Support',
            description: 'support@math4code.com',
            action: () => Linking.openURL('mailto:support@math4code.com'),
        },
        {
            icon: 'logo-whatsapp',
            label: 'WhatsApp',
            description: '+91 62975 34924',
            action: () => Linking.openURL('whatsapp://send?phone=916297534924'),
        },
        {
            icon: 'call',
            label: 'Phone Support',
            description: '+91 62975 34924',
            action: () => Linking.openURL('tel:+916297534924'),
        },
    ];

    const handleSubmitFeedback = async () => {
        if (!feedbackText.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Empty Feedback',
                text2: 'Please enter your feedback before submitting',
            });
            return;
        }

        setIsSubmittingFeedback(true);
        try {
            const result = await feedbackService.submitFeedback({
                message: feedbackText.trim(),
                category: 'general',
            });

            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Thank you!',
                    text2: 'Your feedback has been submitted successfully',
                    visibilityTime: 3000,
                });
                setFeedbackText('');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Submission Failed',
                    text2: result.error || 'Please try again later',
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to submit feedback. Please try again.',
            });
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleOpenUserGuide = () => {
        navigation.navigate('UserGuide' as never);
    };

    const handleOpenTutorials = () => {
        // Open Math4Code YouTube channel or tutorials page
        Linking.openURL('https://www.youtube.com/@MathForCode').catch(() => {
            Toast.show({
                type: 'info',
                text1: 'Tutorials',
                text2: 'Visit www.math4code.com for video tutorials',
            });
        });
    };

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
        },
        content: {
            flex: 1,
        },
        section: {
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        sectionTitle: {
            ...textStyles.h4,
            color: colors.text,
            marginBottom: spacing.md,
            fontWeight: '700',
        },
        quickActions: {
            flexDirection: 'row',
            gap: spacing.sm,
        },
        quickActionCard: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            alignItems: 'center',
            gap: spacing.xs,
            ...shadows.small,
        },
        quickActionText: {
            ...textStyles.caption,
            color: colors.text,
            fontWeight: '600',
            textAlign: 'center',
        },
        faqItem: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.small,
        },
        faqHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        faqQuestion: {
            ...textStyles.body,
            color: colors.text,
            fontWeight: '600',
            flex: 1,
        },
        faqAnswer: {
            ...textStyles.bodySmall,
            color: colors.textSecondary,
            marginTop: spacing.sm,
            lineHeight: 20,
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            gap: spacing.md,
            ...shadows.small,
        },
        contactIcon: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primaryLight + '20',
            alignItems: 'center',
            justifyContent: 'center',
        },
        contactInfo: {
            flex: 1,
        },
        contactLabel: {
            ...textStyles.body,
            color: colors.text,
            fontWeight: '600',
        },
        contactDescription: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
        feedbackForm: {
            gap: spacing.md,
        },
        feedbackInput: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            ...textStyles.body,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 120,
            textAlignVertical: 'top',
        },
        submitButton: {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            alignItems: 'center',
            ...shadows.medium,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing.sm,
        },
        submitButtonDisabled: {
            opacity: 0.6,
        },
        submitButtonText: {
            ...textStyles.body,
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
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How can we help?</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickActionCard}
                            onPress={handleOpenUserGuide}
                        >
                            <Ionicons name="book" size={32} color={colors.primary} />
                            <Text style={styles.quickActionText}>User Guide</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionCard}
                            onPress={handleOpenTutorials}
                        >
                            <Ionicons name="videocam" size={32} color={colors.primary} />
                            <Text style={styles.quickActionText}>Tutorials</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickActionCard}
                            onPress={() => navigation.navigate('AIChat' as never)}
                        >
                            <Ionicons name="chatbubbles" size={32} color={colors.primary} />
                            <Text style={styles.quickActionText}>Live Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    {faqs.map((faq, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.faqItem}
                            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </View>
                            {expandedFaq === index && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Contact Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Support</Text>
                    {contactOptions.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.contactItem}
                            onPress={option.action}
                        >
                            <View style={styles.contactIcon}>
                                <Ionicons name={option.icon as any} size={24} color={colors.primary} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>{option.label}</Text>
                                <Text style={styles.contactDescription}>{option.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Feedback Form */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Send Feedback</Text>
                    <View style={styles.feedbackForm}>
                        <TextInput
                            style={styles.feedbackInput}
                            placeholder="Tell us what you think..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            editable={!isSubmittingFeedback}
                        />
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                isSubmittingFeedback && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmitFeedback}
                            disabled={isSubmittingFeedback}
                        >
                            {isSubmittingFeedback ? (
                                <>
                                    <ActivityIndicator color={colors.textInverse} size="small" />
                                    <Text style={styles.submitButtonText}>Submitting...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="send" size={18} color={colors.textInverse} />
                                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Business Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Business Details</Text>
                    <View style={styles.contactItem}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="business" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Math4Code (HIRANMOY MANDAL)</Text>
                            <Text style={styles.contactDescription}>Registered Business Name</Text>
                        </View>
                    </View>
                    <View style={styles.contactItem}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="location" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Kolkata, 700049</Text>
                            <Text style={styles.contactDescription}>Registered Location</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};
