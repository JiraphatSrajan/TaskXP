import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getTheme } from '../constants/theme';
import { getLocale, isSupportedLanguage, isSupportedTheme, translate } from '../constants/i18n';
import { createSeedState } from '../data/seed';
import {
  getCycleKey,
  getDayIndexMondayFirst,
  getEndOfWeek,
  getLocalDateKey,
  getRepeatedDueAt,
  getStartOfWeek,
  getTodayKey,
  isSameDay,
  toDate,
} from '../utils/formatters';
import { normalizeProfileUpdate, normalizeUserTitleState } from '../utils/profile';

const LEGACY_STORAGE_KEY = 'taskxp-ready-state-v6';
const LEGACY_FRIENDS_STORAGE_KEY = 'friends_list';
const LEGACY_LEADERBOARD_RESET_KEY = 'leaderboard_last_reset';
const STORAGE_KEYS = {
  core: 'taskxp-core-v7',
  user: 'taskxp-user-v7',
  tasks: 'taskxp-tasks-v7',
  history: 'taskxp-history-v7',
  trash: 'taskxp-trash-v7',
  rewards: 'taskxp-rewards-v7',
  notifications: 'taskxp-notifications-v7',
  settings: 'taskxp-settings-v7',
  social: 'taskxp-social-v7',
};
const PERSIST_DEBOUNCE_MS = 450;
const DEMO_PASSWORD = 'TaskXP123!';
const STREAK_MILESTONES = [3, 7, 14, 30, 100];
const ACHIEVEMENT_XP_MAP = {
  '1': 50,
  '2': 120,
  '3': 180,
  '4': 300,
  '5': 150,
  '6': 180,
};

const AppContext = createContext(null);

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const uniq = (items = []) => [...new Set(items.filter(Boolean))];

const sanitizeHistoryRecord = (record = {}) => {
  const completedAt = toDate(record.completedAt);
  if (!completedAt) return null;

  return {
    id: record.id || `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    taskId: record.taskId || null,
    title: record.title || 'Quest completion',
    category: record.category || 'Work',
    xp: Math.max(Number(record.xp) || 0, 0),
    repeat: record.repeat || 'None',
    completedAt: completedAt.toISOString(),
    dueAt: record.dueAt ? toDate(record.dueAt, completedAt).toISOString() : null,
  };
};

const sanitizeTask = (task = {}) => {
  const createdAt = toDate(task.createdAt || task.originalDueAt || task.dueAt, new Date());
  const originalDueAt = toDate(task.originalDueAt || task.dueAt || createdAt, createdAt);
  const dueAt = toDate(task.dueAt || originalDueAt, originalDueAt);
  const completedAt = task.completedAt ? toDate(task.completedAt) : null;

  return {
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(task.title || 'Untitled quest').trim() || 'Untitled quest',
    description: String(task.description || ''),
    category: task.category || 'Work',
    xp: Math.max(Number(task.xp) || 25, 5),
    repeat: task.repeat || 'None',
    priority: task.priority || 'Medium',
    createdAt: createdAt.toISOString(),
    originalDueAt: originalDueAt.toISOString(),
    dueAt: dueAt.toISOString(),
    completed: Boolean(task.completed),
    completedAt: completedAt ? completedAt.toISOString() : null,
  };
};

const sanitizeTrashItem = (item = {}) => {
  const deletedAt = toDate(item.deletedAt || new Date(), new Date());
  const expiresAt = toDate(item.expiresAt || new Date(deletedAt.getTime() + (30 * 24 * 60 * 60 * 1000)), new Date());

  return {
    ...sanitizeTask(item),
    deletedAt: deletedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

const sanitizeFriend = (friend = {}) => ({
  id: friend.id || `friend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  username: String(friend.username || 'Player').trim() || 'Player',
  level: Math.max(Number(friend.level) || 1, 1),
  weeklyExp: Math.max(Number(friend.weeklyExp) || 0, 0),
  lastWeekExp: Math.max(Number(friend.lastWeekExp) || 0, 0),
  totalExp: Math.max(Number(friend.totalExp) || 0, 0),
  streak: Math.max(Number(friend.streak) || 0, 0),
  avatar: friend.avatar || null,
  status: friend.status || 'active',
});

const sanitizeNotification = (notification = {}) => {
  const createdAt = toDate(notification.createdAt || new Date(), new Date());
  const meta = notification.meta && typeof notification.meta === 'object' ? notification.meta : {};

  return {
    id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: notification.type || 'general',
    title: String(notification.title || 'Update').trim() || 'Update',
    body: String(notification.body || '').trim(),
    createdAt: createdAt.toISOString(),
    read: Boolean(notification.read),
    meta,
  };
};

const purgeExpiredTrashItems = (trash = [], now = new Date()) => {
  const current = toDate(now, new Date());
  return trash.filter((item) => {
    const expiresAt = toDate(item.expiresAt);
    return !expiresAt || expiresAt > current;
  });
};

const migrateLegacyHistory = (rawState, now = new Date()) => {
  if (Array.isArray(rawState.history) && rawState.history.length) {
    return rawState.history.map(sanitizeHistoryRecord).filter(Boolean);
  }

  return (rawState.tasks || [])
    .filter((task) => task.completed)
    .map((task) => sanitizeHistoryRecord({
      id: `legacy-${task.id}`,
      taskId: task.id,
      title: task.title,
      category: task.category,
      xp: task.xp,
      repeat: task.repeat,
      completedAt: task.completedAt || task.dueAt || now.toISOString(),
      dueAt: task.dueAt || now.toISOString(),
    }))
    .filter(Boolean);
};

