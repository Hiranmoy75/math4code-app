import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { RootStackParamList } from '../../types';

type LegalScreenRouteProp = RouteProp<RootStackParamList, 'LegalPage'>;

export const LegalPageScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<LegalScreenRouteProp>();
    const { colors } = useAppTheme();
    const { type } = route.params;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        },
        backButton: {
            padding: spacing.sm,
            marginRight: spacing.sm,
        },
        title: {
            ...textStyles.h3,
            color: colors.text,
            flex: 1,
        },
        scrollView: {
            flex: 1,
        },
        contentContainer: {
            padding: spacing.lg,
            paddingBottom: spacing['3xl'],
        },
        heading: {
            ...textStyles.h3,
            color: colors.text,
            marginTop: spacing.lg,
            marginBottom: spacing.sm,
        },
        paragraph: {
            ...textStyles.body,
            color: colors.textSecondary,
            marginBottom: spacing.md,
            lineHeight: 24,
        },
        bullet: {
            ...textStyles.body,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            marginLeft: spacing.md,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: spacing.xl,
        }
    });

    const getContent = () => {
        switch (type) {
            case 'privacy':
                return {
                    title: 'Privacy Policy',
                    content: (
                        <View style={styles.contentContainer}>
                            <Text style={styles.heading}>1. PERSONAL INFORMATION</Text>
                            <Text style={styles.paragraph}>
                                “Personal Information” shall mean the information which identifies a Learner i.e., first and last name, identification number, email address, age, gender, location, photograph and/or phone number provided at the time of registration or any time thereafter on the Platform.
                            </Text>
                            <Text style={styles.paragraph}>
                                “Sensitive Personal Information” shall include (i) passwords and financial data (except the truncated last four digits of credit/debit card), (ii) health data, (iii) official identifier (such as biometric data, aadhar number, social security number, driver’s license, passport, etc.,), (iv) information about sexual life, sexual identifier, race, ethnicity, political or religious belief or affiliation, (v) account details and passwords, or (vi) other data/information categorized as ‘sensitive personal data’ or ‘special categories of data’.
                            </Text>

                            <Text style={styles.heading}>2. INFORMATION WE COLLECT</Text>
                            <Text style={styles.paragraph}>
                                We may collect both personal and non-personal identifiable information from You in a variety of ways, including, but not limited to, when You visit our Platform, register on the Platform, and in connection with other activities, services, features or resources we make available on our Platform.
                            </Text>
                            <Text style={styles.bullet}>• We do not ask You for Personal Information unless we truly need it.</Text>
                            <Text style={styles.bullet}>• We do not share Your Personal Information with anyone except to comply with the applicable laws.</Text>
                            <Text style={styles.bullet}>• We do not store Personal Information on our servers unless required for the on-going operation of our Platform.</Text>

                            <Text style={styles.heading}>3. HOW WE USE INFORMATION</Text>
                            <Text style={styles.paragraph}>
                                We use Your information to improve and customize the Platform, prevent fraud, and communicate with You about Your orders or our services. We do not sell or trade Your personal-identifiable information.
                            </Text>
                        </View>
                    )
                };
            case 'terms':
                return {
                    title: 'Terms of Use',
                    content: (
                        <View style={styles.contentContainer}>
                            <Text style={styles.heading}>1. Access and Registration</Text>
                            <Text style={styles.paragraph}>
                                If You’re an individual You must be at least 18 (eighteen) years of age, or have parent/guardian permission. By using the Platform, You represent You have obtained appropriate consents.
                            </Text>
                            <Text style={styles.paragraph}>
                                To access Content, we require You to register. You represent that the information provided is true and complete.
                            </Text>

                            <Text style={styles.heading}>2. License to Use</Text>
                            <Text style={styles.paragraph}>
                                You are granted a limited, non-exclusive license to access and view the Content for personal, non-commercial use only. You may not modify, copy, distribute, or reverse engineer any materials.
                            </Text>

                            <Text style={styles.heading}>3. Code of Conduct</Text>
                            <Text style={styles.paragraph}>
                                You agree to use the Platform responsibly. We reserve the right to terminate access for violations of these terms, including posting inappropriate content in Public Forums.
                            </Text>
                        </View>
                    )
                };
            case 'refund':
                return {
                    title: 'Refund Policy',
                    content: (
                        <View style={styles.contentContainer}>
                            <Text style={styles.heading}>Non-tangible irrevocable goods ("Digital products")</Text>
                            <Text style={styles.paragraph}>
                                We do not issue refunds for non-tangible irrevocable goods ("digital products") once the order is confirmed and the product is sent.
                            </Text>
                            <Text style={styles.paragraph}>
                                We recommend contacting us for assistance if you experience any issues receiving or downloading our products.
                            </Text>

                            <View style={styles.divider} />

                            <Text style={styles.heading}>Contact Us</Text>
                            <Text style={styles.paragraph}>
                                If you have any questions about our Returns and Refunds Policy, please contact us at: deepak43545566@mailinator.com
                            </Text>
                        </View>
                    )
                };
            default:
                return { title: 'Legal', content: null };
        }
    };

    const { title, content } = getContent();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{title}</Text>
            </View>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {content}
            </ScrollView>
        </SafeAreaView>
    );
};
