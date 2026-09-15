import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Screen from '../components/Screen';
import { AchievementCard, GradientHeader, StatBox } from '../components/UI';
import { useApp } from '../context/AppContext';

const ACHIEVEMENTS = [
  { id: '1', emoji: '⚔️', xp: 50, titleEn: 'First Quest', titleTh: 'ภารกิจแรก', descEn: 'Complete 1 quest', descTh: 'ทำภารกิจให้สำเร็จ 1 ครั้ง', bg: 'yellowSoft' },
  { id: '2', emoji: '🔥', xp: 120, titleEn: '7-Day Streak', titleTh: 'สตรีค 7 วัน', descEn: 'Reach a 7 day streak', descTh: 'มีสตรีคครบ 7 วัน', bg: 'orangeSoft' },
  { id: '3', emoji: '📚', xp: 180, titleEn: 'Quest Grinder', titleTh: 'นักเก็บเควสต์', descEn: 'Complete 50 quests', descTh: 'ทำภารกิจครบ 50 ครั้ง', bg: 'blueSoft' },
  { id: '4', emoji: '👑', xp: 300, titleEn: 'Centurion', titleTh: 'เซ็นจูเรียน', descEn: 'Complete 100 quests', descTh: 'ทำภารกิจครบ 100 ครั้ง', bg: 'lilacSoft' },
  { id: '5', emoji: '⏰', xp: 150, titleEn: 'On Time Hero', titleTh: 'ฮีโร่ตรงเวลา', descEn: 'Finish 30 quests before due time', descTh: 'ทำภารกิจตรงเวลา 30 ครั้ง', bg: 'greenSoft' },
  { id: '6', emoji: '💪', xp: 180, titleEn: 'Health Master', titleTh: 'สายสุขภาพ', descEn: 'Complete 50 health quests', descTh: 'ทำภารกิจหมวดสุขภาพครบ 50 ครั้ง', bg: 'pinkSoft' },
];

export default function AchievementsScreen({ navigation }) {
  const { state, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isThai = state.settings.language === 'Thai';

  const achievementStates = useMemo(() => {
    const completedCount = state.history.length;
    const onTimeCount = state.history.filter((item) => !item.dueAt || new Date(item.completedAt) <= new Date(item.dueAt)).length;
    const healthCount = state.history.filter((item) => item.category === 'Health').length;

    const unlockedMap = {
      '1': completedCount >= 1,
      '2': state.user.currentStreak >= 7,
      '3': completedCount >= 50,
      '4': completedCount >= 100,
      '5': onTimeCount >= 30,
      '6': healthCount >= 50,
    };

    return ACHIEVEMENTS.map((item) => ({
      ...item,
      title: isThai ? item.titleTh : item.titleEn,
      description: isThai ? item.descTh : item.descEn,
      unlocked: unlockedMap[item.id],
      granted: (state.grantedAchievements || []).includes(item.id),
      bg: theme.colors[item.bg],
    }));
  }, [isThai, state.grantedAchievements, state.history, state.user.currentStreak, theme.colors]);

  const unlockedCount = achievementStates.filter((item) => item.unlocked).length;
  const grantedCount = (state.grantedAchievements || []).length;

  return (
    <Screen withTabBarPadding>
      <GradientHeader withBack onBack={() => navigation.goBack()} title={t('achievements.title')} subtitle={t('achievements.subtitle')} />

      <View style={styles.summaryRow}>
        <StatBox icon="trophy-outline" iconBg={theme.colors.yellowSoft} iconColor={theme.colors.yellow} value={`${unlockedCount}/${achievementStates.length}`} label={isThai ? 'ปลดล็อกแล้ว' : 'Unlocked'} containerStyle={styles.summaryCard} />
        <View style={styles.summarySpacer} />
        <StatBox icon="star-outline" iconBg={theme.colors.primarySoft} iconColor={theme.colors.primary} value={`${grantedCount}`} label={isThai ? 'รับ XP แล้ว' : 'XP Granted'} containerStyle={styles.summaryCard} />
      </View>

      <View style={styles.grid}>
        {achievementStates.map((item) => <AchievementCard key={item.id} item={item} />)}
      </View>
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  summaryRow: { flexDirection: 'row', marginTop: 14, marginBottom: 14 },
  summarySpacer: { width: 12 },
  summaryCard: { minHeight: 82 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
});