const buildDerivedData = (tasks, history, now = new Date()) => {
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const weekXp = [0, 0, 0, 0, 0, 0, 0];
  let dailyXp = 0;
  let thisWeekXp = 0;

  history.forEach((record) => {
    const completedAt = toDate(record.completedAt);
    if (!completedAt) return;

    const xp = Math.max(Number(record.xp) || 0, 0);
    if (isSameDay(completedAt, now)) {
      dailyXp += xp;
    }

    if (completedAt >= weekStart && completedAt <= weekEnd) {
      thisWeekXp += xp;
      weekXp[getDayIndexMondayFirst(completedAt)] += xp;
    }
  });

  const categories = ['Work', 'Health', 'Learning', 'Personal'];
  const categoryProgress = categories.map((category) => {
    const scoped = tasks.filter((task) => task.category === category);
    if (!scoped.length) return 0;
    const completed = scoped.filter((task) => task.completed).length;
    return Math.round((completed / scoped.length) * 100);
  });

  return {
    stats: {
      dailyXp,
      thisWeekXp,
      completedCount: history.length,
    },
    charts: {
      weekXp,
      categoryProgress,
    },
  };
};

const normalizeRecurringTasks = (tasks, history, now = new Date()) => tasks.map((task) => {
  if (task.repeat === 'None') return task;

  const cycleKey = getCycleKey(now, task.repeat);
  const latestRecordThisCycle = [...history]
    .filter((record) => record.taskId === task.id && getCycleKey(record.completedAt, task.repeat) === cycleKey)
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt))[0];

  return {
    ...task,
    dueAt: getRepeatedDueAt(task.originalDueAt || task.dueAt, task.repeat, now),
    completed: Boolean(latestRecordThisCycle),
    completedAt: latestRecordThisCycle?.completedAt || null,
  };
});

const getConsecutiveStreak = (keys = []) => {
  if (!keys.length) return 0;

  let streak = 1;
  for (let index = keys.length - 1; index > 0; index -= 1) {
    const current = toDate(keys[index]);
    const previous = toDate(keys[index - 1]);
    if (!current || !previous) break;

    const expectedPrevious = new Date(current);
    expectedPrevious.setDate(expectedPrevious.getDate() - 1);
    if (getTodayKey(expectedPrevious) !== keys[index - 1]) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const getDayDiff = (left, right) => {
  const a = toDate(left, new Date());
  const b = toDate(right, new Date());
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
};

const buildStreakMetrics = (history, now = new Date(), options = {}) => {
  const hasShield = Boolean(options.hasShield);
  const dayKeys = uniq(history.map((record) => getTodayKey(record.completedAt)).filter(Boolean)).sort();

  if (!dayKeys.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      shieldProtected: false,
    };
  }

  let longestStreak = 1;
  let running = 1;

  for (let index = 1; index < dayKeys.length; index += 1) {
    const current = toDate(dayKeys[index]);
    const previous = toDate(dayKeys[index - 1]);
    if (!current || !previous) continue;

    const expectedPrevious = new Date(current);
    expectedPrevious.setDate(expectedPrevious.getDate() - 1);

    if (getTodayKey(expectedPrevious) === dayKeys[index - 1]) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 1;
    }
  }

  const lastCompletionDate = dayKeys[dayKeys.length - 1];
  const diffDays = getDayDiff(now, lastCompletionDate);
  const shieldProtected = hasShield && diffDays === 2;
  const streakIsActive = diffDays <= 1;

  return {
    currentStreak: streakIsActive || shieldProtected ? getConsecutiveStreak(dayKeys) : 0,
    longestStreak,
    lastCompletionDate,
    shieldProtected,
  };
};

const applyXpToUser = (user, xpAmount = 0) => {
  const nextUser = { ...user };
  const xp = Math.max(Number(xpAmount) || 0, 0);
  let didLevelUp = false;

  nextUser.currentXp = (Number(nextUser.currentXp) || 0) + xp;
  nextUser.totalXp = (Number(nextUser.totalXp) || 0) + xp;

  while (nextUser.currentXp >= nextUser.xpGoal) {
    nextUser.currentXp -= nextUser.xpGoal;
    nextUser.level += 1;
    didLevelUp = true;
  }

  return {
    user: nextUser,
    didLevelUp,
    newLevel: nextUser.level,
  };
};

const removeXpFromUser = (user, xpToRemove = 0) => {
  const nextUser = { ...user };
  const xp = Math.max(Number(xpToRemove) || 0, 0);

  nextUser.totalXp = Math.max((Number(nextUser.totalXp) || 0) - xp, 0);
  nextUser.currentXp = (Number(nextUser.currentXp) || 0) - xp;

  while (nextUser.currentXp < 0 && nextUser.level > 1) {
    nextUser.level -= 1;
    nextUser.currentXp += nextUser.xpGoal;
  }

  nextUser.currentXp = Math.max(nextUser.currentXp, 0);
  return nextUser;
};

