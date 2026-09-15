import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import { FilterChip, GradientHeader, TaskCard, UndoBanner } from '../components/UI';
import { useApp } from '../context/AppContext';

const FILTERS = ['All', 'Daily', 'Weekly', 'Monthly', 'Completed'];

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

export default function TasksScreen({ navigation }) {
  const { state, completeTask, deleteTask, undoCompleteTask, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [lastCompletedTaskId, setLastCompletedTaskId] = useState(null);

  const filteredTasks = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return state.tasks
      .filter((task) => {
        if (activeFilter === 'Daily' && task.repeat !== 'Daily') return false;
        if (activeFilter === 'Weekly' && task.repeat !== 'Weekly') return false;
        if (activeFilter === 'Monthly' && task.repeat !== 'Monthly') return false;
        if (activeFilter === 'Completed' && !task.completed) return false;
        if (!lowered) return true;
        return [task.title, task.description, task.category].join(' ').toLowerCase().includes(lowered);
      })
      .slice()
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.dueAt) - new Date(b.dueAt);
      });
  }, [activeFilter, query, state.tasks]);

  const lastCompletedTask = useMemo(
    () => state.tasks.find((task) => task.id === lastCompletedTaskId && task.completed) || null,
    [lastCompletedTaskId, state.tasks],
  );

  const handleComplete = (taskId) => {
    const result = completeTask(taskId);
    if (!result?.ok) return;
    setLastCompletedTaskId(taskId);
    navigateToRoot(navigation, 'QuestComplete', result);
  };

  const handleUndo = (taskId) => {
    undoCompleteTask(taskId);
    if (lastCompletedTaskId === taskId) setLastCompletedTaskId(null);
  };

  const handleDelete = (taskId, taskTitle) => {
    const title = state.settings.language === 'Thai' ? 'ย้ายไปถังขยะ?' : 'Move to trash?';
    const message = state.settings.language === 'Thai'
      ? `"${taskTitle}" จะถูกย้ายไปถังขยะ และลบถาวรอัตโนมัติภายใน 30 วัน`
      : `"${taskTitle}" will be moved to Trash and permanently deleted after 30 days.`;

    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tasks.delete'),
        style: 'destructive',
        onPress: () => deleteTask(taskId),
      },
    ]);
  };

  return (
    <Screen scroll={false} withTabBarPadding>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <>
            <GradientHeader title={t('tasks.title')}>
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color="rgba(255,255,255,0.62)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('tasks.searchPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.56)"
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>
            </GradientHeader>

            {lastCompletedTask ? (
              <UndoBanner label={t('tasks.completedBanner', { title: lastCompletedTask.title })} onUndo={() => handleUndo(lastCompletedTask.id)} />
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ paddingRight: 16 }}>
              {FILTERS.map((filter) => (
                <FilterChip key={filter} label={t(`filters.${filter}`)} active={activeFilter === filter} onPress={() => setActiveFilter(filter)} />
              ))}
            </ScrollView>
          </>
        )}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={() => handleComplete(item.id)}
            onEdit={() => navigateToRoot(navigation, 'AddQuestModal', { taskId: item.id })}
            onDelete={() => handleDelete(item.id, item.title)}
            onUndo={() => handleUndo(item.id)}
            onPressTitle={() => navigateToRoot(navigation, 'QuestDetail', { taskId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSpacer} />}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('tasks.noQuestsFound')}</Text>
            <Text style={styles.emptyText}>{t('tasks.tryDifferentFilter')}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  searchWrap: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 16, paddingHorizontal: 14, minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: 8, color: '#FFFFFF', fontSize: 13 },
  chipRow: { marginTop: 14, marginBottom: 12 },
  itemSpacer: { height: 0 },
  emptyState: { backgroundColor: theme.colors.surface, padding: 18, borderRadius: 20, ...theme.shadow.card },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  emptyText: { marginTop: 8, color: theme.colors.textMuted, fontSize: 13 },
});
