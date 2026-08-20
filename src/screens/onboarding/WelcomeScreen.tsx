import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BlueFlowPage, BlueHero, BluePanel, BluePrimaryButton, blueFlowPalette} from '../../components/BlueFlow';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const continueFlow = React.useCallback(async () => {
    await localDataRepository.saveSettings({
      ...(await localDataRepository.getSettings()),
      onboardingComplete: false,
      onboardingResumeRoute: 'LauncherSetup',
      onboardingFeatureFlow: 'APP_HIDE',
    });
    navigation.navigate('LauncherSetup', {flow: 'APP_HIDE'});
  }, [navigation]);

  return (
    <BlueFlowPage contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroWrap}>
        <BlueHero icon="🔐" title="VaultX" subtitle="Private launcher for your apps." />
        <Text style={styles.tagline}>PRIVATE. SIMPLE.</Text>
      </View>

      <BluePanel tone="soft" style={styles.notePanel}>
        <Text style={styles.noteTitle}>Welcome</Text>
        <Text style={styles.noteCopy}>Allow the required permissions, then jump straight into your launcher.</Text>
      </BluePanel>

      <View style={styles.steps}>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>01</Text>
          <Text style={styles.stepTitle}>Welcome</Text>
        </View>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>02</Text>
          <Text style={styles.stepTitle}>Permissions</Text>
        </View>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>03</Text>
          <Text style={styles.stepTitle}>Launcher</Text>
        </View>
      </View>

      <BluePrimaryButton
        label="Continue"
        onPress={() => {
          void continueFlow();
        }}
      />

      <Pressable
        onPress={() => {
          void continueFlow();
        }}
        style={styles.skipWrap}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <Text style={styles.footerText}>Your setup stays local on this device.</Text>
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
  steps: {
    flexDirection: 'row',
    gap: 12,
  },
  stepCard: {
    flex: 1,
    minHeight: 94,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1F3352',
    backgroundColor: '#0E1A31',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  stepNumber: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  stepTitle: {
    color: blueFlowPalette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  footerText: {
    color: blueFlowPalette.textMuted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  skipWrap: {
    alignItems: 'center',
  },
  skipText: {
    color: '#9FB4D2',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
