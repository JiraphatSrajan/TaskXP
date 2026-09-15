import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import Screen from '../components/Screen';
import { CollapsibleFAQ, GradientHeader } from '../components/UI';
import { useApp } from '../context/AppContext';

export default function HelpScreen({ navigation }) {
  const { theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState('faq-1');
  const faqs = useMemo(() => ([
    { id: 'faq-1', question: t('helpFaq.faq1q'), answer: t('helpFaq.faq1a') },
    { id: 'faq-2', question: t('helpFaq.faq2q'), answer: t('helpFaq.faq2a') },
    { id: 'faq-3', question: t('helpFaq.faq3q'), answer: t('helpFaq.faq3a') },
    { id: 'faq-4', question: t('helpFaq.faq4q'), answer: t('helpFaq.faq4a') },
    { id: 'faq-5', question: t('helpFaq.faq5q'), answer: t('helpFaq.faq5a') },
  ]), [t]);

  const items = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return faqs;
    return faqs.filter((item) => [item.question, item.answer].join(' ').toLowerCase().includes(lowered));
  }, [faqs, query]);

  return (
    <Screen withTabBarPadding>
      <GradientHeader withBack onBack={() => navigation.goBack()} title={t('helpFaq.title')} subtitle={t('helpFaq.subtitle')} />
      <TextInput
        style={styles.searchInput}
        placeholder={t('helpFaq.search')}
        placeholderTextColor={theme.colors.textSoft}
        value={query}
        onChangeText={setQuery}
      />

      {items.map((item) => (
        <CollapsibleFAQ key={item.id} item={item} expanded={expanded === item.id} onToggle={() => setExpanded((prev) => (prev === item.id ? null : item.id))} />
      ))}

      <Pressable style={styles.actionButton} onPress={() => Alert.alert(t('helpFaq.feedbackTitle'), t('helpFaq.feedbackBody'))}>
        <Text style={styles.actionText}>{t('helpFaq.sendFeedback')}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => Alert.alert(t('helpFaq.bugTitle'), t('helpFaq.bugBody'))}>
        <Text style={styles.secondaryText}>{t('helpFaq.reportBug')}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  searchInput: { backgroundColor: theme.colors.surface, borderRadius: 16, minHeight: 46, paddingHorizontal: 14, color: theme.colors.text, marginTop: 14, ...theme.shadow.card },
  actionButton: { backgroundColor: theme.colors.primary, borderRadius: 18, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  actionText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  secondaryButton: { backgroundColor: theme.colors.surface, borderRadius: 18, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10, ...theme.shadow.card },
  secondaryText: { color: theme.colors.text, fontWeight: '800' },
});
