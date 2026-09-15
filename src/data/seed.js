import { addDays, getStartOfWeek, getDayIndexMondayFirst } from '../utils/formatters';

const makeDate = (offsetDays, hour, minute = 0) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

export const createSeedTasks = () => [
  {
    id: 'task-1',
    title: 'Morning meditation',
    description: 'Start the day with a calm 10 minute session.',
    category: 'Health',
    xp: 15,
    repeat: 'Daily',
    priority: 'Low',
    createdAt: makeDate(-14, 7, 0),
    originalDueAt: makeDate(0, 7, 0),
    dueAt: makeDate(0, 7, 0),
    completed: true,
    completedAt: makeDate(0, 7, 10),
  },
  {
    id: 'task-2',
    title: 'Review pull requests',
    description: 'Check open PRs and leave feedback for the team.',
    category: 'Work',
    xp: 30,
    repeat: 'None',
    priority: 'Medium',
    createdAt: makeDate(-2, 9, 30),
    originalDueAt: makeDate(0, 10, 0),
    dueAt: makeDate(0, 10, 0),
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Weekly team meeting',
    description: 'Sync priorities and blockers with the weekly squad.',
    category: 'Work',
    xp: 20,
    repeat: 'Weekly',
    priority: 'Medium',
    createdAt: makeDate(-30, 14, 0),
    originalDueAt: makeDate(1, 14, 0),
    dueAt: makeDate(1, 14, 0),
    completed: true,
    completedAt: makeDate(1, 14, 35),
  },
  {
    id: 'task-4',
    title: 'Read 30 pages',
    description: 'Progress one chapter before the end of the day.',
    category: 'Learning',
    xp: 25,
    repeat: 'None',
    priority: 'Low',
    createdAt: makeDate(-3, 12, 0),
    originalDueAt: makeDate(0, 20, 0),
    dueAt: makeDate(0, 20, 0),
    completed: false,
  },
  {
    id: 'task-5',
    title: 'Grocery shopping',
    description: 'Buy the weekly essentials and fruits.',
    category: 'Personal',
    xp: 10,
    repeat: 'None',
    priority: 'Low',
    createdAt: makeDate(-1, 13, 0),
    originalDueAt: makeDate(1, 17, 0),
    dueAt: makeDate(1, 17, 0),
    completed: false,
  },
  {
    id: 'task-6',
    title: 'Complete project proposal',
    description: 'Finalize copy and send the proposal draft.',
    category: 'Work',
    xp: 50,
    repeat: 'None',
    priority: 'High',
    createdAt: makeDate(-4, 11, 0),
    originalDueAt: makeDate(0, 14, 0),
    dueAt: makeDate(0, 14, 0),
    completed: false,
  },
  {
    id: 'task-7',
    title: 'Daily workout - 30 min',
    description: 'Light cardio and mobility set.',
    category: 'Health',
    xp: 25,
    repeat: 'Daily',
    priority: 'Medium',
    createdAt: makeDate(-10, 18, 0),
    originalDueAt: makeDate(0, 18, 0),
    dueAt: makeDate(0, 18, 0),
    completed: false,
  },
  {
    id: 'task-8',
    title: 'Review code changes',
    description: 'Clean up UI polish issues before release.',
    category: 'Work',
    xp: 30,
    repeat: 'None',
    priority: 'Medium',
    createdAt: makeDate(-2, 15, 0),
    originalDueAt: makeDate(0, 16, 0),
    dueAt: makeDate(0, 16, 0),
    completed: false,
  },
];

const XP_CHUNKS = [50, 30, 25, 20, 15, 10, 5];
const CATEGORY_ROTATION = ['Work', 'Health', 'Learning', 'Personal'];

const buildChunkedXp = (total) => {
  const chunks = [];
  let remaining = total;

  while (remaining > 0) {
    const next = XP_CHUNKS.find((chunk) => chunk <= remaining) || remaining;
    chunks.push(next);
    remaining -= next;
  }

  return chunks;
};

