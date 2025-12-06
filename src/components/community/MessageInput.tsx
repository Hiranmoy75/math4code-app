import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Text,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, borderRadius } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useCourseUsers } from '../../hooks/useCourseUsers';

interface MessageInputProps {
    onSend: (content: string) => void;
    isSending: boolean;
    disabled?: boolean;
    courseId: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    isSending,
    disabled = false,
    courseId,
}) => {
    const { colors } = useAppTheme();
    const [message, setMessage] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<TextInput>(null);

    const { data: courseUsers = [] } = useCourseUsers(courseId);

    // Detect @ mentions
    useEffect(() => {
        const textBeforeCursor = message.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if there's no space after @
            if (!textAfterAt.includes(' ')) {
                setMentionSearch(textAfterAt.toLowerCase());
                setShowMentions(true);
                return;
            }
        }

        setShowMentions(false);
        setMentionSearch('');
    }, [message, cursorPosition]);

    // Filter users based on search
    const filteredUsers = courseUsers.filter(user =>
        user.full_name?.toLowerCase().includes(mentionSearch)
    );

    const handleMentionSelect = (userName: string) => {
        const textBeforeCursor = message.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const beforeMention = message.substring(0, lastAtIndex);
            const afterCursor = message.substring(cursorPosition);
            const newMessage = `${beforeMention}@${userName} ${afterCursor}`;
            setMessage(newMessage);
            setShowMentions(false);

            // Focus back on input
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const handleSend = () => {
        if (message.trim() && !isSending) {
            onSend(message.trim());
            setMessage('');
            setShowMentions(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        mentionsContainer: {
            maxHeight: 200,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        mentionItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            gap: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        mentionAvatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
        },
        mentionAvatarImage: {
            width: 32,
            height: 32,
            borderRadius: 16,
        },
        mentionAvatarText: {
            ...textStyles.caption,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        mentionName: {
            ...textStyles.body,
            color: colors.text,
            fontWeight: '500',
        },
        inputRow: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            gap: spacing.sm,
        },
        inputContainer: {
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            maxHeight: 100,
        },
        input: {
            ...textStyles.body,
            color: colors.text,
            minHeight: 40,
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        sendButtonDisabled: {
            backgroundColor: colors.border,
        },
        emptyMentions: {
            padding: spacing.md,
            alignItems: 'center',
        },
        emptyText: {
            ...textStyles.caption,
            color: colors.textSecondary,
        },
    });

    const canSend = message.trim().length > 0 && !isSending && !disabled;

    return (
        <View style={styles.container}>
            {/* Mentions Autocomplete */}
            {showMentions && (
                <View style={styles.mentionsContainer}>
                    {filteredUsers.length > 0 ? (
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.mentionItem}
                                    onPress={() => handleMentionSelect(item.full_name || 'User')}
                                >
                                    <View style={styles.mentionAvatar}>
                                        {item.avatar_url ? (
                                            <Image
                                                source={{ uri: item.avatar_url }}
                                                style={styles.mentionAvatarImage}
                                            />
                                        ) : (
                                            <Text style={styles.mentionAvatarText}>
                                                {(item.full_name || 'U')[0].toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.mentionName}>{item.full_name}</Text>
                                </TouchableOpacity>
                            )}
                            keyboardShouldPersistTaps="handled"
                        />
                    ) : (
                        <View style={styles.emptyMentions}>
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Input Row */}
            <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={message}
                        onChangeText={setMessage}
                        onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
                        placeholder="Type a message... (use @ to mention)"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        maxLength={2000}
                        editable={!disabled}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!canSend}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                        <Ionicons
                            name="send"
                            size={20}
                            color={canSend ? colors.textInverse : colors.textSecondary}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};