const applyAchievementGrant = (state, achievementId, xpAmount = 0, createdAt = new Date()) => {
  if ((state.grantedAchievements || []).includes(achievementId)) {
    return {
      nextState: state,
      xpGranted: 0,
      didLevelUp: false,
      newLevel: state.user.level,
    };
  }

  const xp = Math.max(Number(xpAmount) || 0, 0);
  const appliedXp = applyXpToUser(state.user, xp);
  let notifications = addNotificationRecord(state.notifications || [], {
    id: `achievement-${achievementId}`,
    type: 'achievement',
    title: 'Achievement unlocked',
    body: `Achievement ${achievementId} granted ${xp} XP.`,
    createdAt: createdAt.toISOString(),
    meta: { achievementId, xp },
  });

  if (appliedXp.didLevelUp) {
    notifications = addNotificationRecord(notifications, {
      id: `achievement-level-${appliedXp.newLevel}-${achievementId}`,
      type: 'level_up',
      title: 'Level up!',
      body: `You reached Level ${appliedXp.newLevel}.`,
      createdAt: createdAt.toISOString(),
      meta: { level: appliedXp.newLevel, source: 'achievement', achievementId },
    });
  }

  return {
    nextState: refreshState({
      ...state,
      user: appliedXp.user,
      grantedAchievements: uniq([...(state.grantedAchievements || []), achievementId]),
      notifications,
    }, createdAt),
    xpGranted: xp,
    didLevelUp: appliedXp.didLevelUp,
    newLevel: appliedXp.newLevel,
  };
};

const getAchievementStates = (history, user) => {
  const completedCount = history.length;
  const onTimeCount = history.filter((item) => !item.dueAt || new Date(item.completedAt) <= new Date(item.dueAt)).length;
  const healthCount = history.filter((item) => item.category === 'Health').length;

  return [
    { id: '1', unlocked: completedCount >= 1 },
    { id: '2', unlocked: user.currentStreak >= 7 },
    { id: '3', unlocked: completedCount >= 50 },
    { id: '4', unlocked: completedCount >= 100 },
    { id: '5', unlocked: onTimeCount >= 30 },
    { id: '6', unlocked: healthCount >= 50 },
  ];
};

const addNotificationRecord = (notifications = [], notification) => {
  const nextNotification = sanitizeNotification(notification);
  const overdueTaskId = nextNotification.type === 'overdue' ? nextNotification.meta?.taskId : null;

  const filtered = notifications.filter((item) => {
    if (item.id === nextNotification.id) return false;
    if (overdueTaskId && item.type === 'overdue' && item.meta?.taskId === overdueTaskId) return false;
    return true;
  });

  return [nextNotification, ...filtered].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const ensureOverdueNotifications = (state, now = new Date()) => {
  const current = toDate(now, new Date());
  const overdueTasks = (state.tasks || [])
    .filter((task) => !task.completed && toDate(task.dueAt) && toDate(task.dueAt) < current);
  const overdueTaskIds = new Set(overdueTasks.map((task) => task.id));

  let notifications = (state.notifications || []).filter((item) => {
    if (item.type !== 'overdue') return true;
    return overdueTaskIds.has(item.meta?.taskId);
  });

  overdueTasks.forEach((task) => {
    const exists = notifications.some((item) => item.type === 'overdue' && item.meta?.taskId === task.id);
    if (!exists) {
      notifications = addNotificationRecord(notifications, {
        id: `overdue-${task.id}`,
        type: 'overdue',
        title: 'Overdue quest',
        body: `${task.title} is overdue.`,
        createdAt: current.toISOString(),
        meta: { taskId: task.id },
      });
    }
  });

  return notifications;
};

const getStartOfNextWeek = (value = new Date()) => {
  const start = getStartOfWeek(value);
  start.setDate(start.getDate() + 7);
  start.setHours(0, 0, 0, 0);
  return start;
};

const shouldResetWeeklyLeaderboard = (lastReset, now = new Date()) => {
  const current = toDate(now, new Date());
  if (!lastReset) {
    return current.getDay() === 1;
  }

  const nextReset = getStartOfNextWeek(lastReset);
  return current >= nextReset;
};

const sanitizeState = (rawState, now = new Date()) => {
  const seed = createSeedState();
  const merged = {
    ...seed,
    ...rawState,
    auth: {
      ...seed.auth,
      ...(rawState.auth || {}),
    },
    user: normalizeUserTitleState({
      ...seed.user,
      ...(rawState.user || {}),
    }),
    stats: {
      ...seed.stats,
      ...(rawState.stats || {}),
    },
    charts: {
      ...seed.charts,
      ...(rawState.charts || {}),
    },
    settings: {
      ...seed.settings,
      ...(rawState.settings || {}),
    },
  };

  merged.settings.theme = isSupportedTheme(merged.settings.theme) ? merged.settings.theme : seed.settings.theme;
  merged.settings.language = isSupportedLanguage(merged.settings.language) ? merged.settings.language : seed.settings.language;
  merged.settings.dailyGoal = Math.max(Number(merged.settings.dailyGoal) || 100, 50);

  const history = migrateLegacyHistory(merged, now)
    .map(sanitizeHistoryRecord)
    .filter(Boolean)
    .sort((left, right) => new Date(left.completedAt) - new Date(right.completedAt));

  return {
    ...merged,
    history,
    tasks: (merged.tasks || []).map(sanitizeTask),
    trash: purgeExpiredTrashItems((merged.trash || []).map(sanitizeTrashItem), now),
    unlockedRewards: uniq(Array.isArray(merged.unlockedRewards) ? merged.unlockedRewards : []),
    friends: Array.isArray(merged.friends) ? merged.friends.map(sanitizeFriend) : [],
    pendingRequests: Array.isArray(merged.pendingRequests) ? merged.pendingRequests.map(sanitizeFriend) : [],
    discoverableUsers: Array.isArray(merged.discoverableUsers) ? merged.discoverableUsers.map(sanitizeFriend) : [],
    notifications: Array.isArray(merged.notifications) ? merged.notifications.map(sanitizeNotification) : [],
    grantedAchievements: Array.isArray(merged.grantedAchievements) ? merged.grantedAchievements : [],
    weeklyExpStart: Math.max(Number(merged.weeklyExpStart) || 0, 0),
    leaderboardResetDate: merged.leaderboardResetDate || null,
    lastDailyReset: getTodayKey(now),
  };
};

const refreshState = (rawState, now = new Date()) => {
  const sanitized = sanitizeState(rawState, now);
  const shouldReset = shouldResetWeeklyLeaderboard(sanitized.leaderboardResetDate, now);

  let nextState = sanitizeState({
    ...sanitized,
    trash: purgeExpiredTrashItems(sanitized.trash, now),
    friends: shouldReset
      ? sanitized.friends.map((friend) => ({ ...friend, lastWeekExp: friend.weeklyExp, weeklyExp: 0 }))
      : sanitized.friends,
    leaderboardResetDate: shouldReset ? now.toISOString() : sanitized.leaderboardResetDate,
  }, now);

  const streakMetrics = buildStreakMetrics(nextState.history, now, {
    hasShield: (nextState.unlockedRewards || []).includes('streak_shield'),
  });

  if (streakMetrics.shieldProtected) {
    nextState = sanitizeState({
      ...nextState,
      unlockedRewards: (nextState.unlockedRewards || []).filter((rewardId) => rewardId !== 'streak_shield'),
      notifications: addNotificationRecord(nextState.notifications || [], {
        id: `shield-${getTodayKey(now)}`,
        type: 'reward',
        title: 'Streak Shield used',
        body: 'Your streak was protected after missing one day.',
        createdAt: now.toISOString(),
      }),
    }, now);
  }

  nextState = sanitizeState({
    ...nextState,
    notifications: ensureOverdueNotifications(nextState, now),
  }, now);

  return nextState;
};

const getPersistedUser = (user = {}) => {
  const persistedUser = { ...user };
  delete persistedUser.currentStreak;
  delete persistedUser.longestStreak;
  delete persistedUser.lastCompletionDate;
  return persistedUser;
};

const getPersistedSlices = (state) => ({
  core: {
    hasSeenOnboarding: state.hasSeenOnboarding,
  },
  user: getPersistedUser(state.user),
  tasks: state.tasks || [],
  history: state.history || [],
  trash: state.trash || [],
  rewards: {
    unlockedRewards: state.unlockedRewards || [],
    grantedAchievements: state.grantedAchievements || [],
  },
  notifications: state.notifications || [],
  settings: state.settings || {},
  social: {
    friends: state.friends || [],
    pendingRequests: state.pendingRequests || [],
    discoverableUsers: state.discoverableUsers || [],
    weeklyExpStart: state.weeklyExpStart || 0,
    leaderboardResetDate: state.leaderboardResetDate || null,
  },
});

const safeJsonParse = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse persisted TaskXP slice', error);
    return fallback;
  }
};

