import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MathTextProps {
    content: string;
    style?: StyleProp<ViewStyle>;
    textColor?: string;
    fontSize?: number;
}

export const MathText: React.FC<MathTextProps> = ({
    content,
    style,
    textColor = '#000000',
    fontSize = 16
}) => {
    // KaTeX HTML Template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
            <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
                onload="renderMathInElement(document.body);"></script>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-size: ${fontSize}px;
                    color: ${textColor};
                    background-color: transparent;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                }
                .katex { font-size: 1.1em; }
            </style>
        </head>
        <body>
            <div id="content">${content}</div>
            <script>
                function sendHeight() {
                    const height = document.body.scrollHeight;
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
                    } else {
                        window.parent.postMessage(JSON.stringify({ height, type: 'mathHeight' }), '*');
                    }
                }
                window.onload = sendHeight;
                new ResizeObserver(sendHeight).observe(document.body);
            </script>
        </body>
        </html>
    `;

    const [height, setHeight] = React.useState(fontSize * 3);

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, style, { height }]}>
                {React.createElement('iframe', {
                    srcDoc: htmlContent,
                    style: {
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        overflow: 'hidden'
                    },
                    scrolling: "no"
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
                        if (data.height) {
                            setHeight(data.height);
                        }
                    } catch (e) {
                        // Ignore
                    }
                }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
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
