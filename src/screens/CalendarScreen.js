import React, { useMemo, useState } from 'react';
import { Calendar } from 'react-native-calendars';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { Pill } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getLocalDateKey, getMonthKey, getTodayKey, toDate } from '../utils/formatters';

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

export default function CalendarScreen({ navigation }) {
  const { state, completeTask, undoCompleteTask, theme, locale, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedDate, setSelectedDate] = useState(getTodayKey(new Date()));

  const daySummary = useMemo(() => {
    const marks = {};
    state.tasks.forEach((task) => {
      const dateKey = getLocalDateKey(task.dueAt);
      if (!dateKey) return;
      if (!marks[dateKey]) marks[dateKey] = { todos: [], allDone: true };
      marks[dateKey].todos.push(task);
      if (!task.completed) marks[dateKey].allDone = false;
    });
    return marks;
  }, [state.tasks]);

  const selectedTasks = useMemo(() => {
    const tasks = daySummary[selectedDate]?.todos || [];
    return [...tasks].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  }, [daySummary, selectedDate]);

  const monthLabel = useMemo(() => {
    const date = toDate(`${selectedDate}T12:00:00`, new Date());
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [locale, selectedDate]);

  const monthStats = useMemo(() => {
    const monthKey = selectedDate.slice(0, 7);
    const monthTodos = state.tasks.filter((task) => getMonthKey(task.dueAt) === monthKey);
    const done = monthTodos.filter((task) => task.completed).length;
    return { total: monthTodos.length, done };
  }, [selectedDate, state.tasks]);

  const handleComplete = (taskId) => {
    const result = completeTask(taskId);
    if (result?.ok) navigateToRoot(navigation, 'QuestComplete', result);
  };

  const renderTaskItem = ({ item }) => {
    const priorityStyle = {
      High: { backgroundColor: theme.colors.orangeSoft, color: theme.colors.orange },
      Medium: { backgroundColor: theme.colors.yellowSoft, color: theme.colors.yellow },
      Low: { backgroundColor: theme.colors.surfaceMuted, color: theme.colors.textMuted },
    }[item.priority] || { backgroundColor: theme.colors.surfaceMuted, color: theme.colors.textMuted };

    return (
      <View style={styles.taskRow}>
        <Pressable style={[styles.checkboxButton, item.completed && styles.checkboxButtonDone]} onPress={() => (item.completed ? undoCompleteTask(item.id) : handleComplete(item.id))}>
          <Text style={styles.checkboxLabel}>{item.completed ? '✓' : '○'}</Text>
        </Pressable>

        <Pressable style={styles.taskContent} onPress={() => navigateToRoot(navigation, 'QuestDetail', { taskId: item.id })}>
          <Text style={[styles.taskTitle, item.completed && styles.taskTitleDone]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.taskMetaRow}>
            <Pill label={item.priority} backgroundColor={priorityStyle.backgroundColor} color={priorityStyle.color} />
            <Text style={styles.taskXp}>+{item.xp} XP</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <Screen scroll={false} withTabBarPadding>
      <FlatList
        data={selectedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={(
          <>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>📅 {t('calendar.title')}</Text>
                <Text style={styles.headerSubtitle}>{monthLabel}</Text>
              </View>
            </View>

            <View style={styles.statsBar}>
              <Text style={styles.statsText}>🔥 {t('calendar.streak')}: {t('common.days', { count: state.user.currentStreak })}</Text>
              <Text style={styles.statsText}>{t('calendar.monthlyDone', { done: monthStats.done, total: monthStats.total })}</Text>
            </View>

            <View style={styles.calendarCard}>
              <Calendar
                current={selectedDate}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                renderArrow={(direction) => <Text style={styles.arrow}>{direction === 'left' ? '‹' : '›'}</Text>}
                theme={{
                  calendarBackground: theme.colors.surface,
                  monthTextColor: theme.colors.text,
                  dayTextColor: theme.colors.text,
                  textDisabledColor: theme.colors.textSoft,
                  todayTextColor: theme.colors.primary,
                  arrowColor: theme.colors.primary,
                }}
                dayComponent={({ date }) => {
                  const dateKey = date?.dateString;
                  const summary = daySummary[dateKey] || null;
                  const isSelected = dateKey === selectedDate;
                  const isToday = dateKey === getTodayKey(new Date());
                  const allDone = Boolean(summary?.todos?.length) && summary?.allDone;
                  const hasTodos = Boolean(summary?.todos?.length);

                  return (
                    <Pressable onPress={() => setSelectedDate(dateKey)} style={styles.dayPressable}>
                      <View style={[styles.dayContainer, allDone && styles.dayContainerDone, isSelected && styles.dayContainerSelected, isToday && styles.dayContainerToday]}>
                        <Text style={[styles.dayText, (allDone || isSelected) && styles.dayTextSelected]}>{date?.day}</Text>
                        {!allDone && hasTodos ? <View style={styles.dayDot} /> : null}
                      </View>
                    </Pressable>
                  );
                }}
              />
            </View>

            <View style={styles.dividerWrap}><View style={styles.dragHandle} /></View>

            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>📋 {t('calendar.tasksOnDate', { date: selectedDate })}</Text>
              <Pressable style={styles.addButton} onPress={() => navigateToRoot(navigation, 'AddQuestModal', { prefillDate: `${selectedDate}T12:00:00` })}>
                <Text style={styles.addButtonText}>＋</Text>
              </Pressable>
            </View>
          </>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}><Text style={styles.emptyText}>{t('calendar.noTasks')}</Text></View>
        )}
      />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: theme.colors.text, fontSize: 28, fontWeight: '900' },
  headerSubtitle: { color: theme.colors.textMuted, marginTop: 6, fontSize: 13 },
  statsBar: { marginTop: 14, backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', ...theme.shadow.card },
  statsText: { color: theme.colors.text, fontSize: 12, fontWeight: '700', width: '48%' },
  calendarCard: { marginTop: 14, backgroundColor: theme.colors.surface, borderRadius: 22, padding: 8, ...theme.shadow.card },
  arrow: { fontSize: 26, color: theme.colors.primary, fontWeight: '700' },
  dayPressable: { alignItems: 'center', justifyContent: 'center' },
  dayContainer: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayContainerSelected: { backgroundColor: theme.colors.primary },
  dayContainerToday: { borderWidth: 1, borderColor: theme.colors.primary },
  dayContainerDone: { backgroundColor: theme.colors.green },
  dayText: { color: theme.colors.text, fontWeight: '700' },
  dayTextSelected: { color: '#FFFFFF' },
  dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.orange, position: 'absolute', bottom: 4 },
  dividerWrap: { alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 56, height: 5, borderRadius: 999, backgroundColor: theme.colors.border },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  panelTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 16 },
  addButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 22 },
  taskRow: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', ...theme.shadow.card },
  checkboxButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: theme.colors.surfaceMuted },
  checkboxButtonDone: { backgroundColor: theme.colors.green, borderColor: theme.colors.green },
  checkboxLabel: { color: '#FFFFFF', fontWeight: '900' },
  taskContent: { flex: 1 },
  taskTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 15 },
  taskTitleDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  taskMetaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  taskXp: { color: theme.colors.textMuted, fontWeight: '700', marginLeft: 10 },
  separator: { height: 10 },
  emptyState: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 16, ...theme.shadow.card },
  emptyText: { color: theme.colors.textMuted },
});
