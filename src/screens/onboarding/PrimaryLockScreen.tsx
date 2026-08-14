import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaHeader, FigmaPage, FigmaRowCard, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

export function PrimaryLockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <FigmaHeader variant="dark" title="Primary lock" subtitle="Create once; reuse for protected access." />

        <View style={styles.cards}>
          <FigmaRowCard variant="dark" title="PIN" subtitle="4–6 digits" onPress={() => undefined} />
          <FigmaRowCard variant="dark" title="Password" subtitle="Text credential" onPress={() => undefined} />
          <FigmaRowCard variant="dark" title="Pattern" subtitle="Android-style pattern" onPress={() => undefined} />
          <FigmaRowCard variant="dark" title="Biometric" subtitle="Optional after fallback" onPress={() => undefined} />
        </View>

        <View style={[styles.noteCard, {backgroundColor: palette.accentSoft}]}>
          <Text style={[styles.noteTitle, {color: palette.accent}]}>Secure verification stays native.</Text>
          <Text style={[styles.noteBody, {color: palette.textSecondary}]}>Never store plaintext PIN in AsyncStorage.</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Create primary lock" onPress={() => navigation.navigate('AddApps')} />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  cards: {
    gap: 12,
  },
  noteCard: {
    marginTop: 38,
    borderRadius: 20,
    minHeight: 84,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  noteTitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  noteBody: {
    marginTop: 18,
    fontSize: 8,
    lineHeight: 10,
  },
  spacer: {
    flex: 1,
  },
});