const persistStateSlices = async (state) => {
  const slices = getPersistedSlices(state);
  await AsyncStorage.multiSet(
    Object.entries(STORAGE_KEYS).map(([sliceKey, storageKey]) => [storageKey, JSON.stringify(slices[sliceKey] ?? null)]),
  );
};

const buildViewState = (baseState, now = new Date()) => {
  const tasks = normalizeRecurringTasks(baseState.tasks, baseState.history, now);
  const derived = buildDerivedData(tasks, baseState.history, now);
  const streaks = buildStreakMetrics(baseState.history, now, {
    hasShield: (baseState.unlockedRewards || []).includes('streak_shield'),
  });

  return {
    ...baseState,
    tasks,
    user: {
      ...baseState.user,
      ...streaks,
      exp: baseState.user.currentXp,
    },
    stats: {
      ...baseState.stats,
      ...derived.stats,
      dailyGoal: Math.max(Number(baseState.settings?.dailyGoal) || Number(baseState.stats?.dailyGoal) || 100, 50),
    },
    charts: {
      ...baseState.charts,
      ...derived.charts,
    },
    lastDailyReset: getTodayKey(now),
  };
};

const loadLegacyState = async () => {
  const seed = createSeedState();
  const [legacyRaw, legacyFriendsRaw, legacyResetRaw] = await Promise.all([
    AsyncStorage.getItem(LEGACY_STORAGE_KEY),
    AsyncStorage.getItem(LEGACY_FRIENDS_STORAGE_KEY),
    AsyncStorage.getItem(LEGACY_LEADERBOARD_RESET_KEY),
  ]);

  const legacyBase = safeJsonParse(legacyRaw, {}) || {};
  const legacyFriends = safeJsonParse(legacyFriendsRaw, legacyBase.friends || seed.friends) || seed.friends;

  return refreshState({
    ...seed,
    ...legacyBase,
    user: {
      ...seed.user,
      ...(legacyBase.user || {}),
    },
    settings: {
      ...seed.settings,
      ...(legacyBase.settings || {}),
    },
    friends: legacyFriends,
    leaderboardResetDate: legacyBase.leaderboardResetDate || legacyResetRaw || null,
  });
};

