import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { FilterChip, GradientHeader, Pill } from '../components/UI';
import { categoryMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { formatShortTime, formatSlashDate, getMonthKey, getStartOfWeek, getTodayKey, toDate } from '../utils/formatters';

export default function QuestHistoryScreen({ navigation }) {
  const { state, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const filters = useMemo(() => ([
    { key: 'All', label: t('questHistory.filterAll') },
    { key: 'Today', label: t('questHistory.filterToday') },
    { key: 'This Week', label: t('questHistory.filterWeek') },
    { key: 'This Month', label: t('questHistory.filterMonth') },
  ]), [t]);

  const data = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const todayKey = getTodayKey(new Date());
    const weekStartKey = getTodayKey(getStartOfWeek(new Date()));
    const monthKey = getMonthKey(new Date());

    return [...state.history]
      .filter((item) => {
        const completedDate = toDate(item.completedAt);
        if (!completedDate) return false;
        if (activeFilter === 'Today' && getTodayKey(completedDate) !== todayKey) return false;
        if (activeFilter === 'This Week' && getTodayKey(getStartOfWeek(completedDate)) !== weekStartKey) return false;
        if (activeFilter === 'This Month' && getMonthKey(completedDate) !== monthKey) return false;
        if (!lowered) return true;
        return [item.title, item.category, item.repeat].join(' ').toLowerCase().includes(lowered);
      })
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [activeFilter, query, state.history]);

  const totalXp = data.reduce((sum, item) => sum + (Number(item.xp) || 0), 0);

  return (
    <Screen scroll={false} withTabBarPadding>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <>
            <GradientHeader withBack onBack={() => navigation.goBack()} title={t('questHistory.title')} subtitle={t('questHistory.subtitle', { count: data.length, xp: totalXp })} />
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('questHistory.search')}
                placeholderTextColor={theme.colors.textSoft}
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <View style={styles.filterRow}>
              {filters.map((filter) => (
                <FilterChip key={filter.key} label={filter.label} active={activeFilter === filter.key} onPress={() => setActiveFilter(filter.key)} />
              ))}
            </View>
          </>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const meta = categoryMeta[item.category] || categoryMeta.Work;
          const isLate = item.dueAt && new Date(item.completedAt) > new Date(item.dueAt);
          return (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <View style={[styles.iconWrap, { backgroundColor: theme.colors[meta.bgKey] }]}> 
                  <Ionicons name={meta.icon} size={16} color={theme.colors[meta.colorKey]} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>{formatSlashDate(item.completedAt)} • {formatShortTime(item.completedAt)}</Text>
                </View>
                <Text style={styles.xp}>+{item.xp}</Text>
              </View>
              <View style={styles.tagsRow}>
                <Pill label={t(`category.${item.category}`)} backgroundColor={theme.colors[meta.bgKey]} color={theme.colors[meta.colorKey]} />
                <Pill label={t(`repeat.${item.repeat}`)} backgroundColor={theme.colors.surfaceMuted} color={theme.colors.textMuted} style={styles.tagGap} />
                {isLate ? <Pill label={t('questHistory.late')} backgroundColor={theme.colors.orangeSoft} color={theme.colors.orange} style={styles.tagGap} /> : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={(
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('questHistory.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('questHistory.emptyText')}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  listContent: { paddingBottom: 20 },
  searchWrap: { backgroundColor: theme.colors.surface, borderRadius: 16, minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginTop: 14, ...theme.shadow.card },
  searchInput: { flex: 1, marginLeft: 8, color: theme.colors.text },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 14, ...theme.shadow.card },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 10 },
  title: { color: theme.colors.text, fontWeight: '900', fontSize: 15 },
  meta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12 },
  xp: { color: theme.colors.primary, fontWeight: '900', fontSize: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  tagGap: { marginLeft: 8 },
  emptyCard: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 18, marginTop: 14, ...theme.shadow.card },
  emptyTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
  emptyText: { color: theme.colors.textMuted, marginTop: 8, lineHeight: 20 },
});
