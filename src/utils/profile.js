const DEFAULT_TITLE_KEY = 'adventurer';
const LEGACY_DEFAULT_TITLES = new Set(['Adventurer', 'นักผจญภัย', '冒険者', 'Aventurero']);

const cleanString = (value) => String(value ?? '').trim();

export const normalizeUserTitleState = (user = {}) => {
  const customTitle = cleanString(user.customTitle);
  const legacyTitle = cleanString(user.title);
  const titleKey = cleanString(user.titleKey);

  if (customTitle) {
    return {
      ...user,
      titleKey: 'custom',
      customTitle,
      title: customTitle,
    };
  }

  if (titleKey && titleKey !== 'custom') {
    return {
      ...user,
      titleKey,
      customTitle: '',
      title: 'Adventurer',
    };
  }

  if (!legacyTitle || LEGACY_DEFAULT_TITLES.has(legacyTitle)) {
    return {
      ...user,
      titleKey: DEFAULT_TITLE_KEY,
      customTitle: '',
      title: 'Adventurer',
    };
  }

  return {
    ...user,
    titleKey: 'custom',
    customTitle: legacyTitle,
    title: legacyTitle,
  };
};

export const resolveUserTitle = (user, t) => {
  const customTitle = cleanString(user?.customTitle);
  if (customTitle) return customTitle;

  if (user?.titleKey === DEFAULT_TITLE_KEY || !user?.titleKey) {
    return t('common.adventurer');
  }

  return cleanString(user?.title) || t('common.adventurer');
};

export const normalizeProfileUpdate = (payload = {}) => {
  const name = cleanString(payload.name);
  const email = cleanString(payload.email);
  const titleInput = cleanString(payload.title);

  if (!titleInput || LEGACY_DEFAULT_TITLES.has(titleInput)) {
    return {
      name,
      email,
      title: 'Adventurer',
      titleKey: DEFAULT_TITLE_KEY,
      customTitle: '',
    };
  }

  return {
    name,
    email,
    title: titleInput,
    titleKey: 'custom',
    customTitle: titleInput,
  };
};

export const DEFAULT_PROFILE_TITLE = DEFAULT_TITLE_KEY;
