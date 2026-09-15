import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import CustomTabBar from './src/components/CustomTabBar';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AppProvider, useApp } from './src/context/AppContext';
import AchievementsScreen from './src/screens/AchievementsScreen';
import AddQuestScreen from './src/screens/AddQuestScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import CharacterStatsScreen from './src/screens/CharacterStatsScreen';
import DailyGoalScreen from './src/screens/DailyGoalScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import HelpScreen from './src/screens/HelpScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import QuestCompleteScreen from './src/screens/QuestCompleteScreen';
import QuestDetailScreen from './src/screens/QuestDetailScreen';
import QuestHistoryScreen from './src/screens/QuestHistoryScreen';
import RewardShopScreen from './src/screens/RewardShopScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StreakDetailScreen from './src/screens/StreakDetailScreen';
import TasksScreen from './src/screens/TasksScreen';
import TrashScreen from './src/screens/TrashScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileNavigator() {
  const { theme } = useApp();

  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="TasksTab" component={TasksScreen} />
      <Tab.Screen name="CalendarTab" component={CalendarScreen} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} />
      <Tab.Screen name="FriendsTab" component={FriendsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { state, isReady, theme } = useApp();
  const isThai = state.settings.language === 'Thai';

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const baseNavTheme = theme.dark ? NavigationDarkTheme : NavigationDefaultTheme;
  const navTheme = {
    ...baseNavTheme,
    dark: theme.dark,
    colors: {
      ...baseNavTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
      notification: theme.colors.primary,
    },
  };

  const surfaceHeader = {
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.text,
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        {!state.hasSeenOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : state.isAuthenticated ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen name="AddQuestModal" component={AddQuestScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen name="QuestDetail" component={QuestDetailScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen name="QuestComplete" component={QuestCompleteScreen} options={{ presentation: 'modal' }} />
            <RootStack.Screen name="QuestHistory" component={QuestHistoryScreen} options={{ ...surfaceHeader, title: isThai ? 'ประวัติภารกิจ' : 'Quest History' }} />
            <RootStack.Screen name="StreakDetail" component={StreakDetailScreen} options={{ ...surfaceHeader, title: isThai ? 'รายละเอียดสตรีค' : 'Streak Details' }} />
            <RootStack.Screen name="CharacterStats" component={CharacterStatsScreen} options={{ ...surfaceHeader, title: isThai ? 'ค่าสถานะตัวละคร' : 'Character Stats' }} />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ ...surfaceHeader, title: isThai ? 'การแจ้งเตือน' : 'Notifications' }} />
            <RootStack.Screen name="Help" component={HelpScreen} options={{ ...surfaceHeader, title: isThai ? 'ช่วยเหลือ & FAQ' : 'Help & FAQ' }} />
            <RootStack.Screen name="DailyGoal" component={DailyGoalScreen} options={{ ...surfaceHeader, title: isThai ? 'เป้าหมายรายวัน' : 'Daily Goal' }} />
            <RootStack.Screen
              name="RewardShop"
              component={RewardShopScreen}
              options={{
                headerShown: true,
                title: isThai ? '🎁 แลกรางวัล' : '🎁 Reward Shop',
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: 'white',
                headerShadowVisible: false,
              }}
            />
            <RootStack.Screen name="Trash" component={TrashScreen} options={{ ...surfaceHeader, title: isThai ? '🗑️ ถังขยะ' : '🗑️ Trash' }} />
          </>
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
