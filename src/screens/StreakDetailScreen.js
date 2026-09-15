import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Screen from '../components/Screen';
import { GradientHeader, StatBar, StatBox } from '../components/UI';
import { useApp } from '../context/AppContext';
import { addDays, getTodayKey } from '../utils/formatters';

export default function StreakDetailScreen({ navigation }) {
  const { state, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const completedDays = useMemo(() => new Set(state.history.map((item) => getTodayKey(item.completedAt))), [state.history]);
  const todayKey = getTodayKey(new Date());
  const minDate = getTodayKey(addDays(new Date(), -89));
  const todayDone = completedDays.has(todayKey);

  const markedDates = useMemo(() => {
    const marks = {};
    Array.from(completedDays).forEach((key) => {
      marks[key] = { marked: true, dotColor: theme.colors.primary };
    });
    marks[todayKey] = { ...(marks[todayKey] || {}), selected: true, selectedColor: theme.colors.primarySoft };
    return marks;
  }, [completedDays, theme.colors.primary, theme.colors.primarySoft, todayKey]);

  const weeklySummary = useMemo(() => Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(new Date(), -(6 - index));
    const key = getTodayKey(date);
    return { key, label: key.slice(5), done: completedDays.has(key) };
  }), [completedDays]);

  const weeklyDone = weeklySummary.filter((item) => item.done).length;

  return (
    <Screen withTabBarPadding>
      <GradientHeader withBack onBack={() => navigation.goBack()} title={t('streakDetail.title')} subtitle={t('streakDetail.subtitle')} />

      <View style={styles.gridRow}>
        <StatBox icon="flame" iconBg={theme.colors.orangeSoft} iconColor={theme.colors.orange} value={`${state.user.currentStreak}`} label={t('streakDetail.current')} />
        <View style={styles.spacer} />
        <StatBox icon="trophy" iconBg={theme.colors.yellowSoft} iconColor={theme.colors.yellow} value={`${state.user.longestStreak}`} label={t('streakDetail.longest')} />
      </View>

      {!todayDone ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>{t('streakDetail.warningTitle')}</Text>
          <Text style={styles.warningText}>{t('streakDetail.warningText')}</Text>
        </View>
      ) : null}

      <View style={styles.calendarCard}>
        <Calendar
          markingType="simple"
          markedDates={markedDates}
          initialDate={minDate}
          current={todayKey}
          minDate={minDate}
          maxDate={todayKey}
          pastScrollRange={3}
          futureScrollRange={0}
          theme={{
            calendarBackground: theme.colors.surface,
            monthTextColor: theme.colors.text,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textSoft,
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
          }}
        />
      </View>

      <StatBar icon="analytics-outline" label={t('streakDetail.weeklySummary')} value={`${weeklyDone}/7`} percent={Math.round((weeklyDone / 7) * 100)} color={theme.colors.green} helper={t('streakDetail.weeklyHelper')} />

      <View style={styles.milestoneCard}>
        <Text style={styles.sectionTitle}>{t('streakDetail.milestones')}</Text>
        <Text style={styles.milestoneText}>{t('streakDetail.milestonesList')}</Text>
      </View>

      <View style={styles.weekRow}>
        {weeklySummary.map((item) => (
          <View key={item.key} style={[styles.weekCell, item.done && styles.weekCellDone]}>
            <Text style={[styles.weekLabel, item.done && styles.weekLabelDone]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  gridRow: { flexDirection: 'row', marginTop: 14 },
  spacer: { width: 12 },
  warningCard: { backgroundColor: theme.colors.orangeSoft, borderRadius: 18, padding: 14, marginTop: 14 },
  warningTitle: { color: theme.colors.text, fontWeight: '900' },
  warningText: { color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 },
  calendarCard: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 10, marginTop: 14, ...theme.shadow.card },
  milestoneCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginTop: 12, ...theme.shadow.card },
  sectionTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 16 },
  milestoneText: { color: theme.colors.textMuted, marginTop: 8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  weekCell: { width: '13%', borderRadius: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, ...theme.shadow.card },
  weekCellDone: { backgroundColor: theme.colors.primarySoft },
  weekLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  weekLabelDone: { color: theme.colors.primaryDark },
});
