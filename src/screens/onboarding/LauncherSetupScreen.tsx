import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaHeader, FigmaPage, FigmaRowCard, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

export function LauncherSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;

  return (
    <FigmaPage variant="light">
      <View style={styles.fill}>
        <FigmaHeader variant="light" title="Launcher setup" subtitle="One-time Android setup." />

        <View style={styles.cards}>
          <FigmaRowCard variant="light" title="Default launcher" subtitle="Set this app as Home launcher" onPress={() => undefined} />
          <FigmaRowCard variant="light" title="App discovery" subtitle="Allow permitted app discovery" onPress={() => undefined} />
        </View>

        <View style={styles.noteCard}>
          <Text style={[styles.noteTitle, {color: palette.accent}]}>Hide works inside this Smart Launcher.</Text>
          <Text style={[styles.noteBody, {color: palette.textSecondary}]}>No Android-wide hiding claim.</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="light" label="Continue" onPress={() => navigation.navigate('PrimaryLock')} />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  cards: {
    gap: 16,
  },
  noteCard: {
    marginTop: 38,
    borderRadius: 22,
    minHeight: 106,
    paddingHorizontal: 18,
    paddingTop: 20,
    backgroundColor: '#F1EEFF',
  },
  noteTitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  noteBody: {
    marginTop: 20,
    fontSize: 9,
    lineHeight: 11,
  },
  spacer: {
    flex: 1,
  },
});
