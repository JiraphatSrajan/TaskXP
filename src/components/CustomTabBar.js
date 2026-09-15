import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const LEFT_TABS = ['HomeTab', 'TasksTab', 'CalendarTab'];
const RIGHT_TABS = ['ProgressTab', 'FriendsTab', 'ProfileTab'];

const TAB_META = {
  HomeTab: { icon: 'home-outline', activeIcon: 'home' },
  TasksTab: { icon: 'list-outline', activeIcon: 'list' },
  CalendarTab: { icon: 'calendar-outline', activeIcon: 'calendar' },
  ProgressTab: { icon: 'trending-up-outline', activeIcon: 'trending-up' },
  FriendsTab: { icon: 'people-outline', activeIcon: 'people' },
  ProfileTab: { icon: 'person-outline', activeIcon: 'person' },
};

export default function CustomTabBar({ state, navigation }) {
  const { theme, t } = useApp();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);

  const activeRouteName = state.routes[state.index]?.name;
  const navigateToAdd = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('AddQuestModal');
      return;
    }
    navigation.navigate('AddQuestModal');
  };

  const renderTab = (routeName) => {
    const route = state.routes.find((item) => item.name === routeName);
    if (!route) return null;

    const focused = activeRouteName === routeName;
    const meta = TAB_META[routeName] || TAB_META.HomeTab;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={({ pressed }) => [styles.tabBtn, pressed && styles.tabBtnPressed]}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t(`tabs.${route.name}`)}
      >
        <Ionicons name={focused ? meta.activeIcon : meta.icon} size={18} color={focused ? theme.colors.primary : theme.colors.inactive} />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>{t(`tabs.${route.name}`)}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        <View style={styles.sideWrap}>{LEFT_TABS.map(renderTab)}</View>

        <View style={styles.addSlot}>
          <Pressable
            onPress={navigateToAdd}
            style={({ pressed }) => [styles.addButtonOuter, pressed && styles.addButtonOuterPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.addQuest')}
          >
            <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.addButtonInner}>
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.sideWrap}>{RIGHT_TABS.map(renderTab)}</View>
      </View>
    </View>
  );
}

const createStyles = (theme, insetBottom) => StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Math.max(insetBottom, 8),
    alignItems: 'center',
  },
  bar: {
    width: '96%',
    minHeight: 78,
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 10,
    alignItems: 'flex-end',
    ...theme.shadow.card,
  },
  sideWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tabBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    borderRadius: 18,
    paddingHorizontal: 2,
  },
  tabBtnPressed: {
    opacity: 0.82,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    color: theme.colors.inactive,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  addSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonOuter: {
    marginTop: -34,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    padding: 4,
    ...theme.shadow.fab,
  },
  addButtonOuterPressed: {
    opacity: 0.92,
  },
  addButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
