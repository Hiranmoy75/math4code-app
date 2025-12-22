import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as Linking from 'expo-linking';

import { AuthNavigator } from './src/navigation/AuthNavigator';
import { StudentNavigator } from './src/navigation/StudentNavigator';
import { CourseDetailsScreen } from './src/screens/student/CourseDetailsScreen';
import { LessonPlayerScreen } from './src/screens/student/LessonPlayerScreen';
import { ExamScreen } from './src/screens/student/ExamScreen';
import { ResultScreen } from './src/screens/student/ResultScreen';
import { QuestionAnalysisScreen } from './src/screens/student/QuestionAnalysisScreen';
import { PaymentStatusScreen } from './src/screens/student/PaymentStatusScreen';
import { PaymentWebViewScreen } from './src/screens/student/PaymentWebViewScreen';
import { NotificationsScreen } from './src/screens/student/NotificationsScreen';
import { EditProfileScreen } from './src/screens/student/EditProfileScreen';
import { SettingsScreen } from './src/screens/student/SettingsScreen';
import { HelpSupportScreen } from './src/screens/student/HelpSupportScreen';
import { AIChatScreen } from './src/screens/student/AIChatScreen';
import { CoursesScreen } from './src/screens/student/CoursesScreen';
import { MentionsScreen } from './src/screens/student/MentionsScreen';
import { BookmarksScreen } from './src/screens/student/BookmarksScreen';
import { LegalPageScreen } from './src/screens/legal/LegalPageScreen';
import { ResetPasswordScreen } from './src/screens/auth/ResetPasswordScreen';

import { RewardScreen } from './src/screens/student/RewardScreen';
import { supabase } from './src/services/supabase';
import { rewardService } from './src/services/rewards';
import { colors } from './src/constants/colors';
import { RootStackParamList } from './src/types';
import { ThemeProvider } from './src/contexts/ThemeContext';

import { queryClient } from './src/services/queryClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './src/screens/splash/SplashScreen';
import { OnboardingScreen } from './src/screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Handle Deep Links for Auth (Google / Reset Password)
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;

      // Extract tokens from hash (Supabase default)
      if (url.includes('access_token') && url.includes('refresh_token')) {
        try {
          // Helper to parsing query params from hash
          // Format: math4code://auth/callback#access_token=...&refresh_token=...
          const hash = url.split('#')[1];
          if (hash) {
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });

              if (error) {
                console.error("Error setting session from URL:", error);
                return false;
              } else {
                // Determine if authenticated immediately to prevent login screen flicker
                setIsAuthenticated(true);
                return true;
              }
            }
          }
        } catch (e) {
          console.error("Error parsing deep link:", e);
        }
      }
      return false;
    };

    const initApp = async () => {
      try {
        // 1. Minimum Splash Time
        const splashPromise = new Promise(resolve => setTimeout(resolve, 2500));

        // 2. Check Onboarding
        const onboardingPromise = AsyncStorage.getItem('hasOnboarded');

        // 3. Check Deep Link FIRST
        const initialUrl = await Linking.getInitialURL();
        let isDeepLinkAuth = false;

        if (initialUrl && (initialUrl.includes('access_token') || initialUrl.includes('refresh_token'))) {
          // If we have an auth deep link, handle it and wait
          isDeepLinkAuth = await handleDeepLink({ url: initialUrl });
        }

        // 4. If no deep link auth, check standard session
        let session = null;
        if (!isDeepLinkAuth) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
          setIsAuthenticated(!!session);
        }

        // Wait for other promises
        const [_, hasOnboarded] = await Promise.all([
          splashPromise,
          onboardingPromise
        ]);

        setIsOnboarded(!!hasOnboarded);

        if (session?.user) {
          // Check for daily streak
          rewardService.checkStreak(session.user.id).then(res => {
            if (res.message) {
              Toast.show({
                type: 'success',
                text1: 'Daily Streak',
                text2: res.message,
                visibilityTime: 4000
              });
            }
          });
        }
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        setIsLoading(false);
        setShowSplash(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only update if we didn't just manually set it to true via deep link (though duplicate true set is fine)
      // This ensures logout updates state correctly
      setIsAuthenticated(!!session);
    });

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  if (!isOnboarded) {
    return <OnboardingScreen onFinish={() => setIsOnboarded(true)} />;
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          linking={{
            prefixes: [Linking.createURL('/'), 'math4code://', 'exp://'],
            config: {
              screens: {
                Auth: {
                  screens: {
                    ResetPassword: 'reset-password',
                    Login: 'login',
                    Signup: 'signup',
                    ForgotPassword: 'forgot-password'
                  },
                },
                PaymentStatus: 'payment/:status', // Handle /payment/success or /payment/failed
                // If we want to handle it when logged in too (though unlikely for reset password flow)
                // Main: { ... }
              },
            },
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <>
                <Stack.Screen name="Main" component={StudentNavigator} />
                <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
                <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
                <Stack.Screen name="ExamScreen" component={ExamScreen} />
                <Stack.Screen name="ResultScreen" component={ResultScreen} />
                <Stack.Screen name="QuestionAnalysisScreen" component={QuestionAnalysisScreen} />
                <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} />
                <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                <Stack.Screen name="AIChat" component={AIChatScreen} />
                <Stack.Screen name="AllCourses" component={CoursesScreen} />
                <Stack.Screen name="Mentions" component={MentionsScreen} />
                <Stack.Screen name="Bookmarks" component={BookmarksScreen} />

                <Stack.Screen name="LegalPage" component={LegalPageScreen} />
                <Stack.Screen name="RewardScreen" component={RewardScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              </>
            ) : (
              <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
