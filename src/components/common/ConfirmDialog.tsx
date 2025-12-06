import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    icon?: string;
    iconColor?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor,
    icon = 'alert-circle',
    iconColor,
    onConfirm,
    onCancel,
}) => {
    const { colors, shadows } = useAppTheme();
    const finalConfirmColor = confirmColor || colors.error;
    const finalIconColor = iconColor || colors.error;

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
        },
        dialog: {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            width: '100%',
            maxWidth: Platform.OS === 'web' ? 400 : undefined,
            ...shadows.large,
        },
        iconContainer: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: finalIconColor + '20',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: spacing.lg,
        },
        title: {
            ...textStyles.h3,
            color: colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
            fontWeight: '700',
        },
        message: {
            ...textStyles.body,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
            lineHeight: 22,
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: spacing.md,
        },
        button: {
            flex: 1,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cancelButton: {
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: colors.border,
        },
        confirmButton: {
            backgroundColor: finalConfirmColor,
        },
        cancelButtonText: {
            ...textStyles.button,
            color: colors.text,
            fontWeight: '600',
        },
        confirmButtonText: {
            ...textStyles.button,
            color: colors.textInverse,
            fontWeight: '700',
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onCancel}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.dialog}>
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={icon as any}
                                size={32}
                                color={finalIconColor}
                            />
                        </View>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={onConfirm}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};
