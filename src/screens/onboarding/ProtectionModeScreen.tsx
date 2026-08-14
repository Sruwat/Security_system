import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaCard, FigmaHeader, FigmaPage, FigmaRowCard, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

export function ProtectionModeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <FigmaHeader variant="dark" title="Protection mode" subtitle="Instagram" />

        <View style={styles.cards}>
          <FigmaRowCard variant="dark" title="○ None" subtitle="Open normally" onPress={() => undefined} />
          <FigmaRowCard variant="dark" title="○ Lock" subtitle="Authenticate to open" onPress={() => undefined} />
          <FigmaRowCard variant="dark" title="○ Hide" subtitle="Remove from launcher" onPress={() => undefined} />
          <FigmaRowCard
            variant="dark"
            title="● Lock + Hide"
            subtitle="Hide + authenticate"
            selected
            tone="accentSoft"
            onPress={() => undefined}
          />
        </View>

        <View style={styles.infoStack}>
          <FigmaRowCard variant="dark" title="Auto-lock" subtitle="30 seconds" onPress={() => navigation.navigate('Settings')} />
          <FigmaRowCard variant="dark" title="Authentication" subtitle="Fingerprint + PIN" onPress={() => navigation.navigate('AuthGate')} />
        </View>

        <View style={[styles.notice, {backgroundColor: palette.accentSoft}]}>
          <Text style={[styles.noticeText, {color: palette.accent}]}>Lock + hide keeps the app out of the launcher.</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Save protection" onPress={() => navigation.navigate('SecretEntry')} />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  cards: {
    gap: 14,
  },
  infoStack: {
    marginTop: 34,
    gap: 12,
  },
  notice: {
    marginTop: 38,
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A78BFA',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  noticeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  spacer: {
    flex: 1,
  },
});
