import React from 'react';
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import {Screen} from '../components/Screen';
import {PrimaryButton} from '../components/PrimaryButton';
import {themeTokens} from '../theme';

export function PlaceholderScreen(props: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>{props.description}</Text>
      </View>
      {props.actionLabel ? (
        <PrimaryButton label={props.actionLabel} onPress={props.onAction ?? (() => undefined)} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: themeTokens.spacing.md,
  },
  title: {
    fontSize: themeTokens.typography.title,
    fontWeight: '800',
  },
  description: {
    fontSize: themeTokens.typography.body,
    lineHeight: 24,
  },
});
