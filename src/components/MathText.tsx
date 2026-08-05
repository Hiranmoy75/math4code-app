import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { parseMathContent, buildMathHtmlDocument } from '../utils/mathBlockParser';

interface MathTextProps {
    content: string;
    style?: StyleProp<ViewStyle>;
    textColor?: string;
    fontSize?: number;
    minHeight?: number;
    isDarkMode?: boolean;
}

export const MathText: React.FC<MathTextProps> = ({
    content,
    style,
    textColor = '#000000',
    fontSize = 16,
    minHeight = 40,
    isDarkMode = false,
}) => {
    const htmlContent = React.useMemo(() => {
        const parsedBody = parseMathContent(content || '');
        return buildMathHtmlDocument(parsedBody, {
            fontSize,
            textColor,
            isDarkMode,
            backgroundColor: 'transparent',
        });
    }, [content, fontSize, textColor, isDarkMode]);

    const [height, setHeight] = useState<number>(Math.max(minHeight, fontSize * 2.5));

    useEffect(() => {
        setHeight(Math.max(minHeight, fontSize * 2.5));
    }, [content, fontSize, minHeight]);

    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const handleWindowMessage = (event: MessageEvent) => {
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (data && typeof data.height === 'number' && data.height > 0) {
                        setHeight(prev => Math.max(prev, data.height));
                    }
                } catch (e) {
                    // Ignore
                }
            };

            window.addEventListener('message', handleWindowMessage);
            return () => window.removeEventListener('message', handleWindowMessage);
        }
    }, []);

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, style, { height }]}>
                {React.createElement('iframe', {
                    srcDoc: htmlContent,
                    style: {
                        width: '100%',
                        height: `${height}px`,
                        border: 'none',
                        backgroundColor: 'transparent',
                        overflow: 'hidden',
                    },
                })}
            </View>
        );
    }

    return (
        <View style={[styles.container, style, { height }]}>
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={[styles.webview, { backgroundColor: 'transparent' }]}
                scrollEnabled={false}
                onMessage={(event) => {
                    try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.height && data.height > 0) {
                            setHeight(prev => Math.max(prev, data.height));
                        }
                    } catch (e) {
                        // Ignore
                    }
                }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'transparent',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
