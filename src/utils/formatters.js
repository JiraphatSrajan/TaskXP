export const toDate = (value, fallback = null) => {
  if (value instanceof Date) return new Date(value);
  if (!value) return fallback ? new Date(fallback) : null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback ? new Date(fallback) : null;
  return date;
};

export const getTodayKey = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateKey = (value, fallback = null) => {
  const date = toDate(value, fallback);
  return date ? getTodayKey(date) : null;
};

export const isSameDay = (left, right) => {
  const a = toDate(left);
  const b = toDate(right);
  if (!a || !b) return false;
  return getLocalDateKey(a) === getLocalDateKey(b);
};

export const addDays = (value, amount) => {
  const date = toDate(value, new Date());
  date.setDate(date.getDate() + amount);
  return date;
};

export const getStartOfWeek = (value = new Date()) => {
  const date = toDate(value, new Date());
  date.setHours(0, 0, 0, 0);
  const diff = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date;
};

export const getEndOfWeek = (value = new Date()) => {
  const date = getStartOfWeek(value);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const isSameWeek = (left, right = new Date()) => getTodayKey(getStartOfWeek(left)) === getTodayKey(getStartOfWeek(right));

export const getMonthKey = (value = new Date()) => {
  const date = toDate(value, new Date());
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
};

export const getCycleKey = (value, repeat = 'None') => {
  const date = toDate(value);
  if (!date) return null;
  if (repeat === 'Daily') return getTodayKey(date);
  if (repeat === 'Weekly') return getTodayKey(getStartOfWeek(date));
  if (repeat === 'Monthly') return getMonthKey(date);
  return getTodayKey(date);
};

export const getRepeatedDueAt = (referenceValue, repeat, now = new Date()) => {
  const reference = toDate(referenceValue, now);
  const current = toDate(now, new Date());
  const next = new Date(current);

  if (repeat === 'Daily') {
    next.setHours(reference.getHours(), reference.getMinutes(), 0, 0);
    return next.toISOString();
  }

  if (repeat === 'Weekly') {
    const start = getStartOfWeek(current);
    const refIndex = getDayIndexMondayFirst(reference);
    start.setDate(start.getDate() + refIndex);
    start.setHours(reference.getHours(), reference.getMinutes(), 0, 0);
    return start.toISOString();
  }

  if (repeat === 'Monthly') {
    const year = current.getFullYear();
    const month = current.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(reference.getDate(), lastDay);
    const nextMonthly = new Date(year, month, day, reference.getHours(), reference.getMinutes(), 0, 0);
    return nextMonthly.toISOString();
  }

  return reference.toISOString();
};

export const isDueToday = (value, now = new Date()) => isSameDay(value, now);

export const formatShortTime = (value, locale = 'en-US') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
};

export const formatNumericTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const formatSlashDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatTaskDay = (value, { locale = 'en-US', t = (key) => key } = {}) => {
  if (!value) return t('common.noDueDate');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('common.noDueDate');
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) return t('common.today');
  if (isSameDay(date, tomorrow)) return t('common.tomorrow');
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

export const formatLevelTag = (level, t = (key) => key) => `${t('common.level')} ${level}`;

export const getDayIndexMondayFirst = (date = new Date()) => {
  const day = new Date(date).getDay();
  return (day + 6) % 7;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
