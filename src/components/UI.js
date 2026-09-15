import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryMeta, priorityMeta } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { formatShortTime, formatTaskDay } from '../utils/formatters';

export function GradientHeader({ title, subtitle, children, withBack, onBack, rightAction }) {
  const { theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerWrap}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitleRow}>
          {withBack ? (
            <Pressable style={styles.backButton} onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.goBack')}>
              <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
            {subtitle ? <Text style={styles.headerSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightAction || null}
      </View>
      {children}
    </LinearGradient>
  );
}

export function HeaderIconButton({ icon, onPress, label = 'Action' }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable style={styles.headerIconButton} onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color="#FFFFFF" />
    </Pressable>
  );
}

export function ProgressBar({ value, max, color, height = 8, trackStyle, fillStyle }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const width = max > 0 ? `${Math.min((value / max) * 100, 100)}%` : '0%';

  return (
    <View style={[styles.progressTrack, { height }, trackStyle]}>
      <View style={[styles.progressFill, { width, backgroundColor: color || theme.colors.yellow }, fillStyle]} />
    </View>
  );
}

export function StatBox({ icon, iconBg, iconColor, value, label, sublabel, containerStyle }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.statBox, containerStyle]}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}> 
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sublabel ? <Text style={styles.statSubLabel}>{sublabel}</Text> : null}
    </View>
  );
}

export function Pill({ label, backgroundColor, color, style }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.pill, { backgroundColor: backgroundColor || theme.colors.surfaceMuted }, style]}>
      <Text style={[styles.pillText, { color: color || theme.colors.text }]}>{label}</Text>
    </View>
  );
}

export function FilterChip({ label, active, onPress }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function UndoBanner({ label, onUndo }) {
  const { theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.undoBanner}>
      <View style={styles.undoLeft}>
        <Ionicons name="checkmark-circle" size={18} color={theme.colors.green} />
        <Text style={styles.undoLabel} numberOfLines={2}>{label}</Text>
      </View>
      <Pressable style={styles.undoButton} onPress={onUndo} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('tasks.undo')}>
        <Text style={styles.undoButtonText}>{t('tasks.undo')}</Text>
      </Pressable>
    </View>
  );
}

