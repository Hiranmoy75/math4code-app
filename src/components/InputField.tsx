import React from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { colors } from '../constants/colors';
import { textStyles, fontSizes } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';

interface InputFieldProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    error,
    icon,
    containerStyle,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error && styles.inputError]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={[styles.input, icon && styles.inputWithIcon]}
                    placeholderTextColor={colors.textTertiary}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.base,
    },
    label: {
        ...textStyles.bodySmall,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.base,
    },
    inputError: {
        borderColor: colors.error,
    },
    iconContainer: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: fontSizes.base,
        color: colors.text,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    errorText: {
        ...textStyles.caption,
        color: colors.error,
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
    },
});
