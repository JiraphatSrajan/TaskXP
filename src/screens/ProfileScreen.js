import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { GradientHeader, HeaderIconButton, MenuRow, ProgressBar } from '../components/UI';
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

export default function ProfileScreen({ navigation }) {
  const { state, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, stats } = state;
  const titleLabel = resolveUserTitle(user, t);
  const hasFireBadge = (state.unlockedRewards || []).includes('icon_fire');
  const xpToNext = Math.max((user.xpGoal || 0) - (user.currentXp || 0), 0);

  return (
    <Screen withTabBarPadding>
      <GradientHeader title={t('profile.title')} rightAction={<HeaderIconButton icon="settings-outline" onPress={() => navigation.navigate('Settings')} label={t('settings.title')} />}>
        <View style={styles.profileHeaderContent}>
          <Pressable style={styles.avatarCircle} onPress={() => navigation.navigate('EditProfile')} accessibilityRole="button" accessibilityLabel={t('profile.editProfile')}>
            <Ionicons name="person" size={30} color={theme.colors.primaryDark} />
            {hasFireBadge ? <View style={styles.fireBadge}><Text style={styles.fireBadgeText}>🔥</Text></View> : null}
            <View style={styles.avatarEdit}><Ionicons name="create-outline" size={11} color={theme.colors.primary} /></View>
          </Pressable>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.profileTags}>
            <View style={styles.profileTag}><Text style={styles.profileTagText}>{t('common.level')} {user.level}</Text></View>
            <View style={styles.profileTag}><Text style={styles.profileTagText}>{titleLabel}</Text></View>
          </View>
        </View>
      </GradientHeader>

      <Pressable style={styles.xpCard} onPress={() => navigateToRoot(navigation, 'CharacterStats')}>
        <View style={styles.xpTopRow}>
          <View style={styles.xpTitleRow}>
            <Ionicons name="star" size={14} color={theme.colors.yellow} />
            <Text style={styles.xpTitle}>{t('profile.experiencePoints')}</Text>
          </View>
          <Text style={styles.xpNumber}>{user.currentXp} / {user.xpGoal} {t('common.xp')}</Text>
        </View>
        <ProgressBar value={user.currentXp} max={user.xpGoal} color={theme.colors.yellow} />
        <Text style={styles.xpHint}>{t('profile.xpUntilLevel', { xp: xpToNext, level: user.level + 1 })}</Text>
      </Pressable>

      <View style={styles.statsRow}>
        <View style={styles.statMini}><Text style={styles.statMiniValue}>{stats.completedCount}</Text><Text style={styles.statMiniLabel}>{t('profile.completed')}</Text></View>
        <Pressable style={styles.statMini} onPress={() => navigateToRoot(navigation, 'StreakDetail')}><Text style={[styles.statMiniValue, { color: theme.colors.orange }]}>{user.currentStreak}</Text><Text style={styles.statMiniLabel}>{t('profile.dayStreak')}</Text></Pressable>
        <Pressable style={styles.statMini} onPress={() => navigateToRoot(navigation, 'CharacterStats')}><Text style={[styles.statMiniValue, { color: theme.colors.orange }]}>{(user.totalXp / 1000).toFixed(1)}k</Text><Text style={styles.statMiniLabel}>{t('profile.totalXp')}</Text></Pressable>
      </View>

      <MenuRow icon="time-outline" iconBg={theme.colors.blueSoft} label={state.settings.language === 'Thai' ? 'ประวัติภารกิจ' : 'Quest History'} onPress={() => navigateToRoot(navigation, 'QuestHistory')} />
      <MenuRow icon="flame-outline" iconBg={theme.colors.orangeSoft} label={state.settings.language === 'Thai' ? 'รายละเอียดสตรีค' : 'Streak Details'} onPress={() => navigateToRoot(navigation, 'StreakDetail')} />
      <MenuRow icon="bar-chart-outline" iconBg={theme.colors.greenSoft} label={state.settings.language === 'Thai' ? 'ค่าสถานะตัวละคร' : 'Character Stats'} onPress={() => navigateToRoot(navigation, 'CharacterStats')} />
      <MenuRow icon="create-outline" iconBg={theme.colors.blueSoft} label={t('profile.editProfile')} onPress={() => navigation.navigate('EditProfile')} />
      <MenuRow icon="gift-outline" iconBg={theme.colors.lilacSoft} label={t('rewardShop.title')} onPress={() => navigateToRoot(navigation, 'RewardShop')} />
      <MenuRow icon="people-outline" iconBg={theme.colors.greenSoft} label={t('friends.title')} onPress={() => navigation.navigate('FriendsTab')} />
      <MenuRow icon="trophy-outline" iconBg={theme.colors.yellowSoft} label={t('profile.achievements')} onPress={() => navigation.navigate('Achievements')} noBorder />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  profileHeaderContent: { alignItems: 'center', marginTop: 6 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: 'rgba(255,255,255,0.34)', backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fireBadge: { position: 'absolute', top: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  fireBadgeText: { fontSize: 14 },
  avatarEdit: { position: 'absolute', right: -2, bottom: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  userName: { marginTop: 16, fontSize: 28, fontWeight: '800', color: 'white' },
  userEmail: { color: 'rgba(255,255,255,0.74)', marginTop: 6, fontSize: 12 },
  profileTags: { flexDirection: 'row', marginTop: 14 },
  profileTag: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginHorizontal: 4 },
  profileTagText: { color: 'white', fontWeight: '700', fontSize: 12 },
  xpCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginTop: 14, ...theme.shadow.card },
  xpTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  xpTitleRow: { flexDirection: 'row', alignItems: 'center' },
  xpTitle: { marginLeft: 8, color: theme.colors.text, fontWeight: '700', fontSize: 13 },
  xpNumber: { color: theme.colors.text, fontWeight: '800', fontSize: 13, marginLeft: 8 },
  xpHint: { marginTop: 8, color: theme.colors.textMuted, fontSize: 11 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 2 },
  statMini: { width: '31%', backgroundColor: theme.colors.surface, paddingVertical: 14, borderRadius: 18, alignItems: 'center', ...theme.shadow.card },
  statMiniValue: { fontSize: 22, fontWeight: '800', color: theme.colors.primary },
  statMiniLabel: { marginTop: 4, color: theme.colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center', paddingHorizontal: 6 },
});
