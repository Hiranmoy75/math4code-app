import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MathTextProps {
    content: string;
    style?: StyleProp<ViewStyle>;
    textColor?: string;
    fontSize?: number;
    minHeight?: number;
}

export const MathText: React.FC<MathTextProps> = ({
    content,
    style,
    textColor = '#000000',
    fontSize = 16,
    minHeight = 40
}) => {
    // KaTeX HTML Template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
            <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-size: ${fontSize}px;
                    color: ${textColor};
                    background-color: transparent;
                    line-height: 1.4;
                }
                #content {
                    width: 100%;
                    overflow: visible;
                }
                .katex { font-size: 1.1em; }
                .katex-display { margin: 0.3em 0; }
            </style>
        </head>
        <body>
            <div id="content">${content}</div>
            <script>
                function renderMath() {
                    try {
                        renderMathInElement(document.body, {
                            delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '$', right: '$', display: false},
                                {left: '\\\\[', right: '\\\\]', display: true},
                                {left: '\\\\(', right: '\\\\)', display: false}
                            ],
                            throwOnError: false,
                            trust: true
                        });
                        // Send height after rendering
                        setTimeout(sendHeight, 50);
                        setTimeout(sendHeight, 200);
                    } catch (e) {
                        console.error('KaTeX render error:', e);
                        sendHeight();
                    }
                }
                
                function sendHeight() {
                    const contentDiv = document.getElementById('content');
                    if (!contentDiv) return;

                    // Get precise height including fractional pixels
                    const rect = contentDiv.getBoundingClientRect();
                    let height = rect.height;

                    // Double check with scrollHeight in case of overflow/wrapping issues
                    height = Math.max(height, contentDiv.scrollHeight, document.body.scrollHeight);

                    // Add robust buffer for correct anti-aliasing and margins (20px)
                    // This explicitly prevents the bottom of valid text from being cut off
                    height = Math.ceil(height + 20);
                    
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
                    } else {
                        window.parent.postMessage(JSON.stringify({ height, type: 'mathHeight' }), '*');
                    }
                }
                
                // Wait for KaTeX to load, then render
                if (typeof renderMathInElement !== 'undefined') {
                    renderMath();
                } else {
                    window.addEventListener('load', renderMath);
                }
                
                // Observe for content changes (content size)
                new ResizeObserver(sendHeight).observe(document.body);
                // Listen for window resize (wrapping changes)
                window.addEventListener('resize', sendHeight);
            </script>
        </body>
        </html>
    `;

    const [height, setHeight] = React.useState(Math.max(minHeight, fontSize * 2.5)); // Reduced initial height

    // Reset height when content changes to prevent stale height from previous content
    React.useEffect(() => {
        setHeight(fontSize * 2.5);
    }, [content, fontSize]);

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
                        if (data.height && data.height > 0) {
                            // Use exact height without extra padding
                            setHeight(data.height);
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
