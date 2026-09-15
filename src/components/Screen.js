import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const TAB_BAR_PADDING = 96;
const DEFAULT_BOTTOM_PADDING = 24;

export default function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  withTabBarPadding = false,
  keyboardAware = false,
  edges = ['top', 'left', 'right'],
}) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomPadding = (withTabBarPadding ? TAB_BAR_PADDING : DEFAULT_BOTTOM_PADDING) + insets.bottom;

  const contentStyles = [styles.content, { paddingBottom: bottomPadding }, contentContainerStyle];
  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  const body = scroll ? (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={contentStyles}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, styles.content, { paddingBottom: bottomPadding }, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {keyboardAware ? (
        <KeyboardAvoidingView style={styles.flex} behavior={keyboardBehavior}>
          {body}
        </KeyboardAvoidingView>
      ) : body}
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
});
