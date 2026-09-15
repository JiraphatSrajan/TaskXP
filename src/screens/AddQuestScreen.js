import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ModalPicker from '../components/ModalPicker';
import Screen from '../components/Screen';
import { GradientHeader } from '../components/UI';
import { CATEGORY_KEYS, categoryMeta, PRIORITY_KEYS, REPEAT_KEYS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { formatNumericTime, formatSlashDate, toDate } from '../utils/formatters';

const MIN_XP = 5;
const MAX_XP = 100;

export default function AddQuestScreen({ navigation, route }) {
  const { state, addTask, updateTask, theme, t } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const taskId = route?.params?.taskId || null;
  const existingTask = useMemo(() => state.tasks.find((task) => task.id === taskId) || null, [state.tasks, taskId]);
  const isEditing = Boolean(existingTask);
  const prefillDate = useMemo(() => toDate(route?.params?.prefillDate, new Date()), [route?.params?.prefillDate]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [xp, setXp] = useState(25);
  const [repeat, setRepeat] = useState('None');
  const [priority, setPriority] = useState('Medium');
  const [date, setDate] = useState(() => new Date());
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!existingTask) {
      setTitle('');
      setDescription('');
      setCategory('Work');
      setXp(25);
      setRepeat('None');
      setPriority('Medium');
      setDate(prefillDate || new Date());
      setError('');
      return;
    }

    setTitle(existingTask.title || '');
    setDescription(existingTask.description || '');
    setCategory(existingTask.category || 'Work');
    setXp(Number(existingTask.xp) || 25);
    setRepeat(existingTask.repeat || 'None');
    setPriority(existingTask.priority || 'Medium');
    setDate(toDate(existingTask.originalDueAt || existingTask.dueAt, new Date()));
    setError('');
  }, [existingTask, prefillDate]);

  const categoryInfo = categoryMeta[category] || categoryMeta.Work;
  const dueDateText = useMemo(() => formatSlashDate(date), [date]);
  const dueTimeText = useMemo(() => formatNumericTime(date), [date]);

  const onSave = () => {
    if (isSubmitting) return;

    if (!title.trim()) {
      setError(t('errors.questTitleRequired'));
      return;
    }

    if (Number.isNaN(date.getTime())) {
      setError(t('errors.validDueDate'));
      return;
    }

    setIsSubmitting(true);
    try {
      setError('');
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        xp,
        repeat,
        priority,
        dueAt: date.toISOString(),
      };

      if (isEditing && existingTask) {
        updateTask(existingTask.id, payload);
      } else {
        addTask(payload);
      }

      navigation.goBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = CATEGORY_KEYS.map((item) => ({ value: item, label: t(`category.${item}`) }));

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GradientHeader withBack onBack={() => navigation.goBack()} title={isEditing ? t('addQuest.editTitle') : t('addQuest.title')} />

          <Text style={styles.label}>{t('addQuest.questTitle')}</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder={t('addQuest.questTitlePlaceholder')} placeholderTextColor={theme.colors.textSoft} />

          <Text style={styles.label}>{t('addQuest.description')}</Text>
          <TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.textArea]} multiline placeholder={t('addQuest.descriptionPlaceholder')} placeholderTextColor={theme.colors.textSoft} />

          <Text style={styles.label}>{t('addQuest.category')}</Text>
          <Pressable style={styles.inputRow} onPress={() => setPickerVisible(true)}>
            <View style={styles.categoryLeft}>
              <Ionicons name={categoryInfo.icon} size={16} color={theme.colors.textMuted} />
              <Text style={styles.inputRowText}>{t(`category.${category}`)}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
          </Pressable>

          <Text style={styles.label}>{t('addQuest.xpReward', { xp })}</Text>
          <Slider
            minimumValue={MIN_XP}
            maximumValue={MAX_XP}
            step={5}
            value={xp}
            onValueChange={(value) => setXp(Math.round(value))}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.track}
            thumbTintColor={theme.colors.yellow}
            style={styles.slider}
          />
          <View style={styles.sliderRangeLabels}>
            <Text style={styles.rangeLabel}>{t('addQuest.rangeMin')}</Text>
            <Text style={styles.rangeLabel}>{t('addQuest.rangeMax')}</Text>
          </View>

          <Text style={styles.label}>{t('addQuest.repeat')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {REPEAT_KEYS.map((option) => (
              <Pressable key={option} style={[styles.choiceChip, repeat === option && styles.choiceChipActive]} onPress={() => setRepeat(option)}>
                <Text style={[styles.choiceText, repeat === option && styles.choiceTextActive]}>{t(`repeat.${option}`)}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>{t('addQuest.dueDateTime')}</Text>
          <View style={styles.dateRow}>
            <Pressable style={[styles.inputRow, styles.halfInput]} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.inputRowText}>{dueDateText}</Text>
            </Pressable>
            <Pressable style={[styles.inputRow, styles.halfInput]} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.inputRowText}>{dueTimeText}</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>{t('addQuest.priority')}</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_KEYS.map((option) => {
              const active = priority === option;
              return (
                <Pressable key={option} style={[styles.priorityChip, active && styles.priorityChipActive]} onPress={() => setPriority(option)}>
                  <Text style={[styles.priorityText, active && styles.priorityTextActive]}>{t(`priority.${option}`)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} onPress={onSave} disabled={isSubmitting}>
            <LinearGradient colors={[theme.colors.headerStart, theme.colors.headerEnd]} style={styles.saveButtonInner}>
              <Text style={styles.saveButtonText}>{isSubmitting ? t('addQuest.saving') : (isEditing ? t('addQuest.saveChanges') : t('addQuest.saveQuest'))}</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const next = new Date(date);
              next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              setDate(next);
            }
          }}
        />
      ) : null}

      {showTimePicker ? (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (selectedDate) {
              const next = new Date(date);
              next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
              setDate(next);
            }
          }}
        />
      ) : null}

      <ModalPicker visible={pickerVisible} title={t('addQuest.selectCategory')} options={categoryOptions} selectedValue={category} onClose={() => setPickerVisible(false)} onSelect={setCategory} />
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 28 },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.text, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 13, color: theme.colors.text },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  inputRow: { backgroundColor: theme.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  inputRowText: { color: theme.colors.text, fontSize: 13, marginLeft: 8, flex: 1 },
  slider: { width: '100%', height: 40, marginTop: 2 },
  sliderRangeLabels: { marginTop: 2, flexDirection: 'row', justifyContent: 'space-between' },
  rangeLabel: { color: theme.colors.textSoft, fontSize: 10, fontWeight: '600' },
  choiceChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginRight: 8 },
  choiceChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  choiceText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 11 },
  choiceTextActive: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48.5%' },
  priorityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  priorityChip: { width: '31.6%', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  priorityChipActive: { backgroundColor: theme.colors.yellowSoft, borderColor: theme.colors.yellow },
  priorityText: { color: theme.colors.textMuted, fontWeight: '700', fontSize: 12 },
  priorityTextActive: { color: theme.colors.text },
  errorText: { color: theme.colors.danger, fontSize: 12, fontWeight: '700', marginTop: 8 },
  saveButton: { marginTop: 22, borderRadius: 16, overflow: 'hidden' },
  saveButtonInner: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
