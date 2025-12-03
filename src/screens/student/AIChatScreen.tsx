import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { generateResponse } from '../../services/gemini';
import { textStyles } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export const AIChatScreen = () => {
    const navigation = useNavigation();
    const { colors, shadows } = useAppTheme();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm your AI assistant. How can I help you with your coding journey today?",
            sender: 'ai',
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await generateResponse(userMessage.text);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        },
        backButton: {
            padding: spacing.xs,
            marginRight: spacing.sm,
        },
        headerTitle: {
            ...textStyles.h4,
            color: colors.text,
            fontWeight: '700',
        },
        headerSubtitle: {
            ...textStyles.caption,
            color: colors.success,
        },
        chatContainer: {
            flex: 1,
            paddingHorizontal: spacing.md,
        },
        messageBubble: {
            maxWidth: '80%',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.md,
            ...shadows.small,
        },
        userBubble: {
            alignSelf: 'flex-end',
            backgroundColor: colors.primary,
            borderBottomRightRadius: 2,
        },
        aiBubble: {
            alignSelf: 'flex-start',
            backgroundColor: colors.surface,
            borderBottomLeftRadius: 2,
        },
        messageText: {
            ...textStyles.body,
            lineHeight: 22,
        },
        userText: {
            color: colors.textInverse,
        },
        aiText: {
            color: colors.text,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
        },
        input: {
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: borderRadius.full,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            marginRight: spacing.sm,
            color: colors.text,
            maxHeight: 100,
            ...textStyles.body,
        },
        sendButton: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            ...shadows.small,
        },
        sendButtonDisabled: {
            backgroundColor: colors.textDisabled,
        },
        loadingContainer: {
            padding: spacing.md,
            alignItems: 'flex-start',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>AI Assistant</Text>
                    <Text style={styles.headerSubtitle}>● Online</Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                style={styles.chatContainer}
                contentContainerStyle={{ paddingVertical: spacing.md }}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageBubble,
                            item.sender === 'user' ? styles.userBubble : styles.aiBubble,
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                item.sender === 'user' ? styles.userText : styles.aiText,
                            ]}
                        >
                            {item.text}
                        </Text>
                    </View>
                )}
                ListFooterComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : null
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons name="send" size={20} color={colors.textInverse} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
