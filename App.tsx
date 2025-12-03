import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

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
import { supabase } from './src/services/supabase';
import { colors } from './src/constants/colors';
import { RootStackParamList } from './src/types';
import { ThemeProvider } from './src/contexts/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
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