const recordFactory = () => {
  let counter = 0;
  return ({ taskId = null, title, category, xp, completedAt, dueAt = null, repeat = 'None' }) => ({
    id: `history-${counter += 1}`,
    taskId,
    title,
    category,
    xp,
    repeat,
    completedAt: new Date(completedAt).toISOString(),
    dueAt: dueAt ? new Date(dueAt).toISOString() : null,
  });
};

const buildSeedHistory = (tasks) => {
  const makeRecord = recordFactory();
  const history = [];
  const weekXpTemplate = [120, 180, 150, 200, 170, 140, 160];
  const currentWeekStart = getStartOfWeek(new Date());

  const explicitSeedCompletions = tasks
    .filter((task) => task.completed && task.completedAt)
    .map((task) => makeRecord({
      taskId: task.id,
      title: task.title,
      category: task.category,
      xp: task.xp,
      completedAt: task.completedAt,
      dueAt: task.dueAt,
      repeat: task.repeat,
    }));

  history.push(...explicitSeedCompletions);

  const explicitXpByDay = Array(7).fill(0);
  explicitSeedCompletions.forEach((record) => {
    const index = getDayIndexMondayFirst(record.completedAt);
    explicitXpByDay[index] += Number(record.xp) || 0;
  });

  weekXpTemplate.forEach((totalXp, dayIndex) => {
    const remainder = Math.max(totalXp - explicitXpByDay[dayIndex], 0);
    if (!remainder) return;

    const dayDate = addDays(currentWeekStart, dayIndex);
    const chunks = buildChunkedXp(remainder);

    chunks.forEach((xp, chunkIndex) => {
      const completedAt = new Date(dayDate);
      completedAt.setHours(9 + (chunkIndex % 6), (chunkIndex * 7) % 60, 0, 0);
      const dueAt = new Date(completedAt);
      dueAt.setHours(completedAt.getHours() + 1);

      history.push(makeRecord({
        title: `Seed Quest ${dayIndex + 1}-${chunkIndex + 1}`,
        category: CATEGORY_ROTATION[(dayIndex + chunkIndex) % CATEGORY_ROTATION.length],
        xp,
        completedAt,
        dueAt,
      }));
    });
  });

  const targetCount = 84;
  let offset = 8;
  while (history.length < targetCount) {
    const completedAt = addDays(new Date(), -offset);
    completedAt.setHours(11 + (history.length % 5), (history.length * 5) % 60, 0, 0);
    const dueAt = new Date(completedAt);
    dueAt.setHours(completedAt.getHours() + 2);

    history.push(makeRecord({
      title: `Archived Quest ${history.length + 1}`,
      category: CATEGORY_ROTATION[history.length % CATEGORY_ROTATION.length],
      xp: XP_CHUNKS[history.length % XP_CHUNKS.length],
      completedAt,
      dueAt,
    }));

    offset += 1;
  }

  return history;
};



export const createSeedFriends = () => [
  {
    id: 'friend_1',
    username: 'NinjaCoderTH',
    level: 12,
    weeklyExp: 3200,
    lastWeekExp: 2800,
    totalExp: 18500,
    streak: 14,
    avatar: null,
    status: 'active',
  },
  {
    id: 'friend_2',
    username: 'MintQuest',
    level: 9,
    weeklyExp: 2750,
    lastWeekExp: 3000,
    totalExp: 14900,
    streak: 9,
    avatar: null,
    status: 'active',
  },
  {
    id: 'friend_3',
    username: 'ฟ้าใส',
    level: 7,
    weeklyExp: 1820,
    lastWeekExp: 1600,
    totalExp: 9200,
    streak: 5,
    avatar: null,
    status: 'active',
  },
  {
    id: 'friend_4',
    username: 'PixelRunner',
    level: 15,
    weeklyExp: 4100,
    lastWeekExp: 3600,
    totalExp: 24100,
    streak: 28,
    avatar: null,
    status: 'active',
  },
];


