import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius } from '../constants/spacing';

const { width } = Dimensions.get('window');

interface HomeBannerProps {
    title: string;
    subtitle: string;
    ctaText?: string;
    discountText?: string;
    discountPercent?: string;
    gradientColors: string[];
    themeColor: string;
    onPress?: () => void;
}

export const HomeBanner = ({
    title,
    subtitle,
    ctaText = 'Buy now',
    discountText = 'Flat',
    discountPercent = '50% OFF',
    gradientColors,
    themeColor,
    onPress
}: HomeBannerProps) => {
    const navigation = useNavigation<any>();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('AllCourses');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: themeColor }]}
                            activeOpacity={0.8}
                            onPress={handlePress}
                        >
                            <Text style={styles.buttonText}>{ctaText}</Text>
                            <Ionicons name="play-circle" size={16} color="white" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Decorative Shapes */}
                    <View style={styles.decorationContainer}>
                        <View style={[styles.blueShape, { backgroundColor: themeColor, shadowColor: themeColor }]}>
                            <Text style={styles.discountText}>{discountText}</Text>
                            <Text style={styles.discountPercent}>{discountPercent}</Text>
                        </View>
                        <View style={styles.yellowCircle} />
                        <View style={styles.dottedPattern} />
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width - (spacing.lg * 2), // Full width minus padding
        marginRight: spacing.md, // Spacing between items
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        height: 180,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    gradient: {
        flex: 1,
        padding: spacing.lg,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
    },
    textContainer: {
        zIndex: 10,
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#333',
        marginBottom: spacing.md,
        lineHeight: 22,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    buttonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    decorationContainer: {
        position: 'absolute',
        right: -20,
        top: -20,
        width: 180,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blueShape: {
        width: 120,
        height: 120,
        borderRadius: 30,
        transform: [{ rotate: '45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 2,
    },
    discountText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        transform: [{ rotate: '-45deg' }],
    },
    discountPercent: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        transform: [{ rotate: '-45deg' }],
    },
    yellowCircle: {
        position: 'absolute',
        bottom: 40,
        left: 30,
        width: 40,
        height: 40,
        backgroundColor: '#FACC15',
        borderRadius: 20,
        zIndex: 3,
    },
    dottedPattern: {
        position: 'absolute',
        bottom: 20,
        right: 40,
    }
});