export function TaskCard({ task, onComplete, onEdit, onDelete, onUndo, onPressTitle }) {
  const { theme, t, locale } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const meta = categoryMeta[task.category] || categoryMeta.Work;
  const priority = priorityMeta[task.priority] || priorityMeta.Medium;

  return (
    <View style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
      <View style={styles.taskBodyRow}>
        <View style={styles.taskContent}>
          {onPressTitle ? (
            <Pressable onPress={onPressTitle} hitSlop={6} accessibilityRole="button" accessibilityLabel={task.title}>
              <Text style={[styles.taskTitle, styles.taskTitleLink, task.completed && styles.taskTitleCompleted]} numberOfLines={1}>{task.title}</Text>
            </Pressable>
          ) : (
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]} numberOfLines={1}>{task.title}</Text>
          )}
          <View style={styles.taskTagsRow}>
            <Pill label={t(`category.${task.category}`)} backgroundColor={theme.colors[meta.bgKey]} color={theme.colors[meta.colorKey]} style={styles.tagPill} />
            <Text style={styles.taskReward}>+ {task.xp} {t('common.xp')}</Text>
          </View>
          <Text style={styles.taskMeta}>{formatTaskDay(task.dueAt, { locale, t })}  •  {formatShortTime(task.dueAt, locale)}</Text>
          <View style={styles.priorityRow}>
            <View style={[styles.priorityDot, { backgroundColor: theme.colors[priority.colorKey] }]} />
            <Text style={styles.priorityText}>{t(`priority.${task.priority}`)}</Text>
          </View>
        </View>
        <Pressable
          style={[styles.completeBtn, task.completed && styles.completeBtnActive]}
          onPress={task.completed ? undefined : onComplete}
          disabled={task.completed}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ disabled: task.completed }}
          accessibilityLabel={task.completed ? task.title : `${t('questDetail.complete')} ${task.title}`}
        >
          {task.completed ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : <View style={styles.completeOutline} />}
        </Pressable>
      </View>

      {(onEdit || onDelete || (task.completed && onUndo)) ? (
        <View style={styles.taskActionsRow}>
          <View style={styles.taskActionsLeft}>
            {onEdit ? (
              <Pressable style={styles.taskActionButton} onPress={onEdit} accessibilityRole="button" accessibilityLabel={`${t('tasks.edit')} ${task.title}`}>
                <Ionicons name="create-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.taskActionText}>{t('tasks.edit')}</Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable style={styles.taskActionButton} onPress={onDelete} accessibilityRole="button" accessibilityLabel={`${t('tasks.delete')} ${task.title}`}>
                <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
                <Text style={[styles.taskActionText, { color: theme.colors.danger }]}>{t('tasks.delete')}</Text>
              </Pressable>
            ) : null}
          </View>
          {task.completed && onUndo ? (
            <Pressable style={[styles.taskActionButton, styles.undoInlineButton]} onPress={onUndo} accessibilityRole="button" accessibilityLabel={`${t('tasks.undo')} ${task.title}`}>
              <Ionicons name="arrow-undo-outline" size={14} color={theme.colors.primaryDark} />
              <Text style={[styles.taskActionText, styles.undoInlineText]}>{t('tasks.undo')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function MenuRow({ icon, iconBg, label, value, onPress, noBorder }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable style={[styles.menuRow, noBorder && styles.menuRowNoBorder]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}> 
          <Ionicons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={theme.colors.inactive} />
      </View>
    </Pressable>
  );
}

export function AchievementCard({ item }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const locked = !item.unlocked;

  return (
    <View style={[styles.achievementCard, { backgroundColor: item.bg || theme.colors.yellowSoft }, locked && styles.achievementCardLocked]}>
      <Text style={[styles.achievementEmoji, locked && styles.achievementEmojiLocked]}>{item.emoji}</Text>
      <Text style={styles.achievementTitle}>{item.title}</Text>
      {item.reward ? <Text style={styles.achievementReward}>{item.reward}</Text> : null}
      {item.progress ? (
        <View style={styles.achievementProgressWrap}>
          <ProgressBar value={item.progress.current} max={item.progress.total} color={theme.colors.primary} height={4} trackStyle={{ backgroundColor: theme.colors.border }} />
          <Text style={styles.achievementProgressText}>{item.progress.current}/{item.progress.total}</Text>
        </View>
      ) : null}
    </View>
  );
}



export function StatBar({ icon, label, value, percent, color, helper }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.statBarCard}>
      <View style={styles.statBarHeader}>
        <View style={styles.statBarLabelWrap}>
          {icon ? <Ionicons name={icon} size={15} color={color || theme.colors.primary} /> : null}
          <Text style={styles.statBarLabel}>{label}</Text>
        </View>
        <Text style={styles.statBarValue}>{value}</Text>
      </View>
      <ProgressBar value={percent} max={100} color={color || theme.colors.primary} height={8} trackStyle={styles.statBarTrack} />
      {helper ? <Text style={styles.statBarHelper}>{helper}</Text> : null}
    </View>
  );
}

export function NotificationBadge({ count, style }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!count) return null;

  return (
    <View pointerEvents="none" style={[styles.notificationBadge, style]}>
      <Text style={styles.notificationBadgeText}>{count > 99 ? '99+' : String(count)}</Text>
    </View>
  );
}

export function CollapsibleFAQ({ item, expanded, onToggle }) {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.faqCard}>
      <Pressable style={styles.faqHeader} onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded }}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
      </Pressable>
      {expanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  headerWrap: {
    borderRadius: theme.radius.screenHeader,
    padding: 18,
    paddingBottom: 18,
    ...theme.shadow.header,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerCopy: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.74)',
    marginTop: 4,
    fontSize: 13,
  },
  progressTrack: {
    backgroundColor: theme.colors.track,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 14,
    minHeight: 104,
    ...theme.shadow.card,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  statSubLabel: {
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 8,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  undoBanner: {
    marginTop: 14,
    marginBottom: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadow.card,
  },
  undoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  undoLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.primarySoft,
    minHeight: 38,
    justifyContent: 'center',
  },
  undoButtonText: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
    fontSize: 11,
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    ...theme.shadow.card,
  },
  taskCardCompleted: {
    opacity: 0.85,
  },
  taskBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskContent: {
    flex: 1,
    paddingRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  taskTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  tagPill: {
    marginRight: 8,
    marginBottom: 6,
  },
  taskReward: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 6,
  },
  taskMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontSize: 11,
  },
  completeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  completeBtnActive: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
  completeOutline: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  taskActionsRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    marginRight: 8,
  },
  taskActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    marginLeft: 5,
  },
  undoInlineButton: {
    backgroundColor: theme.colors.primarySoft,
    marginRight: 0,
  },
  undoInlineText: {
    color: theme.colors.primaryDark,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sectionAction: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  menuRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  menuRowNoBorder: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginRight: 6,
    fontSize: 12,
  },
  achievementCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  achievementCardLocked: {
    opacity: 0.55,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementEmojiLocked: {
    opacity: 0.4,
  },
  achievementTitle: {
    marginTop: 12,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  achievementReward: {
    marginTop: 6,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  achievementProgressWrap: {
    marginTop: 14,
  },
  achievementProgressText: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  statBarCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    ...theme.shadow.card,
  },
  statBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBarLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statBarLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  statBarValue: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
  },
  statBarTrack: {
    backgroundColor: theme.colors.track,
  },
  statBarHelper: {
    color: theme.colors.textSoft,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  notificationBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  faqCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    ...theme.shadow.card,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    paddingRight: 12,
  },
  faqAnswer: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
});
