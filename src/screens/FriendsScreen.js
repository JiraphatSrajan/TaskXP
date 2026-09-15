import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../components/Screen';
import { Pill } from '../components/UI';
import { useApp } from '../context/AppContext';

const PRESET_MESSAGES = [
  'แข่งกันเก็บ EXP สัปดาห์นี้นะ! 🔥',
  'เอาให้เต็มที่เลย! 💪',
  'ฉันจะแซงแกแน่นอน! 😤',
];

const formatCountdown = (targetDate) => {
  const diff = Math.max(targetDate.getTime() - Date.now(), 0);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return { days, hours, label: `${days} วัน ${hours} ชั่วโมง` };
};

const getNextMonday = () => {
  const now = new Date();
  const day = now.getDay();
  const delta = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + delta);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getInitial = (username = '') => Array.from(username.trim())[0] || '?';

export default function FriendsScreen() {
  const { state, addFriend, removeFriend, acceptFriendRequest, rejectFriendRequest, resetWeeklyExp, sendFriendChallenge, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [query, setQuery] = useState('');
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [challengeMessage, setChallengeMessage] = useState(PRESET_MESSAGES[0]);
  const [countdown, setCountdown] = useState(() => formatCountdown(getNextMonday()));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(formatCountdown(getNextMonday())), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = new Date();
    const lastReset = state.leaderboardResetDate ? new Date(state.leaderboardResetDate) : null;
    const isMonday = now.getDay() === 1;
    const shouldReset = isMonday && (!lastReset || (now - lastReset) >= 7 * 24 * 60 * 60 * 1000);
    if (shouldReset) resetWeeklyExp();
  }, [resetWeeklyExp, state.leaderboardResetDate]);

  const lowered = query.trim().toLowerCase();

  const filteredFriends = useMemo(() => {
    const source = state.friends.filter((friend) => friend.status === 'active');
    if (!lowered) return source;
    return source.filter((friend) => [friend.username, friend.id].join(' ').toLowerCase().includes(lowered));
  }, [lowered, state.friends]);

  const discoverableResults = useMemo(() => {
    const source = state.discoverableUsers || [];
    if (!lowered) return [];
    return source
      .filter((user) => [user.username, user.id].join(' ').toLowerCase().includes(lowered))
      .filter((user) => !state.friends.some((friend) => friend.id === user.id) && !state.pendingRequests.some((friend) => friend.id === user.id))
      .slice(0, 6);
  }, [lowered, state.discoverableUsers, state.friends, state.pendingRequests]);

  const leaderboard = useMemo(() => {
    const me = {
      id: 'me', username: state.user.name || 'Me', level: state.user.level, weeklyExp: state.stats.thisWeekXp,
      lastWeekExp: 0, totalExp: state.user.totalXp, streak: state.user.currentStreak,
      avatar: null, status: 'active', isMe: true,
    };
    return [...state.friends.filter((friend) => friend.status === 'active'), me]
      .sort((a, b) => b.weeklyExp - a.weeklyExp)
      .map((friend, index) => ({ ...friend, rank: index + 1 }));
  }, [state.friends, state.stats.thisWeekXp, state.user.currentStreak, state.user.level, state.user.name, state.user.totalXp]);

  const myRank = useMemo(() => leaderboard.find((entry) => entry.isMe) || null, [leaderboard]);

  const handleAddFriend = (friend) => {
    addFriend(friend);
    Alert.alert('🎉', `${friend.username} ${t('friends.addFriend')}`);
  };

  const handleSendChallenge = () => {
    if (!challengeTarget) return;
    sendFriendChallenge(challengeTarget, challengeMessage);
    Alert.alert(t('friends.sendChallenge'), t('friends.challengeSent'));
    setChallengeTarget(null);
    setChallengeMessage(PRESET_MESSAGES[0]);
  };

  const renderLeaderboardItem = ({ item }) => {
    const hasDelta = Number(item.lastWeekExp) > 0;
    const delta = hasDelta ? Math.round(((item.weeklyExp - item.lastWeekExp) / Math.max(item.lastWeekExp, 1)) * 100) : 0;
    const deltaText = hasDelta ? `${delta >= 0 ? '+' : ''}${delta}%` : t('friends.noDelta');
    const medal = item.rank === 1 ? '👑' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`;

    return (
      <View style={[styles.rankCard, item.rank === 1 && styles.rankCardFirst, item.isMe && styles.rankCardMe]}>
        <Text style={styles.rankLabel}>{medal}</Text>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{getInitial(item.username)}</Text><View style={styles.onlineDot} /></View>
        <View style={styles.rankBody}>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.rankMetaRow}>
            <Pill label={`Lv. ${item.level}`} backgroundColor={theme.colors.primarySoft} color={theme.colors.primary} />
            {item.streak >= 7 ? <Text style={styles.streakText}>🔥 {t('common.days', { count: item.streak })}</Text> : null}
          </View>
        </View>
        <View style={styles.rankRight}><Text style={styles.weeklyExp}>⚡ {item.weeklyExp.toLocaleString()}</Text><Text style={[styles.deltaText, hasDelta ? (delta >= 0 ? styles.deltaPositive : styles.deltaNegative) : styles.deltaNeutral]}>{deltaText}</Text></View>
      </View>
    );
  };

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendRow}>
      <View style={styles.avatarCircle}><Text style={styles.avatarText}>{getInitial(item.username)}</Text><View style={styles.onlineDot} /></View>
      <View style={styles.friendBody}><Text style={styles.username}>{item.username}</Text><Text style={styles.friendMeta}>Lv. {item.level}  |  ⚡ {item.totalExp.toLocaleString()}</Text></View>
      <View style={styles.friendActions}>
        <Pressable style={styles.challengeButton} onPress={() => setChallengeTarget(item)}><Text style={styles.challengeButtonText}>⚔️</Text></Pressable>
        <Pressable style={styles.removeButton} onPress={() => Alert.alert(t('friends.removeTitle'), t('friends.removeMessage', { name: item.username }), [{ text: t('common.cancel'), style: 'cancel' }, { text: t('friends.remove'), style: 'destructive', onPress: () => removeFriend(item.id) }])}><Text style={styles.removeButtonText}>🗑️</Text></Pressable>
      </View>
    </View>
  );

  return (
    <Screen scroll={false} withTabBarPadding>
      <View style={styles.searchWrap}>
        <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder={`🔍 ${t('friends.searchPlaceholder')}`} placeholderTextColor={theme.colors.textSoft} autoCorrect={false} />
      </View>

      {discoverableResults.length > 0 ? (
        <View style={styles.discoveryWrap}>
          <Text style={styles.discoveryTitle}>{t('friends.discoverPlayers')}</Text>
          {discoverableResults.map((user) => (
            <Pressable key={user.id} style={styles.searchSuggestion} onPress={() => handleAddFriend(user)}>
              <View>
                <Text style={styles.searchSuggestionTitle}>{user.username}</Text>
                <Text style={styles.searchSuggestionMeta}>{t('common.level')} {user.level} • {t('common.days', { count: user.streak })} • {t('friends.xpThisWeek', { xp: user.weeklyExp })}</Text>
              </View>
              <Text style={styles.searchSuggestionAction}>➕ {t('friends.addFriend')}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {state.pendingRequests.length > 0 ? (
        <View style={styles.requestsWrap}>
          <Pressable style={styles.requestsBanner} onPress={() => setRequestsExpanded((prev) => !prev)}><Text style={styles.requestsText}>📨 {t('friends.requests', { count: state.pendingRequests.length })}</Text></Pressable>
          {requestsExpanded ? state.pendingRequests.map((item) => (
            <View key={item.id} style={styles.requestRow}>
              <View style={styles.avatarCircle}><Text style={styles.avatarText}>{getInitial(item.username)}</Text></View>
              <Text style={styles.requestName}>{item.username}</Text>
              <View style={styles.requestActions}>
                <Pressable style={styles.requestAccept} onPress={() => acceptFriendRequest(item.id)}><Text style={styles.requestAcceptText}>✓ {t('friends.accept')}</Text></Pressable>
                <Pressable style={styles.requestReject} onPress={() => rejectFriendRequest(item.id)}><Text style={styles.requestRejectText}>✗ {t('friends.reject')}</Text></Pressable>
              </View>
            </View>
          )) : null}
        </View>
      ) : null}

      <View style={styles.tabsRow}>
        <Pressable style={styles.tabButton} onPress={() => setActiveTab('leaderboard')}><Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>🏆 {t('friends.weeklyLeaderboard')}</Text><View style={[styles.tabUnderline, activeTab === 'leaderboard' && styles.tabUnderlineActive]} /></Pressable>
        <Pressable style={styles.tabButton} onPress={() => setActiveTab('friends')}><Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>👥 {t('friends.allFriends')}</Text><View style={[styles.tabUnderline, activeTab === 'friends' && styles.tabUnderlineActive]} /></Pressable>
      </View>

      {activeTab === 'leaderboard' ? (
        <>
          <View style={styles.countdownCard}><Text style={styles.countdownText}>🔄 {t('friends.resetsIn', { time: countdown.label })}</Text></View>
          <FlatList data={leaderboard} keyExtractor={(item) => item.id} renderItem={renderLeaderboardItem} contentContainerStyle={styles.listContent} ListHeaderComponent={myRank ? <View style={styles.myRankCard}><Text style={styles.myRankTitle}>{t('friends.myRank')}</Text><Text style={styles.myRankValue}>#{myRank.rank} • ⚡ {myRank.weeklyExp.toLocaleString()}</Text></View> : null} ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyText}>{t('friends.noLeaderboard')}</Text></View>} />
        </>
      ) : (
        <FlatList data={filteredFriends} keyExtractor={(item) => item.id} renderItem={renderFriendItem} contentContainerStyle={styles.listContent} ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyText}>{lowered ? t('friends.noSearchResults') : t('friends.noFriends')}</Text></View>} />
      )}

      <Modal visible={Boolean(challengeTarget)} transparent animationType="fade" onRequestClose={() => setChallengeTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚔️ {t('friends.sendChallenge')}</Text>
            <Text style={styles.modalSubtitle}>{challengeTarget?.username}</Text>
            {PRESET_MESSAGES.map((item) => (
              <Pressable key={item} style={[styles.messageOption, challengeMessage === item && styles.messageOptionActive]} onPress={() => setChallengeMessage(item)}>
                <Text style={[styles.messageOptionText, challengeMessage === item && styles.messageOptionTextActive]}>{item}</Text>
              </Pressable>
            ))}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setChallengeTarget(null)}><Text style={styles.modalCancelText}>{t('common.cancel')}</Text></Pressable>
              <Pressable style={styles.modalSend} onPress={handleSendChallenge}><Text style={styles.modalSendText}>{t('friends.sendChallenge')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  searchWrap: { backgroundColor: theme.colors.surface, borderRadius: 18, minHeight: 50, paddingHorizontal: 14, justifyContent: 'center', ...theme.shadow.card },
  searchInput: { color: theme.colors.text, fontSize: 14 },
  discoveryWrap: { marginTop: 12 },
  discoveryTitle: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12, marginBottom: 8 },
  searchSuggestion: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, ...theme.shadow.card },
  searchSuggestionTitle: { color: theme.colors.text, fontWeight: '800' },
  searchSuggestionMeta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12 },
  searchSuggestionAction: { color: theme.colors.primary, fontWeight: '900', marginLeft: 8 },
  requestsWrap: { marginTop: 10 },
  requestsBanner: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, ...theme.shadow.card },
  requestsText: { color: theme.colors.text, fontWeight: '800' },
  requestRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, marginTop: 8, ...theme.shadow.card },
  requestName: { flex: 1, color: theme.colors.text, fontWeight: '800', marginLeft: 10 },
  requestActions: { flexDirection: 'row' },
  requestAccept: { backgroundColor: theme.colors.greenSoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, marginRight: 8 },
  requestAcceptText: { color: theme.colors.green, fontWeight: '800' },
  requestReject: { backgroundColor: theme.colors.orangeSoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  requestRejectText: { color: theme.colors.orange, fontWeight: '800' },
  tabsRow: { flexDirection: 'row', marginTop: 14 },
  tabButton: { flex: 1, alignItems: 'center' },
  tabText: { color: theme.colors.textMuted, fontWeight: '800' },
  tabTextActive: { color: theme.colors.text },
  tabUnderline: { marginTop: 8, height: 3, width: '70%', borderRadius: 999, backgroundColor: 'transparent' },
  tabUnderlineActive: { backgroundColor: theme.colors.primary },
  countdownCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, marginTop: 12, ...theme.shadow.card },
  countdownText: { color: theme.colors.text, fontWeight: '700' },
  listContent: { paddingTop: 12, paddingBottom: 16 },
  myRankCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, marginBottom: 10, ...theme.shadow.card },
  myRankTitle: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12 },
  myRankValue: { color: theme.colors.text, fontWeight: '900', fontSize: 18, marginTop: 6 },
  rankCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, ...theme.shadow.card },
  rankCardFirst: { borderWidth: 1, borderColor: theme.colors.yellow },
  rankCardMe: { borderWidth: 1, borderColor: theme.colors.primary },
  rankLabel: { width: 40, color: theme.colors.text, fontWeight: '900' },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { color: theme.colors.primary, fontWeight: '900' },
  onlineDot: { position: 'absolute', right: 2, bottom: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.green },
  rankBody: { flex: 1, marginLeft: 12 },
  username: { color: theme.colors.text, fontWeight: '800' },
  rankMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  streakText: { marginLeft: 8, color: theme.colors.orange, fontWeight: '700' },
  rankRight: { alignItems: 'flex-end' },
  weeklyExp: { color: theme.colors.text, fontWeight: '900' },
  deltaText: { marginTop: 4, fontWeight: '700', fontSize: 12 },
  deltaPositive: { color: theme.colors.green },
  deltaNegative: { color: theme.colors.danger },
  deltaNeutral: { color: theme.colors.textSoft },
  friendRow: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, ...theme.shadow.card },
  friendBody: { flex: 1, marginLeft: 12 },
  friendMeta: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12 },
  friendActions: { flexDirection: 'row' },
  challengeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  challengeButtonText: { fontSize: 16 },
  removeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { fontSize: 16 },
  emptyCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 16, ...theme.shadow.card },
  emptyText: { color: theme.colors.textMuted },
  modalBackdrop: { flex: 1, backgroundColor: theme.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 18, ...theme.shadow.card },
  modalTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
  modalSubtitle: { color: theme.colors.textMuted, marginTop: 4, marginBottom: 12 },
  messageOption: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 8 },
  messageOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  messageOptionText: { color: theme.colors.text, fontWeight: '700' },
  messageOptionTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  modalCancel: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: theme.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  modalCancelText: { color: theme.colors.text, fontWeight: '800' },
  modalSend: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  modalSendText: { color: '#FFFFFF', fontWeight: '900' },
});
