import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { GradientHeader, StatBar, StatBox } from '../components/UI';
import { useApp } from '../context/AppContext';
import { resolveUserTitle } from '../utils/profile';

export default function CharacterStatsScreen({ navigation }) {
  const { state, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const titleLabel = resolveUserTitle(state.user, t);

  const stats = useMemo(() => {
    const history = state.history;
    const work = history.filter((item) => item.category === 'Work').length;
    const health = history.filter((item) => item.category === 'Health').length;
    const learning = history.filter((item) => item.category === 'Learning').length;
    const personal = history.filter((item) => item.category === 'Personal').length;
    const disciplineCount = history.filter((item) => item.repeat !== 'None').length;
    const onTimeCount = history.filter((item) => !item.dueAt || new Date(item.completedAt) <= new Date(item.dueAt)).length;
    const collaborationCount = history.filter((item) => item.category === 'Personal' || item.category === 'Learning').length;
    const peak = Math.max(work, health, learning, personal, disciplineCount, onTimeCount, collaborationCount, 1);
    const scale = (value) => Math.min(Math.round((value / peak) * 100), 100);

    return [
      { key: 'strength', icon: 'barbell-outline', label: t('characterStats.strength'), value: health, percent: scale(health) },
      { key: 'vitality', icon: 'heart-outline', label: t('characterStats.vitality'), value: personal, percent: scale(personal) },
      { key: 'wisdom', icon: 'book-outline', label: t('characterStats.wisdom'), value: learning, percent: scale(learning) },
      { key: 'focus', icon: 'flash-outline', label: t('characterStats.focus'), value: work, percent: scale(work) },
      { key: 'discipline', icon: 'shield-checkmark-outline', label: t('characterStats.discipline'), value: disciplineCount, percent: scale(disciplineCount) },
      { key: 'charisma', icon: 'people-outline', label: t('characterStats.charisma'), value: collaborationCount + onTimeCount, percent: scale(collaborationCount + onTimeCount) },
    ];
  }, [state.history, t]);

  const xpToNext = Math.max((state.user.xpGoal || 0) - (state.user.currentXp || 0), 0);
  const xpPercent = Math.min(Math.round(((state.user.currentXp || 0) / Math.max(state.user.xpGoal || 1, 1)) * 100), 100);

  return (
    <Screen withTabBarPadding>
      <GradientHeader withBack onBack={() => navigation.goBack()} title={t('characterStats.title')} subtitle={`${state.user.name} • ${titleLabel}`} />

      <View style={styles.row}>
        <StatBox icon="star" iconBg={theme.colors.yellowSoft} iconColor={theme.colors.yellow} value={`Lv. ${state.user.level}`} label={t('characterStats.level')} />
        <View style={styles.spacer} />
        <StatBox icon="sparkles-outline" iconBg={theme.colors.primarySoft} iconColor={theme.colors.primary} value={`${xpPercent}%`} label={t('characterStats.xpProgress')} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('characterStats.currentTitle')}</Text>
        <Text style={styles.titleValue}>{titleLabel}</Text>
        <Text style={styles.subText}>{t('characterStats.xpToNext', { xp: xpToNext })}</Text>
      </View>

      {stats.map((item) => (
        <StatBar
          key={item.key}
          icon={item.icon}
          label={item.label}
          value={String(item.value)}
          percent={item.percent}
          color={theme.colors.primary}
          helper={t('characterStats.helper')}
        />
      ))}
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  row: { flexDirection: 'row', marginTop: 14 },
  spacer: { width: 12 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 16, marginTop: 14, ...theme.shadow.card },
  sectionTitle: { color: theme.colors.textMuted, fontWeight: '700' },
  titleValue: { color: theme.colors.text, fontSize: 24, fontWeight: '900', marginTop: 6 },
  subText: { color: theme.colors.textMuted, marginTop: 6 },
});
