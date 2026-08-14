import React from 'react';
import {Pressable, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {themeTokens} from '../theme';
import type {AppProtection} from '../types/domain';

export function AppCard(props: {app: AppProtection; onPress?: () => void}) {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const modeColor =
    props.app.mode === 'NONE'
      ? palette.textSecondary
      : props.app.mode === 'LOCK'
        ? palette.success
        : props.app.mode === 'HIDE'
          ? palette.accent
          : palette.danger;

  return (
    <Pressable
      onPress={props.onPress}
      style={[styles.card, {backgroundColor: palette.surface, borderColor: palette.border}]}>
      <View style={[styles.icon, {backgroundColor: palette.accentSoft}]}>
        <Text style={[styles.iconLabel, {color: palette.accent}]}>{props.app.label.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>{props.app.label}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.pill, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
            <Text style={[styles.pillText, {color: modeColor}]}>{props.app.mode}</Text>
          </View>
          <View style={[styles.pill, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
            <Text style={[styles.pillText, {color: palette.textSecondary}]}>{props.app.authMethod}</Text>
          </View>
        </View>
        <Text style={[styles.meta, {color: palette.textSecondary}]}>Auto-lock {props.app.autoLockSeconds}s</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeTokens.spacing.md,
    padding: themeTokens.spacing.md,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    gap: themeTokens.spacing.xs,
  },
  title: {
    fontSize: themeTokens.typography.body,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.xs,
  },
  pill: {
    borderRadius: themeTokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: themeTokens.typography.caption,
    fontWeight: '700',
  },
  meta: {
    fontSize: themeTokens.typography.caption,
  },
});
