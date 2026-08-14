import React from 'react';
import {SafeAreaView, StyleSheet, View, useColorScheme} from 'react-native';
import {themeTokens} from '../theme';

export function Screen(props: {children: React.ReactNode}) {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <SafeAreaView style={[styles.root, {backgroundColor: palette.background}]}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={[styles.orbTop, {backgroundColor: palette.accentSoft}]} />
        <View style={[styles.orbBottom, {backgroundColor: palette.surfaceElevated}]} />
      </View>
      <View style={styles.inner}>{props.children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 260,
    opacity: 0.55,
  },
  orbBottom: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
    opacity: 0.45,
  },
  inner: {
    flex: 1,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
});