const loadPersistedState = async () => {
  const keys = Object.values(STORAGE_KEYS);
  const entries = await AsyncStorage.multiGet(keys);
  const valueMap = Object.fromEntries(entries);
  const hasSliceData = keys.some((key) => valueMap[key]);
  if (!hasSliceData) {
    return loadLegacyState();
  }

  const seed = createSeedState();
  const core = safeJsonParse(valueMap[STORAGE_KEYS.core], {}) || {};
  const user = safeJsonParse(valueMap[STORAGE_KEYS.user], {}) || {};
  const tasks = safeJsonParse(valueMap[STORAGE_KEYS.tasks], seed.tasks) || seed.tasks;
  const history = safeJsonParse(valueMap[STORAGE_KEYS.history], seed.history) || seed.history;
  const trash = safeJsonParse(valueMap[STORAGE_KEYS.trash], seed.trash) || seed.trash;
  const rewards = safeJsonParse(valueMap[STORAGE_KEYS.rewards], {}) || {};
  const notifications = safeJsonParse(valueMap[STORAGE_KEYS.notifications], seed.notifications) || seed.notifications;
  const settings = safeJsonParse(valueMap[STORAGE_KEYS.settings], {}) || {};
  const social = safeJsonParse(valueMap[STORAGE_KEYS.social], {}) || {};

  return refreshState({
    ...seed,
    ...core,
    user: {
      ...seed.user,
      ...user,
    },
    tasks,
    history,
    trash,
    unlockedRewards: rewards.unlockedRewards || seed.unlockedRewards,
    grantedAchievements: rewards.grantedAchievements || seed.grantedAchievements,
    notifications,
    settings: {
      ...seed.settings,
      ...settings,
    },
    friends: social.friends || seed.friends,
    pendingRequests: social.pendingRequests || seed.pendingRequests,
    discoverableUsers: social.discoverableUsers || seed.discoverableUsers,
    weeklyExpStart: social.weeklyExpStart || seed.weeklyExpStart,
    leaderboardResetDate: social.leaderboardResetDate || seed.leaderboardResetDate,
  });
};

const parseReminderTime = (value = '09:00') => {
  const [hours, minutes] = String(value).split(':').map((item) => Number(item));
  return {
    hour: Number.isFinite(hours) ? hours : 9,
    minute: Number.isFinite(minutes) ? minutes : 0,
  };
};

const syncDailyReminder = async (settings, t) => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.notifications) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminders', {
        name: 'Daily reminders',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const permissions = await Notifications.getPermissionsAsync();
    let status = permissions.status;

    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') return;

    const { hour, minute } = parseReminderTime(settings.dailyReminder);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.dailyTitle'),
        body: t('notifications.dailyBody'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? 'daily-reminders' : undefined,
      },
    });
  } catch (error) {
    console.warn('Failed to sync daily reminder', error);
  }
};

