import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { useApp } from '../context/AppContext';

export default function OnboardingScreen() {
  const { finishOnboarding, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen scroll={false} style={styles.screenContent}>
      <Pressable style={styles.skipButton} onPress={finishOnboarding}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </Pressable>

      <View style={styles.centerContent}>
        <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.logoCircle}>
          <Ionicons name="sparkles-outline" size={44} color="#FFFFFF" />
        </LinearGradient>

        <Text style={styles.title}>{t('onboarding.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
      </View>

      <Pressable style={styles.buttonOuter} onPress={finishOnboarding}>
        <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.buttonInner}>
          <Text style={styles.buttonText}>{t('onboarding.getStarted')}</Text>
        </LinearGradient>
      </Pressable>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  screenContent: {
    paddingHorizontal: 26,
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 46,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  skipText: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.fabShadow,
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  title: {
    marginTop: 36,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 18,
    maxWidth: 280,
    fontSize: 16,
    lineHeight: 27,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  buttonOuter: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  buttonInner: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
