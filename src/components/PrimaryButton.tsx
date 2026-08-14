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
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.base,
        {
          backgroundColor:
            variant === 'primary' ? palette.accent : variant === 'secondary' ? palette.accentSoft : palette.danger,
          borderColor: variant === 'secondary' ? palette.border : 'transparent',
          opacity: pressed ? 0.88 : 1,
          transform: [{scale: pressed ? 0.985 : 1}],
        },
        props.style,
      ]}>
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
    borderWidth: 1,
  },
  text: {
    fontSize: themeTokens.typography.body,
    fontWeight: '700',
  },
});
