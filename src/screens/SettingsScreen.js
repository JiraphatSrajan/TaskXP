import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import ModalPicker from '../components/ModalPicker';
import Screen from '../components/Screen';
import { GradientHeader, MenuRow } from '../components/UI';
import { LANGUAGE_KEYS } from '../constants/i18n';
import { useApp } from '../context/AppContext';

const THEME_OPTIONS = ['Light', 'Dark', 'Gold'];
const REMINDER_OPTIONS = ['08:00', '09:00', '10:00', '18:00'];

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

export default function SettingsScreen({ navigation }) {
  const { state, updateSettings, restoreDemoData, logout, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [modalState, setModalState] = useState(null);
  const hasGoldTheme = (state.unlockedRewards || []).includes('theme_gold');

  const openPicker = (type) => setModalState(type);
  const closePicker = () => setModalState(null);

  const pickerConfig = {
    reminder: {
      title: t('settings.dailyReminder'),
      options: REMINDER_OPTIONS.map((value) => ({ value, label: value })),
      value: state.settings.dailyReminder,
      onSelect: (value) => updateSettings({ dailyReminder: value }),
    },
    theme: {
      title: t('settings.theme'),
      options: THEME_OPTIONS
        .filter((value) => value !== 'Gold' || hasGoldTheme)
        .map((value) => ({ value, label: t(`theme.${value}`) })),
      value: state.settings.theme,
      onSelect: (value) => updateSettings({ theme: value }),
    },
    language: {
      title: t('settings.language'),
      options: LANGUAGE_KEYS.map((value) => ({ value, label: t(`language.${value}`) })),
      value: state.settings.language,
      onSelect: (value) => updateSettings({ language: value }),
    },
  }[modalState || 'theme'];

  return (
    <Screen withTabBarPadding>
      <GradientHeader withBack onBack={() => navigation.goBack()} title={t('settings.title')} />

      <Text style={styles.sectionLabel}>{t('settings.preferences')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.leftRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.blueSoft }]}><Ionicons name="notifications-outline" size={18} color={theme.colors.blue} /></View>
            <Text style={styles.rowLabel}>{t('settings.notifications')}</Text>
          </View>
          <Switch
            value={state.settings.notifications}
            onValueChange={(value) => updateSettings({ notifications: value })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primarySoft }}
            thumbColor={state.settings.notifications ? theme.colors.primary : '#FFFFFF'}
          />
        </View>

        <Pressable style={styles.row} onPress={() => openPicker('reminder')}>
          <View style={styles.leftRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.lilacSoft }]}><Ionicons name="time-outline" size={18} color={theme.colors.primary} /></View>
            <Text style={styles.rowLabel}>{t('settings.dailyReminder')}</Text>
          </View>
          <View style={styles.rightRow}><Text style={styles.rowValue}>{state.settings.dailyReminder}</Text><Ionicons name="chevron-forward" size={15} color={theme.colors.textMuted} /></View>
        </Pressable>

        <Pressable style={styles.row} onPress={() => openPicker('theme')}>
          <View style={styles.leftRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.pinkSoft }]}><Ionicons name="color-palette-outline" size={18} color={theme.colors.pink} /></View>
            <Text style={styles.rowLabel}>{t('settings.theme')}</Text>
          </View>
          <View style={styles.rightRow}><Text style={styles.rowValue}>{t(`theme.${state.settings.theme}`)}</Text><Ionicons name="chevron-down" size={15} color={theme.colors.textMuted} /></View>
        </Pressable>

        <Pressable style={[styles.row, styles.rowNoBorder]} onPress={() => openPicker('language')}>
          <View style={styles.leftRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.greenSoft }]}><Ionicons name="language-outline" size={18} color={theme.colors.green} /></View>
            <Text style={styles.rowLabel}>{t('settings.language')}</Text>
          </View>
          <View style={styles.rightRow}><Text style={styles.rowValue}>{t(`language.${state.settings.language}`)}</Text><Ionicons name="chevron-down" size={15} color={theme.colors.textMuted} /></View>
        </Pressable>
      </View>

      {!hasGoldTheme ? (
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>{state.settings.language === 'Thai' ? 'Gold theme ยังไม่ปลดล็อก' : 'Gold theme is locked'}</Text>
          <Text style={styles.tipText}>{state.settings.language === 'Thai' ? 'ซื้อรางวัล theme_gold จาก Reward Shop ก่อน ถึงจะเลือกธีมนี้ได้' : 'Unlock theme_gold in the Reward Shop before selecting it here.'}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{state.settings.language === 'Thai' ? 'เพิ่มเติม' : 'More'}</Text>
      <MenuRow icon="help-circle-outline" iconBg={theme.colors.blueSoft} label={state.settings.language === 'Thai' ? 'Help & FAQ' : 'Help & FAQ'} onPress={() => navigateToRoot(navigation, 'Help')} />
      <MenuRow icon="flag-outline" iconBg={theme.colors.orangeSoft} label={state.settings.language === 'Thai' ? 'Daily Goal' : 'Daily Goal'} value={`${state.stats.dailyGoal} XP`} onPress={() => navigateToRoot(navigation, 'DailyGoal')} />

      <Text style={styles.sectionLabel}>{state.settings.language === 'Thai' ? 'จัดการข้อมูล' : 'Data'}</Text>
      <Pressable style={styles.actionButton} onPress={() => Alert.alert(state.settings.language === 'Thai' ? 'คืนค่าเดโม่?' : 'Restore demo data?', '', [{ text: t('common.cancel'), style: 'cancel' }, { text: state.settings.language === 'Thai' ? 'คืนค่า' : 'Restore', onPress: restoreDemoData }])}>
        <Text style={styles.actionButtonText}>{state.settings.language === 'Thai' ? 'Restore Demo Data' : 'Restore Demo Data'}</Text>
      </Pressable>
      <Pressable style={[styles.actionButton, styles.logoutButton]} onPress={logout}>
        <Text style={[styles.actionButtonText, styles.logoutText]}>{state.settings.language === 'Thai' ? 'ออกจากระบบ' : 'Logout'}</Text>
      </Pressable>

      <ModalPicker visible={Boolean(modalState)} title={pickerConfig.title} options={pickerConfig.options} selectedValue={pickerConfig.value} onClose={closePicker} onSelect={(value) => { pickerConfig.onSelect(value); closePicker(); }} />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  sectionLabel: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12, marginTop: 14, marginBottom: 8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, paddingHorizontal: 16, ...theme.shadow.card },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  rowNoBorder: { borderBottomWidth: 0 },
  leftRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { color: theme.colors.text, fontWeight: '700', marginLeft: 12 },
  rightRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  rowValue: { color: theme.colors.textMuted, fontWeight: '700', marginRight: 6 },
  tipCard: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 14, marginTop: 12, ...theme.shadow.card },
  tipTitle: { color: theme.colors.text, fontWeight: '800' },
  tipText: { color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 },
  actionButton: { backgroundColor: theme.colors.surface, minHeight: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 10, ...theme.shadow.card },
  actionButtonText: { color: theme.colors.text, fontWeight: '800' },
  logoutButton: { borderWidth: 1, borderColor: theme.colors.danger },
  logoutText: { color: theme.colors.danger },
});