export const createDiscoverableUsers = () => [
  { id: 'discover_1', username: 'QuestNami', level: 5, weeklyExp: 860, lastWeekExp: 700, totalExp: 5200, streak: 4, avatar: null, status: 'discoverable' },
  { id: 'discover_2', username: 'RunePilot', level: 8, weeklyExp: 1460, lastWeekExp: 1120, totalExp: 9700, streak: 6, avatar: null, status: 'discoverable' },
  { id: 'discover_3', username: 'MangoMage', level: 12, weeklyExp: 2100, lastWeekExp: 1800, totalExp: 15300, streak: 9, avatar: null, status: 'discoverable' },
  { id: 'discover_4', username: 'AomQuest', level: 4, weeklyExp: 540, lastWeekExp: 390, totalExp: 3100, streak: 2, avatar: null, status: 'discoverable' },
  { id: 'discover_5', username: 'KirinFocus', level: 10, weeklyExp: 1840, lastWeekExp: 1620, totalExp: 12500, streak: 8, avatar: null, status: 'discoverable' },
  { id: 'discover_6', username: 'PixelPalm', level: 7, weeklyExp: 1180, lastWeekExp: 980, totalExp: 8600, streak: 5, avatar: null, status: 'discoverable' },
  { id: 'discover_7', username: 'LionLearner', level: 6, weeklyExp: 930, lastWeekExp: 850, totalExp: 6400, streak: 3, avatar: null, status: 'discoverable' },
  { id: 'discover_8', username: 'ZenCoder', level: 14, weeklyExp: 2680, lastWeekExp: 2410, totalExp: 19700, streak: 15, avatar: null, status: 'discoverable' },
  { id: 'discover_9', username: 'MildStorm', level: 9, weeklyExp: 1590, lastWeekExp: 1330, totalExp: 11100, streak: 7, avatar: null, status: 'discoverable' },
  { id: 'discover_10', username: 'โนว่าล่าฝัน', level: 11, weeklyExp: 1750, lastWeekExp: 1400, totalExp: 13600, streak: 10, avatar: null, status: 'discoverable' },
  { id: 'discover_11', username: 'StudyRogue', level: 13, weeklyExp: 2300, lastWeekExp: 2000, totalExp: 17100, streak: 12, avatar: null, status: 'discoverable' },
  { id: 'discover_12', username: 'BlueLantern', level: 3, weeklyExp: 420, lastWeekExp: 360, totalExp: 2200, streak: 1, avatar: null, status: 'discoverable' },
];

const createSeedPendingRequests = () => [
  {
    id: 'request_1',
    username: 'QuestMimi',
    level: 6,
    weeklyExp: 900,
    totalExp: 6200,
    streak: 4,
    avatar: null,
    status: 'requested',
  },
  {
    id: 'request_2',
    username: 'โบ๊ทลุยงาน',
    level: 11,
    weeklyExp: 2100,
    totalExp: 13800,
    streak: 11,
    avatar: null,
    status: 'requested',
  },
];

export const createSeedState = () => {
  const tasks = createSeedTasks();
  const friends = createSeedFriends();
  const discoverableUsers = createDiscoverableUsers();
  return {
    hasSeenOnboarding: false,
    isAuthenticated: false,
    lastDailyReset: new Date().toDateString(),
    auth: {
      mode: 'demo-local',
      email: 'demo@taskxp.app',
      lastLoginAt: null,
    },
    user: {
      name: 'Alex Johnson',
      email: 'alex.johnson@email.com',
      level: 12,
      titleKey: 'adventurer',
      customTitle: '',
      title: 'Adventurer',
      currentXp: 850,
      xpGoal: 1000,
      totalXp: 12450,
      currentStreak: 7,
      longestStreak: 14,
      lastCompletionDate: null,
    },
    stats: {
      dailyXp: 0,
      dailyGoal: 100,
      completedCount: 0,
      thisWeekXp: 0,
    },
    charts: {
      weekXp: [0, 0, 0, 0, 0, 0, 0],
      categoryProgress: [0, 0, 0, 0],
    },
    grantedAchievements: [],
    trash: [],
    unlockedRewards: [],
    friends,
    pendingRequests: createSeedPendingRequests(),
    discoverableUsers,
    notifications: [],
    weeklyExpStart: 0,
    leaderboardResetDate: null,
    history: buildSeedHistory(tasks),
    tasks,
    settings: {
      notifications: true,
      dailyReminder: '09:00',
      dailyGoal: 100,
      theme: 'Light',
      language: 'English',
    },
  };
};
