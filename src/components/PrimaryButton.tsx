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
  const backgroundColor =
    variant === 'primary' ? palette.accent : variant === 'secondary' ? palette.accentSoft : palette.danger;
  return (
    <Pressable onPress={props.onPress} style={[styles.base, {backgroundColor}, props.style]}>
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
  text: {
    fontSize: themeTokens.typography.body,
    fontWeight: '700',
  },
});
