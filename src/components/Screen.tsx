import React from 'react';
import {SafeAreaView, StyleSheet, View, useColorScheme} from 'react-native';
import {themeTokens} from '../theme';

export function Screen(props: {children: React.ReactNode}) {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <SafeAreaView style={[styles.root, {backgroundColor: palette.background}]}>
      <View style={styles.inner}>{props.children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
});
