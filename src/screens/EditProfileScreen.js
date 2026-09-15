import React, { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import Screen from '../components/Screen';
import { GradientHeader } from '../components/UI';
import { useApp } from '../context/AppContext';
import { resolveUserTitle } from '../utils/profile';

export default function EditProfileScreen({ navigation }) {
  const { state, updateProfile, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [title, setTitle] = useState(resolveUserTitle(state.user, t));
  const [errors, setErrors] = useState({});

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedTitle = title.trim();
    const nextErrors = {};

    if (!trimmedName) {
      nextErrors.name = t('errors.profileNameRequired');
    }

    if (!trimmedEmail) {
      nextErrors.email = t('errors.validEmail');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = t('errors.validEmail');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    updateProfile({
      name: trimmedName,
      email: trimmedEmail,
      title: trimmedTitle,
    });
    navigation.goBack();
  };

  return (
    <Screen scroll keyboardAware withTabBarPadding>
      <GradientHeader withBack onBack={() => navigation.goBack()} title={t('editProfile.title')} />

      <Text style={styles.label}>{t('editProfile.name')}</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        value={name}
        onChangeText={setName}
        placeholder={t('editProfile.namePlaceholder')}
        placeholderTextColor={theme.colors.textSoft}
        returnKeyType="next"
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

      <Text style={styles.label}>{t('editProfile.email')}</Text>
      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        value={email}
        onChangeText={setEmail}
        placeholder={t('editProfile.emailPlaceholder')}
        placeholderTextColor={theme.colors.textSoft}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <Text style={styles.label}>{t('editProfile.profileTitle')}</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={t('editProfile.titlePlaceholder')}
        placeholderTextColor={theme.colors.textSoft}
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <Pressable style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]} onPress={handleSave} accessibilityRole="button">
        <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.saveBtnInner}>
          <Text style={styles.saveBtnText}>{t('editProfile.saveChanges')}</Text>
        </LinearGradient>
      </Pressable>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  label: { color: theme.colors.text, fontWeight: '700', marginBottom: 8, marginTop: 10, fontSize: 12 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 14, fontSize: 13, color: theme.colors.text },
  inputError: { borderColor: theme.colors.danger },
  errorText: { color: theme.colors.danger, fontSize: 12, fontWeight: '700', marginTop: 8 },
  saveBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  saveBtnPressed: { opacity: 0.92 },
  saveBtnInner: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
