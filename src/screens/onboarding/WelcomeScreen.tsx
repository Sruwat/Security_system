import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BlueFlowPage, BlueHero, BluePanel, BluePrimaryButton, blueFlowPalette} from '../../components/BlueFlow';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

function FeatureChip(props: {label: string; accent: string}) {
  return (
    <View style={[styles.featureChip, {borderColor: `${props.accent}44`, backgroundColor: `${props.accent}14`}]}>
      <Text style={[styles.featureChipText, {color: props.accent}]}>{props.label}</Text>
    </View>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <BlueFlowPage contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroWrap}>
        <BlueHero icon="🔐" title="VaultX" subtitle="Hide apps, lock apps, and manage everything from one clean private launcher." />
        <Text style={styles.tagline}>PRIVATE. SECURE. SIMPLE.</Text>
        <View style={styles.featureWrap}>
          <FeatureChip label="Hide Apps" accent="#7CC2FF" />
          <FeatureChip label="Smart Hide" accent="#93C5FD" />
          <FeatureChip label="App Lock" accent="#B7CCFF" />
          <FeatureChip label="Lock + Hide" accent="#60A5FA" />
        </View>
      </View>

      <BluePanel tone="soft" style={styles.notePanel}>
        <Text style={styles.noteTitle}>Built for a simple private flow</Text>
        <Text style={styles.noteCopy}>
          Welcome → Permissions → Security Setup → Secret Trigger → Dashboard
        </Text>
      </BluePanel>

      <BluePrimaryButton
        label="Let's Go"
        onPress={() => {
          void localDataRepository.setOnboardingResumeRoute('LauncherSetup');
          navigation.navigate('LauncherSetup');
        }}
      />

      <Text style={styles.footerText}>By continuing you agree to our Privacy Policy</Text>
    </BlueFlowPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 26,
  },
  tagline: {
    marginTop: 2,
    color: '#9FB4D2',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  featureWrap: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  featureChip: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureChipText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  notePanel: {
    gap: 8,
  },
  noteTitle: {
    color: blueFlowPalette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  noteCopy: {
    color: blueFlowPalette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  footerText: {
    color: blueFlowPalette.textMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
});
