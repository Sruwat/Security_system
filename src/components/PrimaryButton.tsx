import React from 'react';
import {Pressable, StyleSheet, Text, ViewStyle, useColorScheme} from 'react-native';
import {themeTokens} from '../theme';

export function PrimaryButton(props: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}) {
  const variant = props.variant ?? 'primary';
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable onPress={props.onPress} style={[styles.base, styles[variant], props.style]}>
      <Text style={[styles.text, {color: variant === 'secondary' ? palette.accent : '#FFFFFF'}]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: themeTokens.colors.light.accent,
  },
  secondary: {
    backgroundColor: themeTokens.colors.light.accentSoft,
  },
  danger: {
    backgroundColor: themeTokens.colors.light.danger,
  },
  text: {
    fontSize: themeTokens.typography.body,
    fontWeight: '700',
  },
});
