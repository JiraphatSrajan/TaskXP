import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { GradientHeader, SectionHeader, StatBox } from '../components/UI';
import { CATEGORY_KEYS } from '../constants/theme';
import { useApp } from '../context/AppContext';

const buildYAxis = (values) => {
  const peak = Math.max(...values, 0);
  const interval = Math.max(25, Math.ceil(peak / 4 / 25) * 25);
  const top = Math.max(interval * 4, 100);
  return { maxBar: top, guides: [top, top - interval, top - (interval * 2), top - (interval * 3)] };
};

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

export default function ProgressScreen({ navigation }) {
  const { state, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, stats, charts } = state;
  const { maxBar, guides } = useMemo(() => buildYAxis(charts.weekXp), [charts.weekXp]);
  const dayLabels = t('progress.weekDays');
  const dailyGoalPercent = Math.min(Math.round(((stats.dailyXp || 0) / Math.max(stats.dailyGoal || 1, 1)) * 100), 100);

  return (
    <Screen withTabBarPadding>
      <GradientHeader title={t('progress.title')} subtitle={t('progress.subtitle')} />

      <View style={styles.gridRow}>
        <StatBox icon="star" iconBg={theme.colors.yellowSoft} iconColor={theme.colors.yellow} value={user.totalXp.toLocaleString()} label={t('progress.totalXp')} />
        <View style={styles.gridSpacer} />
        <StatBox icon="flame" iconBg={theme.colors.orangeSoft} iconColor={theme.colors.orange} value={t('common.days', { count: user.currentStreak })} label={t('progress.currentStreak')} />
      </View>
      <View style={styles.gridRow}>
        <StatBox icon="trophy" iconBg={theme.colors.lilacSoft} iconColor={theme.colors.primary} value={`${stats.completedCount}`} label={t('progress.completedQuests')} />
        <View style={styles.gridSpacer} />
        <StatBox icon="radio-button-on" iconBg={theme.colors.blueSoft} iconColor={theme.colors.blue} value={`${stats.thisWeekXp.toLocaleString()} ${t('common.xp')}`} label={t('progress.thisWeek')} />
      </View>

      <Pressable style={styles.goalCard} onPress={() => navigateToRoot(navigation, 'DailyGoal')}>
        <View style={styles.goalTop}>
          <Text style={styles.goalTitle}>{state.settings.language === 'Thai' ? 'Daily Goal' : 'Daily Goal'}</Text>
          <Text style={styles.goalPercent}>{dailyGoalPercent}%</Text>
        </View>
        <Text style={styles.goalMeta}>{stats.dailyXp} / {stats.dailyGoal} XP</Text>
      </Pressable>

      <View style={styles.chartCard}>
        <SectionHeader title={t('progress.weeklyXp')} />
        <View style={styles.chartBody}>
          <View style={styles.axisColumn}>{guides.map((guide) => <Text key={guide} style={styles.axisLabel}>{guide}</Text>)}</View>
          <View style={styles.chartArea}>
            {guides.map((guide, index) => <View key={guide} style={[styles.guideLine, { top: 10 + index * 31 }]} />)}
            <View style={styles.barRow}>
              {charts.weekXp.map((value, index) => (
                <View key={`${dayLabels[index]}-${index}`} style={styles.barColumn}>
                  <View style={[styles.bar, { height: `${Math.max((value / maxBar) * 100, 18)}%` }]} />
                  <Text style={styles.barLabel}>{dayLabels[index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <SectionHeader title={t('progress.categoryProgress')} />
        {CATEGORY_KEYS.map((label, index) => (
          <View key={label} style={styles.categoryRow}>
            <View style={styles.categoryTop}>
              <Text style={styles.categoryLabel}>{t(`category.${label}`)}</Text>
              <Text style={styles.categoryValue}>{charts.categoryProgress[index]}%</Text>
            </View>
            <View style={styles.categoryTrack}><View style={[styles.categoryFill, { width: `${charts.categoryProgress[index]}%` }]} /></View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  gridRow: { flexDirection: 'row', marginTop: 14 },
  gridSpacer: { width: 12 },
  goalCard: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 16, marginTop: 16, ...theme.shadow.card },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 16 },
  goalPercent: { color: theme.colors.primary, fontWeight: '900', fontSize: 18 },
  goalMeta: { color: theme.colors.textMuted, marginTop: 8 },
  chartCard: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 16, marginTop: 16, ...theme.shadow.card },
  chartBody: { flexDirection: 'row', alignItems: 'stretch', marginTop: 4 },
  axisColumn: { width: 36, height: 154, justifyContent: 'space-between', paddingBottom: 24, paddingTop: 10 },
  axisLabel: { fontSize: 11, color: theme.colors.textSoft, textAlign: 'left' },
  chartArea: { flex: 1, height: 154, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 28, position: 'relative', overflow: 'hidden' },
  guideLine: { position: 'absolute', left: 0, right: 0, height: 1, borderTopWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  barRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barColumn: { width: '12%', alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '70%', borderRadius: 8, backgroundColor: theme.colors.primary, minHeight: 16 },
  barLabel: { marginTop: 8, color: theme.colors.textMuted, fontSize: 11, fontWeight: '600' },
  categoryRow: { marginTop: 14 },
  categoryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryLabel: { color: theme.colors.text, fontWeight: '700', fontSize: 13 },
  categoryTrack: { height: 9, borderRadius: 10, backgroundColor: theme.colors.track, overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 10, backgroundColor: theme.colors.primary },
  categoryValue: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' },
});
