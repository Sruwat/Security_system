import React from 'react';
import {Pressable, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {themeTokens} from '../theme';
import type {AppProtection} from '../types/domain';

export function AppCard(props: {app: AppProtection; onPress?: () => void}) {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      onPress={props.onPress}
      style={[styles.card, {backgroundColor: palette.surface, borderColor: palette.border}]}>
      <View style={[styles.icon, {backgroundColor: palette.accentSoft}]} />
      <View style={styles.body}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>{props.app.label}</Text>
        <Text style={[styles.meta, {color: palette.textSecondary}]}>
          {props.app.mode} · {props.app.authMethod}
        </Text>
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
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: themeTokens.typography.body,
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    fontSize: themeTokens.typography.caption,
  },
});
