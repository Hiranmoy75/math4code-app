import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
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
            fontWeight: '700',
        },
        subheading: {
            ...textStyles.h4,
            color: colors.text,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
            fontWeight: '600',
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
            lineHeight: 22,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: spacing.xl,
        },
        contactBox: {
            backgroundColor: colors.primary + '15',
            padding: spacing.lg,
            borderRadius: 12,
            marginTop: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
        },
        contactEmail: {
            ...textStyles.h4,
            color: colors.primary,
            fontWeight: '700',
        },
    });

    const getContent = () => {
        switch (type) {
            case 'privacy':
                return {
                    title: 'Privacy Policy',
                    content: (
                        <View style={styles.contentContainer}>
                            <Text style={styles.paragraph}>
                                This Privacy Policy (the "Policy") governs the manner in which the Platform collects, uses, maintains and discloses information of its users. The Policy also describes the practices that We apply to such user information, user's privacy rights and choices regarding their information.
                            </Text>
                            <Text style={styles.paragraph}>
                                By accessing and using the Platform, providing Your Personal Information, or by otherwise signalling Your agreement when the option is presented to You, You consent to the collection, use, and disclosure of information described in this Policy and Terms of Use.
                            </Text>

                            <Text style={styles.heading}>PERSONAL INFORMATION</Text>
                            <Text style={styles.paragraph}>
                                "Personal Information" shall mean the information which identifies a Learner i.e., first and last name, identification number, email address, age, gender, location, photograph and/or phone number provided at the time of registration or any time thereafter on the Platform.
                            </Text>
                            <Text style={styles.paragraph}>
                                "Sensitive Personal Information" shall include (i) passwords and financial data (except the truncated last four digits of credit/debit card), (ii) health data, (iii) official identifier (such as biometric data, aadhar number, social security number, driver's license, passport, etc.,), (iv) information about sexual life, sexual identifier, race, ethnicity, political or religious belief or affiliation, (v) account details and passwords, or (vi) other data/information categorized as 'sensitive personal data' or 'special categories of data'.
                            </Text>

                            <Text style={styles.heading}>INFORMATION WE COLLECT</Text>
                            <Text style={styles.paragraph}>
                                We may collect both personal and non-personal identifiable information from You in a variety of ways, including, but not limited to, when You visit our Platform, register on the Platform, and in connection with other activities, services, features or resources we make available on our Platform.
                            </Text>
                            <Text style={styles.bullet}>• We do not ask You for Personal Information unless we truly need it.</Text>
                            <Text style={styles.bullet}>• We do not share Your Personal Information with anyone except to comply with the applicable laws.</Text>
                            <Text style={styles.bullet}>• We do not store Personal Information on our servers unless required for the on-going operation of our Platform.</Text>

                            <Text style={styles.subheading}>Personal Identifiable Information</Text>
                            <Text style={styles.paragraph}>
                                We may collect personal-identifiable information such as Your name and emails address to enable Your access to the Platform and services/products offered therein. We will collect personal-identifiable information from You only if such information is voluntarily submitted by You to us.
                            </Text>

                            <Text style={styles.subheading}>Non-Personal Identifiable Information</Text>
                            <Text style={styles.paragraph}>
                                When You interact with our Platform, we may collect non-personal-identifiable information such as the browser name, language preference, referring site, and the date and time of each user request, operating system and the Internet service providers utilized and other similar information.
                            </Text>

                            <Text style={styles.subheading}>Cookies</Text>
                            <Text style={styles.paragraph}>
                                To enhance User experience, our Platform may use 'cookies'. A cookie is a string of information that a website stores on a visitor's computer, and that the visitor's browser provides to the website each time the visitor returns for record-keeping purposes.
                            </Text>

                            <Text style={styles.heading}>HOW WE USE AND SHARE THE INFORMATION COLLECTED</Text>
                            <Text style={styles.paragraph}>
                                We may collect and use Your Personal Information for the following purposes:
                            </Text>

                            <Text style={styles.subheading}>To provide access to our Platform</Text>
                            <Text style={styles.paragraph}>
                                We use Your information to allow You to access the Platform and the services/products offered therein, including without limitation to provide customer service, fulfil purchases through the Platform, verify User information and to resolve any glitches with our Platform.
                            </Text>

                            <Text style={styles.subheading}>To improve our Platform and maintain safety</Text>
                            <Text style={styles.paragraph}>
                                We use Your information to improve and customize the Platform and services/products offered by us. Further, we also use Your information to prevent, detect, investigate, and take measures against criminal activity, fraud, misuse of or damage to our Platform or network.
                            </Text>

                            <Text style={styles.subheading}>To communicate with You</Text>
                            <Text style={styles.paragraph}>
                                We may use the email address submitted by You to communicate with You about Your orders on our Platform, our offers, new products, services or even receive Your feedback on the Platform.
                            </Text>

                            <Text style={styles.paragraph}>
                                We do not sell, trade, or otherwise exploit Your personal-identifiable information to others.
                            </Text>

                            <Text style={styles.heading}>YOUR RIGHTS</Text>
                            <Text style={styles.paragraph}>
                                In general, all Learners have the rights specified herein. If you are a Learner, you may exercise any of these rights by using the options provided to you within the Platform upon your login.
                            </Text>

                            <Text style={styles.bullet}>• Right to Confirmation and Access: You have the right to get confirmation and access to your Personal Information.</Text>
                            <Text style={styles.bullet}>• Right to Correction: You have the right to ask us to rectify your Personal Information that is inaccurate or incomplete.</Text>
                            <Text style={styles.bullet}>• Right to be Forgotten: You have the right to restrict or prevent the continuing disclosure of your Personal Information.</Text>
                            <Text style={styles.bullet}>• Right to Erasure: You have the right to request erasure of your Personal Information from our Platform.</Text>

                            <Text style={styles.heading}>PROTECTION OF YOUR INFORMATION</Text>
                            <Text style={styles.paragraph}>
                                We take all measures reasonably necessary to protect against the unauthorized access, use, alteration or destruction of Personal Information or such other data on the Platform.
                            </Text>

                            <Text style={styles.heading}>CROSS-BORDER DATA TRANSFER</Text>
                            <Text style={styles.paragraph}>
                                Your information including any Personal Information is stored, processed, and transferred in and to the Amazon Web Service (AWS) servers and databases located in India. We may also store, process, and transfer information in and to servers in other countries depending on the location of our affiliates and service providers.
                            </Text>

                            <Text style={styles.heading}>DURATION FOR WHICH YOUR INFORMATION IS STORED</Text>
                            <Text style={styles.paragraph}>
                                We will retain Your information for as long as it is required for us to retain for the purposes stated hereinabove, including for the purpose of complying with legal obligation or business compliances.
                            </Text>

                            <Text style={styles.heading}>MODIFICATION TO PRIVACY POLICY</Text>
                            <Text style={styles.paragraph}>
                                We may modify, revise or change our Policy from time to time. We encourage You to check our Platform frequently to see the recent changes.
                            </Text>

                            <View style={styles.contactBox}>
                                <Text style={[styles.paragraph, { marginBottom: spacing.sm, fontWeight: '600' }]}>
                                    GRIEVANCES
                                </Text>
                                <Text style={styles.paragraph}>
                                    If you have any questions about this Policy, wish to exercise your rights, concerns about privacy or grievances, please write to us at:
                                </Text>
                                <Text style={styles.contactEmail}>hiranmoymandalucb@gmail.com</Text>
                            </View>
                        </View>
                    )
                };
            case 'terms':
                return {
                    title: 'Terms of Use',
                    content: (
                        <View style={styles.contentContainer}>
                            <Text style={styles.paragraph}>
                                These Terms of Use set out the terms and conditions for use of this Platform and any content, Public Forums, or services offered on or through the Platform.
                            </Text>
                            <Text style={styles.paragraph}>
                                When we speak of "Creator", 'we', 'us', and 'our', we collectively mean Math4Code being the creator of this Platform and the content/materials/services contained therein.
                            </Text>
                            <Text style={[styles.paragraph, { fontWeight: '700' }]}>
                                If You disagree with any part of this Agreement or do not wish to be bound by the same, then please do not use the Platform in any manner.
                            </Text>

                            <Text style={styles.heading}>Access and Registration</Text>
                            <Text style={styles.paragraph}>
                                If You're an individual You must be at least 18 (eighteen) years of age, or, if You are between the ages of 13 and 18, You must have Your parent or legal guardian's permission to use the Platform.
                            </Text>
                            <Text style={styles.paragraph}>
                                To access any Content offered on the Platform, we require You to register for the same by providing Your name and email address. You represent that the information indicated by You during Your enrolment or registration is true and complete.
                            </Text>
                            <Text style={styles.paragraph}>
                                For the purpose of this Agreement, "Content" shall mean and include any course or session (whether pre-recorded or live) published by the Creator on the Platform.
                            </Text>

                            <Text style={styles.heading}>License to Use</Text>
                            <Text style={styles.paragraph}>
                                You are granted a limited, non-exclusive license to access and view the Content on the Platform for Your own personal, non-commercial use only.
                            </Text>
                            <Text style={styles.paragraph}>
                                This license does not grant You the right to assign or sublicense the license granted under this Agreement to anyone else. Further, You may not:
                            </Text>
                            <Text style={styles.bullet}>• Modify, edit or copy the Content or any material made available on the Platform</Text>
                            <Text style={styles.bullet}>• Create derivative works or exploit any material in a manner not permitted</Text>
                            <Text style={styles.bullet}>• Publicly display the Content for any commercial purpose</Text>
                            <Text style={styles.bullet}>• Attempt to decompile or reverse engineer any software</Text>
                            <Text style={styles.bullet}>• Remove any copyright or proprietary notations</Text>
                            <Text style={styles.bullet}>• Transfer materials to another person or 'mirror' on any other server</Text>

                            <Text style={styles.heading}>Communications</Text>
                            <Text style={styles.paragraph}>
                                The Platform includes provision of Public Forums designed to enable You to communicate with us and other users. If You choose to participate, You agree to adhere to the Code of Conduct.
                            </Text>
                            <Text style={styles.paragraph}>
                                You represent and warrant that You own and control all rights in and to any content uploaded or posted by You on the Public Forums.
                            </Text>

                            <Text style={styles.heading}>Code of Conduct</Text>
                            <Text style={styles.subheading}>Legitimate usage of the Platform</Text>
                            <Text style={styles.paragraph}>
                                You agree to use the Platform only for lawful purposes. You are not allowed to use our Platform to engage in any activity that violates any applicable law or regulation.
                            </Text>

                            <Text style={styles.subheading}>No harmful or dangerous content</Text>
                            <Text style={styles.paragraph}>
                                Any content which incites or promotes violence, that may cause physical or emotional harm is expressly prohibited on the Platform.
                            </Text>

                            <Text style={styles.subheading}>No hateful or defamatory content</Text>
                            <Text style={styles.paragraph}>
                                We do not encourage or tolerate any form of hate speech or statements that are libelous, slanderous, threatening, or defamatory.
                            </Text>

                            <Text style={styles.subheading}>Harassment and bullying</Text>
                            <Text style={styles.paragraph}>
                                We do not tolerate any form of harassment or bullying on the Platform. This includes abusive comments, revealing personal information, or sexual harassment.
                            </Text>

                            <Text style={styles.subheading}>Spam</Text>
                            <Text style={styles.paragraph}>
                                Posting untargeted, unwanted and repetitive content with an intention to spam is in direct violation of this Agreement.
                            </Text>

                            <Text style={styles.subheading}>Privacy violation</Text>
                            <Text style={styles.paragraph}>
                                Kindly refer to our Privacy Policy to know how to protect Your privacy and respect the privacy of other Users.
                            </Text>

                            <Text style={styles.subheading}>Impersonation</Text>
                            <Text style={styles.paragraph}>
                                Impersonating another person is not permitted while using our Platform.
                            </Text>

                            <Text style={styles.subheading}>Unauthorized Access</Text>
                            <Text style={styles.paragraph}>
                                You agree not to use the Platform in any manner that could disable, overburden, damage, or impair the Platform or interfere with any other user's use.
                            </Text>

                            <Text style={styles.heading}>Intellectual Property</Text>
                            <Text style={styles.paragraph}>
                                We own all information and materials, including Content provided on the Platform. The Creator's Intellectual Property is protected by applicable intellectual property laws, and any unauthorized use is strictly prohibited.
                            </Text>

                            <Text style={styles.heading}>Feedback</Text>
                            <Text style={styles.paragraph}>
                                If You submit suggestions, ideas, or comments about any Content or the Platform, You grant us a worldwide, non-exclusive, royalty-free, perpetual right to use such Feedback.
                            </Text>

                            <Text style={styles.heading}>Payments and Refunds</Text>
                            <Text style={styles.paragraph}>
                                To register for any Content, You may need to pay a fee. Payment shall be processed through third-party payment processors. Once You purchase access to Content, it cannot be cancelled and there shall be no refund unless otherwise stated in our Refund Policy.
                            </Text>
                            <Text style={styles.paragraph}>
                                We use third-party service providers to enable payments. We do not capture or store any of your sensitive personal information.
                            </Text>

                            <Text style={styles.heading}>Disclaimer</Text>
                            <Text style={[styles.paragraph, { fontSize: 11, fontStyle: 'italic' }]}>
                                THE PLATFORM IS PROVIDED TO YOU "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. THE CREATOR EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE.
                            </Text>

                            <Text style={styles.heading}>Limitation of Liability</Text>
                            <Text style={styles.paragraph}>
                                In no event shall the Creator be liable for any damages arising out of the use or inability to use the Content or any materials on the Platform.
                            </Text>

                            <Text style={styles.heading}>Indemnity and Release</Text>
                            <Text style={styles.paragraph}>
                                You shall indemnify and hold harmless the Creator from any claim or demand made by any third party due to or arising out of Your breach of this Agreement.
                            </Text>

                            <Text style={styles.heading}>Links to Third Party Website</Text>
                            <Text style={styles.paragraph}>
                                Creator is not responsible for the contents of any linked site. Use of any such linked website is at Your own risk.
                            </Text>

                            <Text style={styles.heading}>Governing Law and Jurisdiction</Text>
                            <Text style={styles.paragraph}>
                                Any claim relating to the Platform shall be governed by the laws of India. You agree to submit to the exclusive jurisdiction of the courts at Creator's home jurisdiction.
                            </Text>

                            <Text style={styles.heading}>Miscellaneous</Text>
                            <Text style={styles.subheading}>Alteration of Platform</Text>
                            <Text style={styles.paragraph}>
                                We reserve the right to make changes to our Platform, policies, and this Agreement at any time.
                            </Text>

                            <Text style={styles.subheading}>Waiver</Text>
                            <Text style={styles.paragraph}>
                                If You breach these conditions and we take no action, we will still be entitled to use our rights and remedies in any other situation.
                            </Text>

                            <Text style={styles.subheading}>Assignment</Text>
                            <Text style={styles.paragraph}>
                                You may not assign or transfer this Agreement. Any attempt will be null and void.
                            </Text>

                            <View style={styles.contactBox}>
                                <Text style={[styles.paragraph, { marginBottom: spacing.sm, fontWeight: '600' }]}>
                                    Contact Us
                                </Text>
                                <Text style={styles.paragraph}>
                                    If You have concerns or queries regarding this Agreement, You may write to us at:
                                </Text>
                                <Text style={styles.contactEmail}>hiranmoymandalucb@gmail.com</Text>
                            </View>
                        </View>
                    )
                };
            case 'refund':
                return {
                    title: 'Refund Policy',
                    content: (
                        <View style={styles.contentContainer}>
                            <Text style={styles.paragraph}>
                                Thank you for shopping with us.
                            </Text>

                            <Text style={styles.heading}>Non-tangible irrevocable goods ("Digital products")</Text>
                            <Text style={styles.paragraph}>
                                We do not issue refunds for non-tangible irrevocable goods ("digital products") once the order is confirmed and the product is sent.
                            </Text>
                            <Text style={styles.paragraph}>
                                We recommend contacting us for assistance if you experience any issues receiving or downloading our products.
                            </Text>

                            <View style={styles.divider} />

                            <View style={styles.contactBox}>
                                <Text style={[styles.paragraph, { marginBottom: spacing.sm, fontWeight: '600' }]}>
                                    Contact us for any issues:
                                </Text>
                                <Text style={styles.paragraph}>
                                    If you have any questions about our Returns and Refunds Policy, please contact us at:
                                </Text>
                                <Text style={styles.contactEmail}>hiranmoymandalucb@gmail.com</Text>
                            </View>
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
            <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
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
