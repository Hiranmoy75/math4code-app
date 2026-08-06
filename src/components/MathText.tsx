import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { parseMathContent, buildMathHtmlDocument } from '../utils/mathBlockParser';

interface MathTextProps {
    content: string;
    style?: StyleProp<ViewStyle | TextStyle>;
    textColor?: string;
    fontSize?: number;
    minHeight?: number;
    isDarkMode?: boolean;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

// Returns true only if the text contains LaTeX or HTML that needs WebView rendering
const hasMathOrHtml = (text: string): boolean => {
    if (!text) return false;
    // Match $...$ , $$...$$, \( \), \[ \], or HTML tags
    return /\$|\\\(|\\\[|\\[a-zA-Z]|<[a-z]/.test(text);
};

export const MathText: React.FC<MathTextProps> = ({
    content,
    style,
    textColor = '#000000',
    fontSize = 16,
    minHeight = 20,
    isDarkMode = false,
    pointerEvents,
}) => {
    // Generate a unique instance ID to filter postMessage events from specific iframe/webview
    const rawId = React.useId();
    const instanceId = React.useMemo(() => 'mt_' + rawId.replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substring(2, 7), [rawId]);

    const isMath = React.useMemo(() => hasMathOrHtml(content || ''), [content]);

    const htmlContent = React.useMemo(() => {
        if (!isMath) return '';
        const parsedBody = parseMathContent(content || '');
        return buildMathHtmlDocument(parsedBody, {
            fontSize,
            textColor,
            isDarkMode,
            backgroundColor: 'transparent',
            instanceId,
        });
    }, [content, fontSize, textColor, isDarkMode, isMath, instanceId]);

    // Start with a sensible initial height; will be overridden by onContentSizeChange
    const initialHeight = Math.max(minHeight, Math.round(fontSize * 1.5));
    const [height, setHeight] = useState<number>(initialHeight);

    // Reset height when content changes so we don't keep stale big heights
    useEffect(() => {
        setHeight(Math.max(minHeight, Math.round(fontSize * 1.5)));
    }, [content, fontSize, minHeight]);

    // Web platform: use postMessage for iframe with instanceId matching
    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const handleWindowMessage = (event: MessageEvent) => {
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    // Only process messages targeting THIS specific MathText instance!
                    if (data && data.id === instanceId && typeof data.height === 'number' && data.height > 0) {
                        setHeight(Math.max(Math.ceil(data.height), minHeight));
                    }
                } catch (e) {
                    // Ignore
                }
            };
            window.addEventListener('message', handleWindowMessage);
            return () => window.removeEventListener('message', handleWindowMessage);
        }
    }, [instanceId, minHeight]);

    // Native Text fast path — no WebView needed
    if (!isMath) {
        return (
            <Text style={[{ fontSize, color: textColor, lineHeight: Math.round(fontSize * 1.45) }, style as StyleProp<TextStyle>]}>
                {content || ''}
            </Text>
        );
    }

    // Web platform iframe path
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, style as StyleProp<ViewStyle>, { height }]} pointerEvents={pointerEvents}>
                {React.createElement('iframe', {
                    srcDoc: htmlContent,
                    style: {
                        width: '100%',
                        height: `${height}px`,
                        border: 'none',
                        backgroundColor: 'transparent',
                        overflow: 'hidden',
                        pointerEvents: pointerEvents || 'auto',
                    },
                })}
            </View>
        );
    }

    const injectedJS = `
        if (typeof sendHeight === 'function') {
            sendHeight();
            setTimeout(sendHeight, 100);
            setTimeout(sendHeight, 350);
        }
        true;
    `;

    return (
        <View style={[styles.container, style as StyleProp<ViewStyle>, { height }]} pointerEvents={pointerEvents}>
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webview}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                pointerEvents={pointerEvents}
                injectedJavaScript={injectedJS}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data && (data.id === instanceId || !data.id) && typeof data.height === 'number' && data.height > 0) {
                            setHeight(Math.max(Math.ceil(data.height), minHeight));
                        }
                    } catch (e) {
                        // Ignore
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
