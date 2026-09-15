import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { useApp } from '../context/AppContext';
import { formatSlashDate, toDate } from '../utils/formatters';

const ROW_HEIGHT = 132;
const DAY_MS = 24 * 60 * 60 * 1000;

export default function TrashScreen() {
  const {
    state,
    restoreTaskFromTrash,
    deletePermanentlyFromTrash,
    restoreAllTrash,
    emptyTrash,
    theme,
    t,
  } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const trashItems = useMemo(
    () => [...state.trash].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)),
    [state.trash],
  );

  const confirmDeleteForever = (taskId) => {
    Alert.alert(t('trash.confirmDelete'), t('trash.confirmDeleteSub'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('trash.deleteForever'),
        style: 'destructive',
        onPress: () => deletePermanentlyFromTrash(taskId),
      },
    ]);
  };

  const confirmEmptyTrash = () => {
    Alert.alert(t('trash.confirmEmpty'), t('trash.confirmEmptySub'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('trash.emptyTrash'),
        style: 'destructive',
        onPress: emptyTrash,
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const daysLeft = Math.max(Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / DAY_MS), 0);
    const isUrgent = daysLeft <= 3;

    return (
      <View style={styles.rowCard}>
        <View style={styles.rowLeft}>
          <Text style={styles.checkbox}>☐</Text>
        </View>

        <View style={styles.rowCenter}>
          <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.metaText}>{t('trash.createdAt', { date: formatSlashDate(item.createdAt) })}</Text>
          <Text style={styles.metaText}>{t('trash.deletedAt', { date: formatSlashDate(item.deletedAt) })}</Text>
          <Text style={[styles.expireText, isUrgent && styles.expireTextUrgent]}>
            🕐 {t('trash.expiresIn', { days: daysLeft })}
          </Text>
        </View>

        <View style={styles.rowRight}>
          <Pressable style={styles.iconButton} onPress={() => restoreTaskFromTrash(item.id)}>
            <Text style={styles.restoreIcon}>↩️</Text>
          </Pressable>
          <Pressable style={[styles.iconButton, styles.deleteIconButton]} onPress={() => confirmDeleteForever(item.id)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <FlatList
          data={trashItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={[styles.listContent, trashItems.length === 0 && styles.listContentEmpty]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
          ListHeaderComponent={(
            <View style={styles.headerWrap}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>🗑️ {t('trash.title')}</Text>
                  <Text style={styles.subtitle}>{t('trash.subtitle')}</Text>
                </View>
                {trashItems.length > 0 ? (
                  <Pressable onPress={confirmEmptyTrash}>
                    <Text style={styles.clearText}>{t('trash.clearAll')}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🗑️</Text>
              <Text style={styles.emptyTitle}>{t('trash.empty')}</Text>
              <Text style={styles.emptyText}>{t('trash.emptySub')}</Text>
            </View>
          )}
        />

        {trashItems.length > 0 ? (
          <View style={styles.footerWrap}>
            <Pressable style={styles.restoreAllButton} onPress={restoreAllTrash}>
              <Text style={styles.restoreAllText}>↩️ {t('trash.restoreAll')}</Text>
            </Pressable>
            <Pressable style={styles.emptyTrashButton} onPress={confirmEmptyTrash}>
              <Text style={styles.emptyTrashText}>🗑️ {t('trash.emptyTrash')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  headerWrap: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.colors.textMuted,
    marginTop: 6,
    fontSize: 13,
  },
  clearText: {
    color: theme.colors.danger,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 8,
  },
  separator: {
    height: 12,
  },
  rowCard: {
    minHeight: ROW_HEIGHT,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadow.card,
  },
  rowLeft: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    color: theme.colors.inactive,
    fontSize: 22,
  },
  rowCenter: {
    flex: 1,
    paddingHorizontal: 10,
  },
  taskTitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  metaText: {
    color: theme.colors.textSoft,
    fontSize: 12,
    marginTop: 6,
  },
  expireText: {
    color: theme.colors.text,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
  },
  expireTextUrgent: {
    color: theme.colors.danger,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteIconButton: {
    backgroundColor: theme.colors.orangeSoft,
  },
  restoreIcon: {
    fontSize: 18,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyEmoji: {
    fontSize: 80,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    paddingTop: 10,
  },
  restoreAllButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  restoreAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyTrashButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
    marginTop: 10,
  },
  emptyTrashText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
});
