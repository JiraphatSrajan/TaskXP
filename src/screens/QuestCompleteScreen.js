import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { GradientHeader } from '../components/UI';
import { useApp } from '../context/AppContext';

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

export default function QuestCompleteScreen({ navigation, route }) {
  const { undoCompleteTask, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { taskId, xpEarned = 0, didLevelUp, newLevel, didUnlockAchievement, doubleExpUsed, currentStreak, achievementBonusXp = 0 } = route.params || {};
  const countAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const listener = countAnim.addListener(({ value }) => setCount(Math.round(value)));
    const animation = Animated.parallel([
      Animated.timing(countAnim, {
        toValue: xpEarned,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
      ])),
    ]);

    animation.start();

    return () => {
      animation.stop();
      countAnim.removeListener(listener);
    };
  }, [countAnim, glowAnim, xpEarned]);

  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });

  const goHome = () => {
    navigateToRoot(navigation, 'MainTabs', { screen: 'HomeTab' });
  };

  const closeModal = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    goHome();
  };

  return (
    <Screen withTabBarPadding>
      <GradientHeader withBack onBack={closeModal} title={t('questComplete.title')} subtitle={t('questComplete.subtitle')} />

      <View style={styles.centerWrap}>
        <Animated.View style={[styles.burst, { transform: [{ scale: glowScale }] }]}> 
          <Text style={styles.burstEmoji}>⚔️</Text>
        </Animated.View>
        <Text style={styles.title}>{t('questComplete.headline')}</Text>
        <Text style={styles.subtitle}>{t('questComplete.description')}</Text>

        <Text style={styles.xpLabel}>{t('questComplete.xpEarned')}</Text>
        <Text style={styles.xpValue}>+{count} XP</Text>

        {doubleExpUsed ? <Text style={styles.highlight}>{t('questComplete.doubleXp')}</Text> : null}
        {didLevelUp ? <Text style={styles.levelUp}>{t('questComplete.levelUp', { level: newLevel })}</Text> : null}
        {didUnlockAchievement ? <Text style={styles.highlight}>{t('questComplete.achievement')}</Text> : null}
        {achievementBonusXp > 0 ? <Text style={styles.bonusText}>{t('questComplete.achievementBonus', { xp: achievementBonusXp })}</Text> : null}
        {currentStreak ? <Text style={styles.streak}>{t('questComplete.streak', { days: t('common.days', { count: currentStreak }) })}</Text> : null}
      </View>

      <Pressable style={styles.primaryButton} onPress={goHome}>
        <Text style={styles.primaryButtonText}>{t('questComplete.continue')}</Text>
      </Pressable>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => {
          if (taskId) {
            undoCompleteTask(taskId);
          }
          closeModal();
        }}
      >
        <Text style={styles.secondaryButtonText}>{t('questComplete.undo')}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  centerWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 28, paddingHorizontal: 18 },
  burst: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  burstEmoji: { fontSize: 44 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  xpLabel: { color: theme.colors.textSoft, fontWeight: '700', marginTop: 24 },
  xpValue: { color: theme.colors.primary, fontSize: 40, fontWeight: '900', marginTop: 4 },
  highlight: { color: theme.colors.yellow, fontWeight: '900', marginTop: 12, fontSize: 16 },
  levelUp: { color: theme.colors.orange, fontWeight: '900', marginTop: 12, fontSize: 18 },
  streak: { color: theme.colors.text, fontWeight: '800', marginTop: 12 },
  bonusText: { color: theme.colors.textMuted, fontWeight: '700', marginTop: 8 },
  primaryButton: { marginTop: 28, backgroundColor: theme.colors.primary, borderRadius: 18, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  secondaryButton: { marginTop: 12, backgroundColor: theme.colors.surface, borderRadius: 18, minHeight: 50, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card },
  secondaryButtonText: { color: theme.colors.text, fontWeight: '800', fontSize: 14 },
});
