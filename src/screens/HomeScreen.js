import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import { GradientHeader, HeaderIconButton, NotificationBadge, ProgressBar, SectionHeader, StatBox, TaskCard } from '../components/UI';
import { formatLevelTag, isDueToday } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { resolveUserTitle } from '../utils/profile';

const navigateToRoot = (navigation, routeName, params) => {
  let current = navigation;
  while (current) {
    const routeNames = current.getState?.()?.routeNames || [];
    if (routeNames.includes(routeName)) {
      current.navigate(routeName, params);
      return;
    }
    current = current.getParent?.();
  }
  navigation.navigate(routeName, params);
};

export default function HomeScreen({ navigation }) {
  const { state, completeTask, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, stats, tasks } = state;
  const [query, setQuery] = useState('');
  const titleLabel = resolveUserTitle(user, t);
  const trashCount = state.trash.length;
  const unreadCount = (state.notifications || []).filter((item) => !item.read).length;

  const allTodaysTasks = useMemo(() => tasks
    .filter((task) => !task.completed && isDueToday(task.dueAt))
    .slice()
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)), [tasks]);

  const todaysTasks = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return allTodaysTasks;
    return allTodaysTasks.filter((task) => [task.title, task.description, task.category].join(' ').toLowerCase().includes(lowered));
  }, [allTodaysTasks, query]);

  const visibleTasks = todaysTasks.slice(0, 5);
  const dailyPercentNumber = Math.min(Math.round(((stats.dailyXp || 0) / Math.max(stats.dailyGoal || 1, 1)) * 100), 100);
  const dailyPercent = `${dailyPercentNumber}%`;

  const handleComplete = (taskId) => {
    const result = completeTask(taskId);
    if (result?.ok) {
      navigateToRoot(navigation, 'QuestComplete', result);
    }
  };

  const headerActions = (
    <View style={styles.headerActions}>
      <View style={styles.iconWrap}>
        <HeaderIconButton icon="notifications-outline" onPress={() => navigateToRoot(navigation, 'Notifications')} label={t('notificationsCenter.title')} />
        <NotificationBadge count={unreadCount} style={styles.notificationBadge} />
      </View>
      <HeaderIconButton icon="gift-outline" onPress={() => navigateToRoot(navigation, 'RewardShop')} label={t('rewardShop.title')} />
      <View style={styles.iconWrap}>
        <HeaderIconButton icon="trash-outline" onPress={() => navigateToRoot(navigation, 'Trash')} label={t('trash.title')} />
        {trashCount > 0 ? <NotificationBadge count={trashCount} style={styles.notificationBadge} /> : null}
      </View>
    </View>
  );

  return (
    <Screen withTabBarPadding>
      <GradientHeader title={t('home.title')} subtitle={`${formatLevelTag(user.level, t)}   ${titleLabel}`} rightAction={headerActions}>
        <Pressable style={styles.avatarChip} onPress={() => navigation.navigate('ProfileTab')}>
          <Ionicons name="person" size={16} color={theme.colors.primaryDark} />
        </Pressable>

        <Pressable style={styles.xpCard} onPress={() => navigateToRoot(navigation, 'DailyGoal')}>
          <View style={styles.xpRow}>
            <View style={styles.xpLabelRow}>
              <Ionicons name="star" size={13} color={theme.colors.yellow} />
              <Text style={styles.xpLabel}>{t('home.experience')}</Text>
            </View>
            <Text style={styles.xpValue}>{user.currentXp} / {user.xpGoal} {t('common.xp')}</Text>
          </View>
          <ProgressBar value={user.currentXp} max={user.xpGoal} color={theme.colors.yellow} height={7} trackStyle={{ backgroundColor: 'rgba(255,255,255,0.24)' }} />
        </Pressable>
      </GradientHeader>

      <View style={styles.statsRow}>
        <Pressable style={styles.flexOne} onPress={() => navigateToRoot(navigation, 'DailyGoal')}>
          <StatBox icon="sparkles" iconBg={theme.colors.primarySoft} iconColor={theme.colors.primary} value={`${stats.dailyXp} / ${stats.dailyGoal}`} label={t('home.dailyXp')} sublabel={dailyPercent} />
        </Pressable>
        <View style={styles.statsSpacer} />
        <Pressable style={styles.flexOne} onPress={() => navigateToRoot(navigation, 'StreakDetail')}>
          <StatBox icon="flame" iconBg={theme.colors.orangeSoft} iconColor={theme.colors.orange} value={t('common.days', { count: user.currentStreak })} label={t('home.streak')} sublabel={t('home.keepItUp')} />
        </Pressable>
      </View>

      <SectionHeader
        title={t('home.todaysQuests')}
        actionLabel={allTodaysTasks.length > 5 ? t('home.seeAllQuests') : t('home.viewAll')}
        onAction={() => navigation.navigate('TasksTab')}
      />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('tasks.searchPlaceholder')}
          placeholderTextColor={theme.colors.textSoft}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {visibleTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={() => handleComplete(task.id)}
          onPressTitle={() => navigateToRoot(navigation, 'QuestDetail', { taskId: task.id })}
        />
      ))}

      {allTodaysTasks.length > 5 ? (
        <Pressable style={styles.seeAllCard} onPress={() => navigation.navigate('TasksTab')}>
          <Text style={styles.seeAllTitle}>{t('home.moreDueToday')}</Text>
          <Text style={styles.seeAllText}>{t('home.tapToViewAll')}</Text>
        </Pressable>
      ) : null}

      {allTodaysTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t('home.noQuestsDueToday')}</Text>
          <Text style={styles.emptyText}>{t('home.addOrCheckTasks')}</Text>
        </View>
      ) : null}

      {allTodaysTasks.length > 0 && todaysTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t('home.noSearchResults')}</Text>
          <Text style={styles.emptyText}>{t('home.noSearchResultsText')}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { position: 'relative', marginLeft: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: -2, right: -2 },
  avatarChip: {
    position: 'absolute', top: 18, left: 18, width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  xpCard: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: 14, marginTop: 30 },
  xpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  xpLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  xpLabel: { marginLeft: 8, color: 'white', fontWeight: '700', fontSize: 12 },
  xpValue: { color: 'white', fontWeight: '800', fontSize: 12, marginLeft: 8 },
  statsRow: { flexDirection: 'row', marginTop: 14, marginBottom: 18 },
  flexOne: { flex: 1 },
  statsSpacer: { width: 12 },
  searchWrap: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 14, minHeight: 44, flexDirection: 'row', alignItems: 'center', marginBottom: 14, ...theme.shadow.card },
  searchInput: { flex: 1, marginLeft: 8, color: theme.colors.text, fontSize: 13 },
  seeAllCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, marginTop: 10, ...theme.shadow.card },
  seeAllTitle: { color: theme.colors.text, fontWeight: '800' },
  seeAllText: { color: theme.colors.textMuted, marginTop: 6 },
  emptyCard: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 18, marginTop: 8, ...theme.shadow.card },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  emptyText: { fontSize: 13, lineHeight: 20, color: theme.colors.textMuted, marginTop: 8 },
});
