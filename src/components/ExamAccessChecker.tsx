import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../hooks/useAppTheme';
import { textStyles } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';

export interface ExamAccessStatus {
    accessible: boolean;
    reason?: 'upcoming' | 'expired' | 'prerequisite' | 'accessible';
    message?: string;
    startTime?: Date;
    endTime?: Date;
    prerequisiteTitle?: string;
}

interface ExamAccessCheckerProps {
    status: ExamAccessStatus;
    onStartExam?: () => void;
}

interface TimeUnit {
    value: number;
    label: string;
}

export const ExamAccessChecker: React.FC<ExamAccessCheckerProps> = ({ status, onStartExam }) => {
    const { colors } = useAppTheme();
    const [timeUnits, setTimeUnits] = useState<TimeUnit[]>([
        { value: 0, label: 'DAYS' },
        { value: 0, label: 'HOURS' },
        { value: 0, label: 'MINUTES' },
        { value: 0, label: 'SECONDS' }
    ]);

    // Countdown timer for upcoming exams
    useEffect(() => {
        if (status.reason === 'upcoming' && status.startTime) {
            const updateCountdown = () => {
                const now = new Date();
                const diff = status.startTime!.getTime() - now.getTime();

                if (diff <= 0) {
                    setTimeUnits([
                        { value: 0, label: 'DAYS' },
                        { value: 0, label: 'HOURS' },
                        { value: 0, label: 'MINUTES' },
                        { value: 0, label: 'SECONDS' }
                    ]);
                    return;
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeUnits([
                    { value: days, label: 'DAYS' },
                    { value: hours, label: 'HOURS' },
                    { value: minutes, label: 'MINUTES' },
                    { value: seconds, label: 'SECONDS' }
                ]);
            };

            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);
            return () => clearInterval(interval);
        }
    }, [status.reason, status.startTime]);

    const TimeUnitBox = ({ value, label }: TimeUnit) => (
        <View style={styles.timeUnitBox}>
            <LinearGradient
                colors={[colors.primary + '15', colors.primary + '05']}
                style={styles.timeUnitGradient}
            >
                <Text style={styles.timeUnitValue}>{String(value).padStart(2, '0')}</Text>
                <Text style={styles.timeUnitLabel}>{label}</Text>
            </LinearGradient>
        </View>
    );

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
            backgroundColor: colors.background,
        },
        card: {
            width: '100%',
            maxWidth: 450,
            backgroundColor: colors.surface,
            borderRadius: borderRadius['2xl'],
            padding: spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 8,
        },
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            marginBottom: spacing.lg,
            gap: spacing.xs,
            borderWidth: 1.5,
        },
        badgeText: {
            ...textStyles.caption,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontSize: 11,
        },
        title: {
            ...textStyles.h2,
            textAlign: 'center',
            marginBottom: spacing.sm,
            color: colors.text,
            fontWeight: '700',
        },
        message: {
            ...textStyles.body,
            textAlign: 'center',
            color: colors.textSecondary,
            marginBottom: spacing.xl,
            lineHeight: 22,
        },
        countdownContainer: {
            backgroundColor: colors.background,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: colors.primary + '20',
        },
        countdownLabel: {
            ...textStyles.caption,
            textAlign: 'center',
            color: colors.primary,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.lg,
            fontSize: 12,
        },
        timeUnitsRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            gap: spacing.sm,
        },
        timeUnitBox: {
            flex: 1,
            aspectRatio: 1,
            maxWidth: 80,
        },
        timeUnitGradient: {
            flex: 1,
            borderRadius: borderRadius.lg,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.primary + '30',
            padding: spacing.sm,
        },
        timeUnitValue: {
            fontSize: 32,
            fontWeight: '900',
            color: colors.primary,
            marginBottom: spacing.xs,
        },
        timeUnitLabel: {
            fontSize: 9,
            fontWeight: '700',
            color: colors.primary,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
        },
        detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.sm,
            gap: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
        },
        detailLabel: {
            ...textStyles.caption,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            fontWeight: '700',
            fontSize: 10,
            letterSpacing: 0.8,
            marginBottom: 2,
        },
        detailValue: {
            ...textStyles.body,
            color: colors.text,
            fontWeight: '600',
            fontSize: 14,
        },
        button: {
            backgroundColor: colors.primary,
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing.xs,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        buttonDisabled: {
            backgroundColor: colors.textDisabled,
            shadowOpacity: 0,
        },
        buttonText: {
            ...textStyles.button,
            color: colors.textInverse,
            fontWeight: '700',
        },
        iconContainer: {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: spacing.lg,
            borderWidth: 2,
            borderColor: colors.border,
        },
        unlockText: {
            textAlign: 'center',
            marginTop: spacing.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.background,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.primary + '20',
        },
    });

    // Ready to Start State
    if (status.accessible) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={[styles.badge, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        <Text style={[styles.badgeText, { color: colors.success }]}>READY TO START</Text>
                    </View>

                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={36} color={colors.success} />
                    </View>

                    <Text style={styles.title}>Exam is Ready</Text>
                    <Text style={styles.message}>
                        You may now start the examination. Make sure you have a stable internet connection.
                    </Text>

                    {onStartExam && (
                        <TouchableOpacity style={styles.button} onPress={onStartExam}>
                            <Ionicons name="play-circle" size={20} color={colors.textInverse} />
                            <Text style={styles.buttonText}>Start Exam Now</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // Upcoming exam
    if (status.reason === 'upcoming') {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={[styles.badge, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                        <Ionicons name="time-outline" size={16} color={colors.warning} />
                        <Text style={[styles.badgeText, { color: colors.warning }]}>ACCESS RESTRICTED</Text>
                    </View>

                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={36} color={colors.warning} />
                    </View>

                    <Text style={styles.title}>Exam Not Yet Started</Text>
                    <Text style={styles.message}>{status.message}</Text>

                    <View style={styles.countdownContainer}>
                        <Text style={styles.countdownLabel}>LAUNCH SEQUENCE IN</Text>
                        <View style={styles.timeUnitsRow}>
                            {timeUnits.map((unit, index) => (
                                unit.value > 0 || index >= 2 ? <TimeUnitBox key={unit.label} {...unit} /> : null
                            ))}
                        </View>
                    </View>

                    {status.startTime && (
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>SCHEDULED DATE</Text>
                                <Text style={styles.detailValue}>
                                    {status.startTime.toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.detailLabel}>ENVIRONMENT</Text>
                            <Text style={styles.detailValue}>Secure Portal</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled>
                        <Ionicons name="lock-closed" size={18} color={colors.textInverse} />
                        <Text style={styles.buttonText}>Awaiting Scheduled Start</Text>
                    </TouchableOpacity>

                    <View style={styles.unlockText}>
                        <Text style={styles.detailLabel}>
                            🔓 UNLOCKS AT {status.startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    // Expired exam
    if (status.reason === 'expired') {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={[styles.badge, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                        <Ionicons name="alert-circle" size={16} color={colors.error} />
                        <Text style={[styles.badgeText, { color: colors.error }]}>EXPIRED</Text>
                    </View>

                    <View style={styles.iconContainer}>
                        <Ionicons name="close-circle" size={36} color={colors.error} />
                    </View>

                    <Text style={styles.title}>Exam Has Ended</Text>
                    <Text style={styles.message}>
                        {status.message || 'This examination period has concluded and is no longer accepting submissions.'}
                    </Text>

                    {status.endTime && (
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={22} color={colors.error} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>ENDED ON</Text>
                                <Text style={styles.detailValue}>
                                    {status.endTime.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled>
                        <Text style={styles.buttonText}>Exam Closed</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Prerequisite locked
    if (status.reason === 'prerequisite') {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={[styles.badge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                        <Ionicons name="lock-closed" size={16} color={colors.primary} />
                        <Text style={[styles.badgeText, { color: colors.primary }]}>LOCKED</Text>
                    </View>

                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={36} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>Access Locked</Text>
                    <Text style={styles.message}>
                        {status.message || 'You must complete the prerequisite assessment to unlock this exam.'}
                    </Text>

                    {status.prerequisiteTitle && (
                        <View style={styles.detailRow}>
                            <Ionicons name="book-outline" size={22} color={colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>REQUIRED TASK</Text>
                                <Text style={styles.detailValue}>{status.prerequisiteTitle}</Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled>
                        <Text style={styles.buttonText}>Complete Task First</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Default locked state
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-closed" size={36} color={colors.textSecondary} />
                </View>

                <Text style={styles.title}>Exam Locked</Text>
                <Text style={styles.message}>
                    {status.message || 'This exam is currently not accessible.'}
                </Text>

                <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled>
                    <Text style={styles.buttonText}>Exam Locked</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
