import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudentTabParamList } from '../types';
import { DashboardScreen } from '../screens/student/DashboardScreen';
import { CommunityScreen } from '../screens/student/CommunityScreen';
import { LibraryScreen } from '../screens/student/LibraryScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';
import { useAppTheme } from '../hooks/useAppTheme';

const Tab = createBottomTabNavigator<StudentTabParamList>();

export const StudentNavigator = () => {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();

    // Calculate tab bar height based on safe area
    // Base height for content (icons + labels)
    const TAB_CONTENT_HEIGHT = 60;

    // Determine safe bottom padding
    // For iOS: standard is ~34 usually, we use 20-30
    // For Android: 
    // - Gesture Nav: insets.bottom is usually small (~20)
    // - 3-Button Nav (Edge-to-Edge): insets.bottom is large (~48)
    // - Standard (Not Edge-to-Edge): insets.bottom is 0 (handled by OS window resizing) -> we add small padding for aesthetics
    const bottomPadding = Platform.OS === 'ios'
        ? Math.max(insets.bottom, 20)
        : Math.max(insets.bottom, 16);

    const dynamicHeight = TAB_CONTENT_HEIGHT + bottomPadding;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    height: dynamicHeight,
                    paddingBottom: bottomPadding,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.surface,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                tabBarIconStyle: {
                    marginBottom: -3,
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="LibraryTab"
                component={LibraryScreen}
                options={{
                    tabBarLabel: 'Library',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "book" : "book-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="CommunityTab"
                component={CommunityScreen}
                options={{
                    tabBarLabel: 'Community',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "chatbubbles" : "chatbubbles-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                    tabBarStyle: { display: 'none' },
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Account',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

