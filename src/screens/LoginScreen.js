import React, { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { login, state, theme, t, demoPassword } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const passwordRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    const result = await login({ email, password });
    if (!result?.ok) {
      setError(result?.errorKey ? t(result.errorKey) : t('login.unableToSignIn'));
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    const result = await login({ provider: 'demo-google' });
    if (!result?.ok) {
      setError(t('login.unableToContinueGoogle'));
    }
    setIsSubmitting(false);
  };

  return (
    <Screen scroll keyboardAware style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <View style={styles.logoWrap}>
          <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.logoCard}>
            <Ionicons name="sparkles-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
        </View>
        <Text style={styles.brand}>TaskXP</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.demoHint}>{t('login.demoCredentials', { email: state.auth.email, password: demoPassword })}</Text>

        <Text style={styles.label}>{t('login.email')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('editProfile.emailPlaceholder')}
          placeholderTextColor={theme.colors.textSoft}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <Text style={styles.label}>{t('login.password')}</Text>
        <TextInput
          ref={passwordRef}
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={theme.colors.textSoft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.loginBtn, isSubmitting && styles.buttonDisabled, pressed && !isSubmitting && styles.buttonPressed]}
          onPress={handleLogin}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('login.login')}
        >
          <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.loginBtnInner}>
            <Text style={styles.loginBtnText}>{isSubmitting ? t('login.signingIn') : t('login.login')}</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.dividerWrap}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t('login.orContinueWith')}</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.googleBtn, isSubmitting && styles.buttonDisabled, pressed && !isSubmitting && styles.buttonPressed]}
          onPress={handleGoogleLogin}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('login.continueWithGoogle')}
        >
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text style={styles.googleText}>{t('login.continueWithGoogle')}</Text>
        </Pressable>

        <Text style={styles.footerText}>{t('login.localDemoOnly')}</Text>
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  logoCard: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: 6,
    left: '38%',
    color: theme.colors.yellow,
    fontSize: 12,
  },
  sparkleRight: {
    top: 12,
    left: '62%',
  },
  brand: {
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: theme.colors.blue,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    marginTop: 8,
    marginBottom: 26,
    fontSize: 14,
  },
  form: {
    marginTop: 8,
  },
  demoHint: {
    backgroundColor: theme.colors.yellowSoft,
    color: theme.dark ? theme.colors.yellow : '#7B5500',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 6,
    lineHeight: 16,
  },
  label: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 13,
    color: theme.colors.text,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  loginBtn: {
    marginTop: 18,
    borderRadius: 13,
    overflow: 'hidden',
  },
  loginBtnInner: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  googleBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 13,
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    marginLeft: 10,
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontWeight: '700',
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
