import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { GradientHeader, ProgressBar, StatBox } from '../components/UI';
import { useApp } from '../context/AppContext';
import { formatShortTime, isDueToday } from '../utils/formatters';

const GOALS = [50, 100, 150, 200, 300];

const getMessageKey = (percent) => {
  if (percent >= 100) return 'dailyGoal.msgDone';
  if (percent >= 70) return 'dailyGoal.msgNear';
  if (percent >= 40) return 'dailyGoal.msgMid';
  return 'dailyGoal.msgStart';
};

export default function DailyGoalScreen({ navigation }) {
  const { state, theme, updateSettings, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const goalTarget = Math.max(Number(state.settings.dailyGoal || state.stats.dailyGoal || 100), 50);
  const percent = Math.min(Math.round(((state.stats.dailyXp || 0) / Math.max(goalTarget || 1, 1)) * 100), 100);

  const todaysBreakdown = useMemo(() => [...state.history]
    .filter((item) => isDueToday(item.completedAt))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)), [state.history]);

  const pendingToday = useMemo(() => state.tasks
    .filter((task) => !task.completed && isDueToday(task.dueAt))
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)), [state.tasks]);

  return (
    <Screen scroll={false} withTabBarPadding>
      <FlatList
        data={todaysBreakdown}
        keyExtractor={(item, index) => `${item.taskId || 'history'}-${item.completedAt || index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <>
            <GradientHeader withBack onBack={() => navigation.goBack()} title={t('dailyGoal.title')} subtitle={t('dailyGoal.subtitle', { xp: state.stats.dailyXp || 0, goal: goalTarget })} />
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('dailyGoal.progress')}</Text>
              <Text style={styles.progressValue}>{percent}%</Text>
              <ProgressBar value={state.stats.dailyXp} max={goalTarget} color={theme.colors.yellow} height={10} />
              <Text style={styles.message}>{t(getMessageKey(percent))}</Text>
            </View>
            <View style={styles.goalRow}>
              {GOALS.map((goal) => (
                <Pressable key={goal} style={[styles.goalButton, goalTarget === goal && styles.goalButtonActive]} onPress={() => updateSettings({ dailyGoal: goal })}>
                  <Text style={[styles.goalButtonText, goalTarget === goal && styles.goalButtonTextActive]}>{goal}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.statRow}>
              <StatBox icon="checkmark-done-outline" iconBg={theme.colors.greenSoft} iconColor={theme.colors.green} value={`${todaysBreakdown.length}`} label={t('dailyGoal.completedToday')} />
              <View style={styles.spacer} />
              <StatBox icon="time-outline" iconBg={theme.colors.orangeSoft} iconColor={theme.colors.orange} value={`${pendingToday.length}`} label={t('dailyGoal.pendingToday')} />
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('dailyGoal.pendingDueToday')}</Text>
              {pendingToday.length ? pendingToday.map((task) => (
                <View key={task.id} style={styles.pendingRow}>
                  <Text style={styles.pendingTitle}>{task.title}</Text>
                  <Text style={styles.pendingTime}>{formatShortTime(task.dueAt)}</Text>
                </View>
              )) : <Text style={styles.emptyText}>{t('dailyGoal.pendingEmpty')}</Text>}
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('dailyGoal.breakdown')}</Text>
            </View>
          </>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historyMeta}>+{item.xp} XP • {formatShortTime(item.completedAt)}</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.historyCard}>
            <Text style={styles.emptyText}>{t('dailyGoal.noXpToday')}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  listContent: { paddingBottom: 20 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 16, marginTop: 14, ...theme.shadow.card },
  sectionTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 16 },
  progressValue: { color: theme.colors.primary, fontWeight: '900', fontSize: 34, marginTop: 8, marginBottom: 10 },
  message: { color: theme.colors.textMuted, marginTop: 10, lineHeight: 20 },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  goalButton: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginBottom: 10, ...theme.shadow.card },
  goalButtonActive: { backgroundColor: theme.colors.primary },
  goalButtonText: { color: theme.colors.text, fontWeight: '800' },
  goalButtonTextActive: { color: '#FFFFFF' },
  statRow: { flexDirection: 'row', marginTop: 4 },
  spacer: { width: 12 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  pendingTitle: { color: theme.colors.text, fontWeight: '700', flex: 1, paddingRight: 10 },
  pendingTime: { color: theme.colors.textMuted, fontWeight: '700' },
  historyCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, ...theme.shadow.card },
  historyTitle: { color: theme.colors.text, fontWeight: '800' },
  historyMeta: { color: theme.colors.textMuted, marginTop: 6 },
  emptyText: { color: theme.colors.textMuted, marginTop: 4, lineHeight: 20 },
});
