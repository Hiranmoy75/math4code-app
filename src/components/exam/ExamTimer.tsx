import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';

interface ExamTimerProps {
    timeLeft: number;
    totalDuration?: number;
}

export const ExamTimer = ({ timeLeft }: ExamTimerProps) => {
    const { colors } = useAppTheme();
    const [hasStarted, setHasStarted] = useState(false);

    // Mark as started once we get a positive time value
    useEffect(() => {
        if (timeLeft > 0 && !hasStarted) {
            setHasStarted(true);
        }
    }, [timeLeft, hasStarted]);

    const formatTime = (seconds: number) => {
        // Handle invalid or zero time
        if (seconds <= 0 || isNaN(seconds)) {
            return '00:00';
        }

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        // Always show at least MM:SS format
        if (h > 0) {
            return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const isWarning = timeLeft < 300; // Less than 5 mins
    const isCritical = timeLeft < 60; // Less than 1 min

    // Only hide during initial load (before exam has started)
    // Once exam starts (hasStarted = true), always show timer even if time is 0
    if (!hasStarted && timeLeft <= 0) {
        return null;
    }

    return (
        <View style={[
            styles.container,
            { backgroundColor: isCritical ? colors.error : (isWarning ? colors.warning : colors.primary) }
        ]}>
            <Ionicons name="time-outline" size={16} color="#FFF" />
            <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm + 4,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    timeText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    }
});
