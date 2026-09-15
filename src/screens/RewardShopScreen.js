import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Screen from '../components/Screen';
import { Pill } from '../components/UI';
import { useApp } from '../context/AppContext';

const CUSTOM_REWARDS_KEY = 'custom_rewards';

const IN_APP_REWARDS = [
  {
    id: 'theme_gold',
    name: 'ธีมสีทอง',
    description: 'เปลี่ยนสีแอปเป็นธีมสีทองพิเศษ',
    icon: '👑',
    expCost: 1000,
    requiredLevel: 10,
    type: 'theme',
  },
  {
    id: 'streak_shield',
    name: 'Streak Shield',
    description: 'ป้องกัน Streak ไม่ให้หายเมื่อลืม 1 วัน',
    icon: '🛡️',
    expCost: 500,
    requiredLevel: 5,
    type: 'consumable',
  },
  {
    id: 'icon_fire',
    name: 'ไอคอนไฟ',
    description: 'ไอคอนพิเศษสำหรับ Profile',
    icon: '🔥',
    expCost: 300,
    requiredLevel: 1,
    type: 'cosmetic',
  },
  {
    id: 'double_exp',
    name: 'Double EXP (1 วัน)',
    description: 'รับ EXP x2 ทุก Task ที่ทำเสร็จในวันนี้',
    icon: '⚡',
    expCost: 800,
    requiredLevel: 3,
    type: 'booster',
  },
];

const DEFAULT_FORM = {
  name: '',
  description: '',
  icon: '🎁',
  expCost: '',
};

