import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { GradientHeader, NotificationBadge } from '../components/UI';
import { useApp } from '../context/AppContext';

const getRelativeTime = (value, t) => {
  const diff = Math.max(Date.now() - new Date(value).getTime(), 0);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('notificationsCenter.justNow');
  if (minutes < 60) return t('notificationsCenter.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notificationsCenter.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('notificationsCenter.daysAgo', { count: days });
};

const typeMeta = {
  overdue: { icon: 'alert-circle-outline', key: 'orange' },
  level_up: { icon: 'trophy-outline', key: 'yellow' },
  achievement: { icon: 'medal-outline', key: 'primary' },
  streak: { icon: 'flame-outline', key: 'orange' },
  friend_challenge: { icon: 'people-outline', key: 'blue' },
  reward: { icon: 'gift-outline', key: 'green' },
  general: { icon: 'notifications-outline', key: 'primary' },
};

export default function NotificationsScreen({ navigation }) {
  const { state, theme, t, markNotificationRead, markNotificationsRead, markAllRead } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const unreadCount = state.notifications.filter((item) => !item.read).length;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const pendingReadIdsRef = useRef(new Set());
  const flushTimerRef = useRef(null);

  const flushQueuedReads = useCallback(() => {
    const ids = Array.from(pendingReadIdsRef.current);
    pendingReadIdsRef.current.clear();
    if (ids.length) {
      markNotificationsRead(ids);
    }
  }, [markNotificationsRead]);

  const queueRead = useCallback((notificationId) => {
    if (!notificationId) return;
    pendingReadIdsRef.current.add(notificationId);
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      flushQueuedReads();
    }, 250);
  }, [flushQueuedReads]);

  useEffect(() => () => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }
    flushQueuedReads();
  }, [flushQueuedReads]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    viewableItems.forEach(({ item }) => {
      if (item?.id && !item.read) {
        pendingReadIdsRef.current.add(item.id);
      }
    });

    if (pendingReadIdsRef.current.size) {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        flushQueuedReads();
      }, 250);
    }
  }).current;

  return (
    <Screen scroll={false} withTabBarPadding>
      <FlatList
        data={state.notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListHeaderComponent={(
          <GradientHeader
            withBack
            onBack={() => navigation.goBack()}
            title={t('notificationsCenter.title')}
            subtitle={t('notificationsCenter.total', { count: state.notifications.length })}
            rightAction={(
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={styles.markAll}>{t('notificationsCenter.markAll')}</Text>
              </Pressable>
            )}
          >
            <View style={styles.headerBadgeWrap}>
              <Text style={styles.headerBadgeLabel}>{t('notificationsCenter.unread')}</Text>
              <NotificationBadge count={unreadCount} />
            </View>
          </GradientHeader>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const meta = typeMeta[item.type] || typeMeta.general;
          return (
            <Pressable style={[styles.card, !item.read && styles.cardUnread]} onPress={() => { markNotificationRead(item.id); queueRead(item.id); }}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors[`${meta.key}Soft`] || theme.colors.primarySoft }]}> 
                <Ionicons name={meta.icon} size={18} color={theme.colors[meta.key] || theme.colors.primary} />
              </View>
              <View style={styles.copy}>
                <View style={styles.rowTop}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.time}>{getRelativeTime(item.createdAt, t)}</Text>
                </View>
                <Text style={styles.body}>{item.body || t('notificationsCenter.noDetails')}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={(
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('notificationsCenter.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('notificationsCenter.emptyText')}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  listContent: { paddingBottom: 20 },
  markAll: { color: '#FFFFFF', fontWeight: '800' },
  headerBadgeWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  headerBadgeLabel: { color: '#FFFFFF', marginRight: 8, fontWeight: '700' },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 14, flexDirection: 'row', ...theme.shadow.card },
  cardUnread: { borderWidth: 1, borderColor: theme.colors.primarySoft },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: theme.colors.text, fontWeight: '900', flex: 1, paddingRight: 8 },
  time: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '700' },
  body: { color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 },
  emptyCard: { backgroundColor: theme.colors.surface, borderRadius: 22, padding: 18, marginTop: 14, ...theme.shadow.card },
  emptyTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
  emptyText: { color: theme.colors.textMuted, marginTop: 8, lineHeight: 20 },
});
