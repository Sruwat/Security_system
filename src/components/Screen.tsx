import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, View, useColorScheme} from 'react-native';
import {themeTokens} from '../theme';

export function Screen(props: {children: React.ReactNode}) {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <SafeAreaView style={[styles.root, {backgroundColor: palette.background}]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={palette.background} />
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
    paddingHorizontal: 17,
    paddingTop: 13,
    paddingBottom: 17,
  },
});