export default function RewardShopScreen() {
  const { state, redeemReward, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [activeTab, setActiveTab] = useState('inApp');
  const [realRewards, setRealRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const listRef = useRef(null);
  const scrollOffsets = useRef({ inApp: 0, real: 0 });
  const successAnimations = useRef({});
  const countAnim = useRef(new Animated.Value(0)).current;
  const [animatedExp, setAnimatedExp] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadCustomRewards = async () => {
      try {
        const raw = await AsyncStorage.getItem(CUSTOM_REWARDS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (mounted) {
          setRealRewards(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.warn('Failed to load custom rewards', error);
        if (mounted) {
          setRealRewards([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCustomRewards();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const listener = countAnim.addListener(({ value }) => {
      setAnimatedExp(Math.round(value));
    });

    Animated.timing(countAnim, {
      toValue: state.user.currentXp,
      duration: 850,
      useNativeDriver: false,
    }).start();

    return () => countAnim.removeListener(listener);
  }, [countAnim, state.user.currentXp]);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: scrollOffsets.current[activeTab] || 0, animated: false });
    });
  }, [activeTab]);

  const rewardData = useMemo(() => (activeTab === 'inApp' ? IN_APP_REWARDS : realRewards), [activeTab, realRewards]);
  const xpToNextLevel = Math.max((state.user.xpGoal || 0) - (state.user.currentXp || 0), 0);

  const getCardStatus = (reward) => {
    const isOwned = state.unlockedRewards.includes(reward.id);
    const levelLocked = (state.user.level || 1) < (reward.requiredLevel || 1);
    const notEnoughExp = (state.user.currentXp || 0) < (reward.expCost || 0);

    if (isOwned) return 'owned';
    if (levelLocked) return 'locked';
    if (notEnoughExp) return 'no-exp';
    return 'available';
  };

  const runSuccessAnimation = (rewardId) => {
    if (!successAnimations.current[rewardId]) {
      successAnimations.current[rewardId] = new Animated.Value(1);
    }

    Animated.sequence([
      Animated.timing(successAnimations.current[rewardId], {
        toValue: 1.06,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(successAnimations.current[rewardId], {
        toValue: 1,
        friction: 4,
        tension: 110,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRedeem = (reward) => {
    const status = getCardStatus(reward);

    if (status === 'no-exp') {
      Alert.alert(t('rewardShop.notEnough'));
      return;
    }

    if (status === 'locked') {
      Alert.alert(t('rewardShop.levelLow'));
      return;
    }

    if (status === 'owned') {
      Alert.alert(t('rewardShop.alreadyOwned'));
      return;
    }

    Alert.alert(
      t('rewardShop.title'),
      t('rewardShop.confirmRedeem', { name: reward.name, cost: reward.expCost }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rewardShop.redeem'),
          onPress: () => {
            const result = redeemReward(reward);
            if (!result.ok) {
              if (result.reason === 'exp') {
                Alert.alert(t('rewardShop.notEnough'));
                return;
              }
              if (result.reason === 'level') {
                Alert.alert(t('rewardShop.levelLow'));
                return;
              }
              if (result.reason === 'owned') {
                Alert.alert(t('rewardShop.alreadyOwned'));
                return;
              }
              return;
            }

            runSuccessAnimation(reward.id);
            Alert.alert(t('rewardShop.success'));
          },
        },
      ],
    );
  };

  const saveCustomReward = async () => {
    const expCost = Math.max(Number(form.expCost) || 0, 0);
    if (!form.name.trim() || !form.description.trim() || !form.icon.trim() || !expCost) {
      Alert.alert(t('rewardShop.createTitle'), t('rewardShop.fillAllFields'));
      return;
    }

    const nextReward = {
      id: `custom_${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon.trim(),
      expCost,
      requiredLevel: 1,
      type: 'real',
      isCustom: true,
    };

    const nextRewards = [nextReward, ...realRewards];

    try {
      await AsyncStorage.setItem(CUSTOM_REWARDS_KEY, JSON.stringify(nextRewards));
      setRealRewards(nextRewards);
      setForm(DEFAULT_FORM);
      setModalVisible(false);
      setActiveTab('real');
    } catch (error) {
      console.warn('Failed to save custom reward', error);
      Alert.alert(t('rewardShop.createTitle'), t('rewardShop.unableToSave'));
    }
  };

  const renderRewardCard = ({ item }) => {
    const status = getCardStatus(item);
    const scaleValue = successAnimations.current[item.id] || new Animated.Value(1);
    successAnimations.current[item.id] = scaleValue;

    const buttonStyle = [styles.redeemButton];
    const buttonTextStyle = [styles.redeemButtonText];
    let buttonText = t('rewardShop.redeem');

    if (status === 'owned') {
      buttonStyle.push(styles.redeemButtonOwned);
      buttonTextStyle.push(styles.redeemButtonOwnedText);
      buttonText = `✓ ${t('rewardShop.owned')}`;
    } else if (status === 'locked') {
      buttonStyle.push(styles.redeemButtonLocked);
      buttonTextStyle.push(styles.redeemButtonLockedText);
      buttonText = `🔒 ${t('rewardShop.needLevel', { level: item.requiredLevel || 1 })}`;
    } else if (status === 'no-exp') {
      buttonStyle.push(styles.redeemButtonDanger);
      buttonText = t('rewardShop.expShort');
    }

    return (
      <Animated.View style={[styles.cardWrap, { transform: [{ scale: scaleValue }] }]}> 
        <View style={styles.rewardCard}>
          <View style={styles.iconBubble}>
            <Text style={styles.rewardIcon}>{item.icon}</Text>
          </View>

          <Text style={styles.rewardName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>{item.description}</Text>

          <Pill label={`⚡ ${item.expCost} EXP`} backgroundColor={theme.colors.primarySoft} color={theme.colors.primary} style={styles.costBadge} />

          <Pressable style={buttonStyle} onPress={() => handleRedeem(item)}>
            <Text style={buttonTextStyle} numberOfLines={1}>{buttonText}</Text>
          </Pressable>

          {status === 'locked' ? (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockEmoji}>🔒</Text>
              <Text style={styles.lockText}>{t('rewardShop.requiredLevelLabel', { level: item.requiredLevel || 1 })}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  return (
    <Screen scroll={false}>
      <FlatList
        ref={listRef}
        data={rewardData}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderRewardCard}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrap}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          scrollOffsets.current[activeTab] = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        ListHeaderComponent={(
          <>
            <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.heroCard}>
              <Text style={styles.heroValue}>⚡ {animatedExp.toLocaleString()} EXP</Text>
              <Text style={styles.heroSubtitle}>{t('rewardShop.levelToNext', { level: state.user.level, xp: xpToNextLevel })}</Text>
            </LinearGradient>

            <View style={styles.tabsRow}>
              <Pressable style={styles.tabButton} onPress={() => setActiveTab('inApp')}>
                <Text style={[styles.tabText, activeTab === 'inApp' && styles.tabTextActive]}>🎮 {t('rewardShop.inApp')}</Text>
                <View style={[styles.tabUnderline, activeTab === 'inApp' && styles.tabUnderlineActive]} />
              </Pressable>
              <Pressable style={styles.tabButton} onPress={() => setActiveTab('real')}>
                <Text style={[styles.tabText, activeTab === 'real' && styles.tabTextActive]}>🎁 {t('rewardShop.real')}</Text>
                <View style={[styles.tabUnderline, activeTab === 'real' && styles.tabUnderlineActive]} />
              </Pressable>
            </View>

            {activeTab === 'real' ? (
              <Pressable style={styles.addCustomButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addCustomText}>＋ {t('rewardShop.addCustom')}</Text>
              </Pressable>
            ) : null}
          </>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyTitle}>{t('rewardShop.emptyReal')}</Text>
              <Text style={styles.emptyText}>{t('rewardShop.emptyRealSub')}</Text>
            </View>
          )
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('rewardShop.createTitle')}</Text>

            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholder={t('rewardShop.rewardName')}
              placeholderTextColor={theme.colors.textSoft}
            />
            <TextInput
              style={styles.input}
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder={t('rewardShop.description')}
              placeholderTextColor={theme.colors.textSoft}
            />
            <TextInput
              style={styles.input}
              value={form.icon}
              onChangeText={(value) => setForm((prev) => ({ ...prev, icon: value }))}
              placeholder={t('rewardShop.icon')}
              placeholderTextColor={theme.colors.textSoft}
            />
            <TextInput
              style={styles.input}
              value={form.expCost}
              onChangeText={(value) => setForm((prev) => ({ ...prev, expCost: value }))}
              placeholder={t('rewardShop.expCost')}
              placeholderTextColor={theme.colors.textSoft}
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondaryButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalSecondaryText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.modalPrimaryButton} onPress={saveCustomReward}>
                <Text style={styles.modalPrimaryText}>{t('rewardShop.saveReward')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: 28 },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    ...theme.shadow.header,
  },
  heroValue: {
    color: 'white',
    fontSize: 30,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 8,
    color: 'white',
    fontSize: 13,
    opacity: 0.92,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingTop: 10,
    marginTop: 16,
    ...theme.shadow.card,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '900',
  },
  tabUnderline: {
    height: 3,
    width: '80%',
    borderRadius: 999,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: theme.colors.primary,
  },
  addCustomButton: {
    marginTop: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  addCustomText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  columnWrap: {
    justifyContent: 'space-between',
  },
  cardWrap: {
    width: '48%',
    marginTop: 14,
  },
  rewardCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 14,
    minHeight: 220,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  iconBubble: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rewardIcon: {
    fontSize: 34,
  },
  rewardName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    minHeight: 36,
  },
  rewardDescription: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    minHeight: 36,
  },
  costBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  redeemButton: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  redeemButtonOwned: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  redeemButtonOwnedText: {
    color: theme.colors.success,
  },
  redeemButtonLocked: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  redeemButtonLockedText: {
    color: theme.colors.textMuted,
  },
  redeemButtonDanger: {
    backgroundColor: theme.colors.danger,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  lockEmoji: {
    fontSize: 28,
  },
  lockText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyWrap: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    marginTop: 18,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 18,
    ...theme.shadow.card,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceMuted,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalSecondaryText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: 'white',
    fontWeight: '800',
  },
});