export const AppProvider = ({ children }) => {
  const [baseState, setBaseState] = useState(() => refreshState(createSeedState()));
  const [isReady, setIsReady] = useState(false);
  const baseStateRef = useRef(baseState);
  const persistTimeoutRef = useRef(null);

  const persistStateNow = useCallback((nextState) => persistStateSlices(nextState).catch((error) => {
    console.warn('Failed to save TaskXP state', error);
  }), []);

  useEffect(() => {
    baseStateRef.current = baseState;
  }, [baseState]);

  useEffect(() => {
    const load = async () => {
      try {
        const nextState = await loadPersistedState();
        setBaseState(nextState);
      } catch (error) {
        console.warn('Failed to load TaskXP state', error);
        setBaseState(refreshState(createSeedState()));
      } finally {
        setIsReady(true);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!isReady) return undefined;

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      persistTimeoutRef.current = null;
      persistStateNow(baseState);
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [baseState, isReady, persistStateNow]);

  useEffect(() => () => {
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
      persistStateNow(baseStateRef.current);
    }
  }, [persistStateNow]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setBaseState((prev) => refreshState(prev));
      }

      if ((nextAppState === 'background' || nextAppState === 'inactive') && isReady) {
        persistStateNow(baseStateRef.current);
      }
    });

    return () => subscription.remove();
  }, [isReady, persistStateNow]);

  const language = baseState.settings.language || 'English';
  const t = useCallback((key, vars) => translate(language, key, vars), [language]);
  const locale = useMemo(() => getLocale(language), [language]);
  const theme = useMemo(() => getTheme(baseState.settings.theme), [baseState.settings.theme]);
  const state = useMemo(() => buildViewState(baseState), [baseState]);

  useEffect(() => {
    if (!isReady) return;
    syncDailyReminder(baseState.settings, t);
  }, [baseState.settings.notifications, baseState.settings.dailyReminder, isReady, t]);

  const finishOnboarding = useCallback(() => {
    setBaseState((prev) => refreshState({ ...prev, hasSeenOnboarding: true }));
  }, []);

  const login = useCallback(async ({ email, password, provider } = {}) => {
    if (provider === 'demo-google') {
      setBaseState((prev) => refreshState({
        ...prev,
        hasSeenOnboarding: true,
        isAuthenticated: true,
        user: normalizeUserTitleState({
          ...prev.user,
          email: prev.auth.email,
        }),
        auth: {
          ...prev.auth,
          lastLoginAt: new Date().toISOString(),
        },
      }));
      return { ok: true };
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    if (!normalizedEmail || !normalizedPassword) {
      return { ok: false, errorKey: 'errors.enterBothEmailPassword' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, errorKey: 'errors.validEmail' };
    }

    if (normalizedPassword.length < 8) {
      return { ok: false, errorKey: 'errors.passwordLength' };
    }

    if (normalizedEmail !== String(baseState.auth.email || '').toLowerCase() || normalizedPassword !== DEMO_PASSWORD) {
      return { ok: false, errorKey: 'errors.incorrectDemoCredentials' };
    }

    setBaseState((prev) => refreshState({
      ...prev,
      hasSeenOnboarding: true,
      isAuthenticated: true,
      user: normalizeUserTitleState({
        ...prev.user,
        email: normalizedEmail,
      }),
      auth: {
        ...prev.auth,
        lastLoginAt: new Date().toISOString(),
      },
    }));

    return { ok: true };
  }, [baseState.auth.email]);

  const logout = useCallback(() => {
    setBaseState((prev) => refreshState({ ...prev, isAuthenticated: false }));
  }, []);

  const addTask = useCallback((task) => {
    const now = new Date();
    const dueAt = toDate(task.dueAt, now);
    const normalizedTask = sanitizeTask({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: task.title,
      description: task.description || '',
      category: task.category || 'Work',
      xp: Number(task.xp) || 25,
      repeat: task.repeat || 'None',
      priority: task.priority || 'Medium',
      createdAt: now.toISOString(),
      originalDueAt: dueAt.toISOString(),
      dueAt: dueAt.toISOString(),
      completed: false,
    });

    setBaseState((prev) => refreshState({ ...prev, tasks: [normalizedTask, ...prev.tasks] }, now));
    return normalizedTask;
  }, []);

  const updateTask = useCallback((taskId, payload = {}) => {
    setBaseState((prev) => {
      const now = new Date();
      const tasks = prev.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const nextDueAt = payload.dueAt
          ? toDate(payload.dueAt, task.originalDueAt || task.dueAt || now)
          : toDate(task.originalDueAt || task.dueAt, now);

        return sanitizeTask({
          ...task,
          ...payload,
          title: String(payload.title ?? task.title).trim() || task.title,
          description: String(payload.description ?? task.description ?? ''),
          category: payload.category || task.category,
          xp: Number(payload.xp ?? task.xp) || task.xp,
          repeat: payload.repeat || task.repeat,
          priority: payload.priority || task.priority,
          originalDueAt: nextDueAt.toISOString(),
          dueAt: nextDueAt.toISOString(),
        });
      });

      return refreshState({ ...prev, tasks }, now);
    });
  }, []);

  const deleteTask = useCallback((taskId) => {
    setBaseState((prev) => {
      const target = prev.tasks.find((task) => task.id === taskId);
      if (!target) return prev;

      const now = new Date();
      const trashedItem = sanitizeTrashItem({
        ...target,
        deletedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
      });

      return refreshState({
        ...prev,
        tasks: prev.tasks.filter((task) => task.id !== taskId),
        trash: [trashedItem, ...(prev.trash || [])],
      }, now);
    });
  }, []);

  const completeTask = useCallback((taskId) => {
    const snapshot = baseStateRef.current;
    const completedAt = new Date();
    const viewPrev = buildViewState(snapshot, completedAt);
    const task = viewPrev.tasks.find((item) => item.id === taskId);

    if (!task || task.completed) {
      return {
        ok: false,
        taskId,
        xpEarned: 0,
        didLevelUp: false,
        newLevel: viewPrev.user.level,
        didUnlockAchievement: false,
        doubleExpUsed: false,
        currentStreak: viewPrev.user.currentStreak,
        achievementBonusXp: 0,
      };
    }

    const doubleExpUsed = (snapshot.unlockedRewards || []).includes('double_exp');
    const xpEarned = Math.max(Number(task.xp) || 0, 0) * (doubleExpUsed ? 2 : 1);
    const historyRecord = sanitizeHistoryRecord({
      taskId: task.id,
      title: task.title,
      category: task.category,
      xp: xpEarned,
      repeat: task.repeat,
      completedAt: completedAt.toISOString(),
      dueAt: task.dueAt,
    });

    const tasks = snapshot.tasks.map((item) => (item.id === taskId ? sanitizeTask({
      ...item,
      dueAt: task.dueAt,
      completed: true,
      completedAt: completedAt.toISOString(),
    }) : item));

    const appliedXp = applyXpToUser(snapshot.user, xpEarned);
    let nextState = refreshState({
      ...snapshot,
      user: {
        ...appliedXp.user,
        lastCompletionDate: getLocalDateKey(completedAt),
      },
      tasks,
      history: [...snapshot.history, historyRecord],
      unlockedRewards: doubleExpUsed
        ? (snapshot.unlockedRewards || []).filter((rewardId) => rewardId !== 'double_exp')
        : snapshot.unlockedRewards,
    }, completedAt);

    const viewAfterTask = buildViewState(nextState, completedAt);
    const unlockedNow = getAchievementStates(nextState.history, viewAfterTask.user)
      .filter((achievement) => achievement.unlocked && !(snapshot.grantedAchievements || []).includes(achievement.id));

    let notifications = [...(nextState.notifications || [])];
    if (appliedXp.didLevelUp) {
      notifications = addNotificationRecord(notifications, {
        id: `level-${appliedXp.newLevel}-${getTodayKey(completedAt)}-${task.id}`,
        type: 'level_up',
        title: 'Level up!',
        body: `You reached Level ${appliedXp.newLevel}.`,
        createdAt: completedAt.toISOString(),
        meta: { level: appliedXp.newLevel, source: 'quest', taskId: task.id },
      });
    }

    if (STREAK_MILESTONES.includes(viewAfterTask.user.currentStreak)) {
      notifications = addNotificationRecord(notifications, {
        id: `streak-${viewAfterTask.user.currentStreak}-${getTodayKey(completedAt)}`,
        type: 'streak',
        title: 'Streak milestone',
        body: `${viewAfterTask.user.currentStreak} day streak reached.`,
        createdAt: completedAt.toISOString(),
        meta: { streak: viewAfterTask.user.currentStreak },
      });
    }

    nextState = refreshState({
      ...nextState,
      notifications,
    }, completedAt);

    let achievementBonusXp = 0;
    let achievementTriggeredLevelUp = false;
    unlockedNow.forEach((achievement) => {
      const grant = applyAchievementGrant(nextState, achievement.id, ACHIEVEMENT_XP_MAP[achievement.id] || 0, completedAt);
      nextState = grant.nextState;
      achievementBonusXp += grant.xpGranted;
      achievementTriggeredLevelUp = achievementTriggeredLevelUp || grant.didLevelUp;
    });

    const finalView = buildViewState(nextState, completedAt);
    const result = {
      ok: true,
      taskId,
      xpEarned,
      didLevelUp: appliedXp.didLevelUp || achievementTriggeredLevelUp,
      newLevel: finalView.user.level,
      didUnlockAchievement: unlockedNow.length > 0,
      doubleExpUsed,
      currentStreak: finalView.user.currentStreak,
      achievementBonusXp,
      achievementIds: unlockedNow.map((item) => item.id),
    };

    baseStateRef.current = nextState;
    setBaseState(nextState);
    return result;
  }, []);

  const undoCompleteTask = useCallback((taskId) => {
    setBaseState((prev) => {
      const viewPrev = buildViewState(prev);
      const task = viewPrev.tasks.find((item) => item.id === taskId);
      if (!task || !task.completed) return prev;

      const history = [...prev.history];
      const latestEntry = [...history]
        .map((record, index) => ({ record, index }))
        .filter(({ record }) => record.taskId === taskId)
        .sort((left, right) => new Date(right.record.completedAt) - new Date(left.record.completedAt))[0];

      if (!latestEntry) return prev;
      history.splice(latestEntry.index, 1);

      const tasks = prev.tasks.map((item) => (item.id === taskId ? sanitizeTask({
        ...item,
        completed: false,
        completedAt: null,
      }) : item));

      const user = removeXpFromUser(prev.user, latestEntry.record.xp);
      return refreshState({ ...prev, user, tasks, history });
    });
  }, []);

  const restoreTaskFromTrash = useCallback((taskId) => {
    setBaseState((prev) => {
      const restored = prev.trash.find((task) => task.id === taskId);
      if (!restored) return prev;
      const { deletedAt, expiresAt, ...cleanTask } = restored;
      return refreshState({
        ...prev,
        trash: prev.trash.filter((task) => task.id !== taskId),
        tasks: [sanitizeTask(cleanTask), ...prev.tasks],
      });
    });
  }, []);

  const deletePermanentlyFromTrash = useCallback((taskId) => {
    setBaseState((prev) => refreshState({
      ...prev,
      trash: prev.trash.filter((task) => task.id !== taskId),
    }));
  }, []);

  const restoreAllTrash = useCallback(() => {
    setBaseState((prev) => {
      const restored = (prev.trash || []).map(({ deletedAt, expiresAt, ...task }) => sanitizeTask(task));
      return refreshState({
        ...prev,
        tasks: [...restored, ...prev.tasks],
        trash: [],
      });
    });
  }, []);

  const emptyTrash = useCallback(() => {
    setBaseState((prev) => refreshState({ ...prev, trash: [] }));
  }, []);

  const purgeExpiredTrash = useCallback((ids = []) => {
    setBaseState((prev) => refreshState({
      ...prev,
      trash: prev.trash.filter((task) => !ids.includes(task.id)),
    }));
  }, []);

  const redeemReward = useCallback((reward) => {
    const result = { ok: false, reason: 'unknown' };

    setBaseState((prev) => {
      const rewardId = reward?.id;
      const expCost = Math.max(Number(reward?.expCost) || 0, 0);
      const requiredLevel = Math.max(Number(reward?.requiredLevel) || 1, 1);

      if (!rewardId) {
        result.reason = 'invalid';
        return prev;
      }
      if ((prev.unlockedRewards || []).includes(rewardId)) {
        result.reason = 'owned';
        return prev;
      }
      if ((Number(prev.user.level) || 1) < requiredLevel) {
        result.reason = 'level';
        return prev;
      }
      if ((Number(prev.user.currentXp) || 0) < expCost) {
        result.reason = 'exp';
        return prev;
      }

      result.ok = true;
      result.reason = 'ok';

      return refreshState({
        ...prev,
        user: {
          ...prev.user,
          currentXp: Math.max((Number(prev.user.currentXp) || 0) - expCost, 0),
        },
        settings: rewardId === 'theme_gold'
          ? { ...prev.settings, theme: 'Gold' }
          : prev.settings,
        unlockedRewards: uniq([...(prev.unlockedRewards || []), rewardId]),
        notifications: addNotificationRecord(prev.notifications || [], {
          id: `reward-${rewardId}`,
          type: 'reward',
          title: 'Reward redeemed',
          body: `${reward.name || 'Reward'} has been unlocked.`,
          createdAt: new Date().toISOString(),
          meta: { rewardId },
        }),
      });
    });

    return result;
  }, []);

  const addFriend = useCallback((friend) => {
    setBaseState((prev) => {
      const normalized = sanitizeFriend({ ...friend, status: 'active' });
      if (prev.friends.some((item) => item.id === normalized.id) || prev.friends.some((item) => item.username.toLowerCase() === normalized.username.toLowerCase())) {
        return prev;
      }

      return refreshState({
        ...prev,
        friends: [...prev.friends, normalized],
      });
    });
  }, []);

  const removeFriend = useCallback((friendId) => {
    setBaseState((prev) => refreshState({
      ...prev,
      friends: prev.friends.filter((friend) => friend.id !== friendId),
    }));
  }, []);

  const acceptFriendRequest = useCallback((friendId) => {
    setBaseState((prev) => {
      const request = prev.pendingRequests.find((friend) => friend.id === friendId);
      if (!request) return prev;
      return refreshState({
        ...prev,
        pendingRequests: prev.pendingRequests.filter((friend) => friend.id !== friendId),
        friends: [...prev.friends, sanitizeFriend({ ...request, status: 'active' })],
      });
    });
  }, []);

  const rejectFriendRequest = useCallback((friendId) => {
    setBaseState((prev) => refreshState({
      ...prev,
      pendingRequests: prev.pendingRequests.filter((friend) => friend.id !== friendId),
    }));
  }, []);

  const sendFriendChallenge = useCallback((friend, message) => {
    setBaseState((prev) => refreshState({
      ...prev,
      notifications: addNotificationRecord(prev.notifications || [], {
        id: `challenge-${friend.id}-${Date.now()}`,
        type: 'friend_challenge',
        title: 'Friend challenge',
        body: `${friend.username} sent a mock challenge: ${message}`,
        createdAt: new Date().toISOString(),
        meta: { friendId: friend.id },
      }),
    }));
  }, []);

  const resetWeeklyExp = useCallback(() => {
    const now = new Date();
    setBaseState((prev) => refreshState({
      ...prev,
      weeklyExpStart: Number(prev.user.totalXp) || 0,
      leaderboardResetDate: now.toISOString(),
      friends: prev.friends.map((friend) => ({ ...friend, lastWeekExp: friend.weeklyExp, weeklyExp: 0 })),
    }, now));
  }, []);

  const updateProfile = useCallback((payload) => {
    setBaseState((prev) => refreshState({
      ...prev,
      user: {
        ...prev.user,
        ...normalizeProfileUpdate(payload),
      },
    }));
  }, []);

  const updateSettings = useCallback((payload = {}) => {
    setBaseState((prev) => {
      const nextSettings = { ...prev.settings, ...payload };
      if (payload.theme === 'Gold' && !(prev.unlockedRewards || []).includes('theme_gold')) {
        nextSettings.theme = prev.settings.theme;
      }
      if (payload.dailyGoal !== undefined) {
        nextSettings.dailyGoal = Math.max(Number(payload.dailyGoal) || prev.settings.dailyGoal || 100, 50);
      }
      return refreshState({
        ...prev,
        settings: nextSettings,
      });
    });
  }, []);

  const addNotification = useCallback((notification) => {
    setBaseState((prev) => refreshState({
      ...prev,
      notifications: addNotificationRecord(prev.notifications || [], notification),
    }));
  }, []);

  const markNotificationsRead = useCallback((notificationIds = []) => {
    const ids = uniq(notificationIds);
    if (!ids.length) return;

    setBaseState((prev) => {
      let changed = false;
      const notifications = (prev.notifications || []).map((item) => {
        if (ids.includes(item.id) && !item.read) {
          changed = true;
          return { ...item, read: true };
        }
        return item;
      });

      return changed ? refreshState({ ...prev, notifications }) : prev;
    });
  }, []);

  const markNotificationRead = useCallback((notificationId) => {
    if (!notificationId) return;
    markNotificationsRead([notificationId]);
  }, [markNotificationsRead]);

  const markAllRead = useCallback(() => {
    setBaseState((prev) => {
      const hasUnread = (prev.notifications || []).some((item) => !item.read);
      if (!hasUnread) return prev;
      return refreshState({
        ...prev,
        notifications: (prev.notifications || []).map((item) => ({ ...item, read: true })),
      });
    });
  }, []);

  const grantAchievementXp = useCallback((achievementId, xpAmount) => {
    setBaseState((prev) => applyAchievementGrant(prev, achievementId, xpAmount, new Date()).nextState);
  }, []);

  const restoreDemoData = useCallback(() => {
    setBaseState((prev) => {
      const restored = createSeedState();
      return refreshState({
        ...restored,
        hasSeenOnboarding: prev.hasSeenOnboarding,
        isAuthenticated: prev.isAuthenticated,
        settings: {
          ...restored.settings,
          ...prev.settings,
        },
      });
    });
  }, []);

  const value = useMemo(() => ({
    state,
    isReady,
    theme,
    locale,
    t,
    demoPassword: DEMO_PASSWORD,
    finishOnboarding,
    login,
    logout,
    addTask,
    updateTask,
    deleteTask,
    restoreTaskFromTrash,
    deletePermanentlyFromTrash,
    restoreAllTrash,
    emptyTrash,
    purgeExpiredTrash,
    completeTask,
    undoCompleteTask,
    redeemReward,
    addFriend,
    removeFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendChallenge,
    resetWeeklyExp,
    updateProfile,
    updateSettings,
    addNotification,
    markNotificationsRead,
    markNotificationRead,
    markAllRead,
    grantAchievementXp,
    restoreDemoData,
  }), [
    state,
    isReady,
    theme,
    locale,
    t,
    finishOnboarding,
    login,
    logout,
    addTask,
    updateTask,
    deleteTask,
    restoreTaskFromTrash,
    deletePermanentlyFromTrash,
    restoreAllTrash,
    emptyTrash,
    purgeExpiredTrash,
    completeTask,
    undoCompleteTask,
    redeemReward,
    addFriend,
    removeFriend,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendChallenge,
    resetWeeklyExp,
    updateProfile,
    updateSettings,
    addNotification,
    markNotificationsRead,
    markNotificationRead,
    markAllRead,
    grantAchievementXp,
    restoreDemoData,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
};
