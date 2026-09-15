import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { GradientHeader, Pill } from '../components/UI';
import { categoryMeta, priorityMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { formatShortTime, formatSlashDate, getTodayKey, toDate } from '../utils/formatters';

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

const getStatus = (task, t, now = new Date()) => {
  if (!task) return { key: 'missing', label: t('questDetail.statusMissing'), icon: 'help-circle-outline' };
  if (task.completed) return { key: 'completed', label: t('questDetail.statusCompleted'), icon: 'checkmark-circle' };
  const dueAt = toDate(task.dueAt);
  if (dueAt && dueAt < now) return { key: 'overdue', label: t('questDetail.statusOverdue'), icon: 'alert-circle' };
  return { key: 'active', label: t('questDetail.statusActive'), icon: 'flash' };
};

const getRepeatLabel = (repeat, t) => {
  if (repeat === 'Daily') return t('questDetail.repeatDaily');
  if (repeat === 'Weekly') return t('questDetail.repeatWeekly');
  if (repeat === 'Monthly') return t('questDetail.repeatMonthly');
  return t('questDetail.repeatNone');
};

export default function QuestDetailScreen({ navigation, route }) {
  const { state, theme, completeTask, undoCompleteTask, deleteTask, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const taskId = route.params?.taskId;
  const task = state.tasks.find((item) => item.id === taskId) || null;
  const status = getStatus(task, t);
  const category = task ? (categoryMeta[task.category] || categoryMeta.Work) : categoryMeta.Work;
  const priority = task ? (priorityMeta[task.priority] || priorityMeta.Medium) : priorityMeta.Medium;

  if (!task) {
    return (
      <Screen>
        <GradientHeader withBack onBack={() => navigation.goBack()} title={t('questDetail.title')} />
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t('questDetail.notFound')}</Text>
          <Text style={styles.emptyText}>{t('questDetail.notFoundText')}</Text>
        </View>
      </Screen>
    );
  }

  const handleComplete = () => {
    const result = completeTask(task.id);
    if (!result?.ok) return;
    navigateToRoot(navigation, 'QuestComplete', result);
  };

  const handleDelete = () => {
    Alert.alert(t('tasks.deleteTitle'), t('tasks.deleteMessage', { title: task.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tasks.delete'),
        style: 'destructive',
        onPress: () => {
          deleteTask(task.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const dueDate = formatSlashDate(task.dueAt);
  const dueTime = formatShortTime(task.dueAt, state.settings.language === 'Thai' ? 'th-TH' : 'en-US');

  return (
    <Screen withTabBarPadding>
      <GradientHeader withBack onBack={() => navigation.goBack()} title={t('questDetail.title')} subtitle={task.title} />

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors[category.bgKey] }]}> 
            <Ionicons name={category.icon} size={20} color={theme.colors[category.colorKey]} />
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.subtitle}>{task.description || t('questDetail.noDescription')}</Text>
          </View>
        </View>

        <View style={styles.metaWrap}>
          <Pill label={t(`category.${task.category}`)} backgroundColor={theme.colors[category.bgKey]} color={theme.colors[category.colorKey]} />
          <Pill label={t(`priority.${task.priority}`)} backgroundColor={theme.colors[priority.bgKey]} color={theme.colors[priority.colorKey]} style={styles.metaPill} />
          <Pill label={status.label} backgroundColor={status.key === 'completed' ? theme.colors.greenSoft : status.key === 'overdue' ? theme.colors.orangeSoft : theme.colors.primarySoft} color={status.key === 'completed' ? theme.colors.green : status.key === 'overdue' ? theme.colors.orange : theme.colors.primary} style={styles.metaPill} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('questDetail.xpReward')}</Text>
          <Text style={styles.infoValue}>+{task.xp} XP</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('questDetail.dueDate')}</Text>
          <Text style={styles.infoValue}>{dueDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('questDetail.dueTime')}</Text>
          <Text style={styles.infoValue}>{dueTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('questDetail.repeat')}</Text>
          <Text style={styles.infoValue}>{t(`repeat.${task.repeat}`)}</Text>
        </View>
        <View style={styles.infoRowNoBorder}>
          <Text style={styles.infoLabel}>{t('questDetail.repeatSchedule')}</Text>
          <Text style={styles.infoValue}>{getRepeatLabel(task.repeat, t)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Ionicons name={status.icon} size={18} color={status.key === 'completed' ? theme.colors.green : status.key === 'overdue' ? theme.colors.orange : theme.colors.primary} />
          <Text style={styles.statusText}>{status.label}</Text>
          <Text style={styles.statusHint}>{t('questDetail.created', { date: formatSlashDate(task.createdAt) })}</Text>
        </View>
        {task.completedAt ? <Text style={styles.historyText}>{t('questDetail.completedOn', { date: formatSlashDate(task.completedAt), time: formatShortTime(task.completedAt) })}</Text> : null}
      </View>

      <View style={styles.actionsGrid}>
        <Pressable style={[styles.primaryButton, task.completed && styles.disabledButton]} onPress={task.completed ? undefined : handleComplete} disabled={task.completed}>
          <Text style={styles.primaryButtonText}>{t('questDetail.complete')}</Text>
        </Pressable>
        {task.completed ? (
          <Pressable style={styles.secondaryButton} onPress={() => undoCompleteTask(task.id)}>
            <Text style={styles.secondaryButtonText}>{t('tasks.undo')}</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.secondaryButton} onPress={() => navigateToRoot(navigation, 'AddQuestModal', { taskId: task.id })}>
          <Text style={styles.secondaryButtonText}>{t('tasks.edit')}</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, styles.deleteButton]} onPress={handleDelete}>
          <Text style={[styles.secondaryButtonText, styles.deleteText]}>{t('tasks.delete')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
    ...theme.shadow.card,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  titleCopy: { flex: 1, marginLeft: 12 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 },
  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  metaPill: { marginLeft: 8, marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  infoRowNoBorder: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  infoLabel: { color: theme.colors.textMuted, fontWeight: '700' },
  infoValue: { color: theme.colors.text, fontWeight: '800', maxWidth: '58%', textAlign: 'right' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusText: { color: theme.colors.text, fontWeight: '800', marginLeft: 8 },
  statusHint: { marginLeft: 'auto', color: theme.colors.textSoft, fontSize: 12, fontWeight: '600' },
  historyText: { marginTop: 10, color: theme.colors.textMuted, lineHeight: 20 },
  actionsGrid: { marginTop: 16, paddingBottom: 6 },
  primaryButton: { backgroundColor: theme.colors.primary, borderRadius: 18, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  secondaryButton: { backgroundColor: theme.colors.surface, borderRadius: 18, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10, ...theme.shadow.card },
  secondaryButtonText: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
  deleteButton: { borderWidth: 1, borderColor: theme.colors.danger },
  deleteText: { color: theme.colors.danger },
  disabledButton: { opacity: 0.5 },
  emptyCard: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 18, marginTop: 14, ...theme.shadow.card },
  emptyTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
  emptyText: { color: theme.colors.textMuted, marginTop: 8, lineHeight: 20 },
});
