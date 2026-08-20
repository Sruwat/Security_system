import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BlueFlowPage, BlueHero, BluePanel, BluePrimaryButton, blueFlowPalette} from '../../components/BlueFlow';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {FeatureFlow} from '../../types/domain';

function FeatureChip(props: {label: string; accent: string}) {
  return (
    <View style={[styles.featureChip, {borderColor: `${props.accent}44`, backgroundColor: `${props.accent}14`}]}>
      <Text style={[styles.featureChipText, {color: props.accent}]}>{props.label}</Text>
    </View>
  );
}

const featureOptions: Array<{
  label: string;
  accent: string;
  flow: FeatureFlow;
  helper: string;
}> = [
  {label: 'Hide Apps', accent: '#7CC2FF', flow: 'APP_HIDE', helper: 'Disguise and move selected apps into Hidden Apps.'},
  {label: 'Smart Hide', accent: '#93C5FD', flow: 'SMART_HIDE', helper: 'Choose the secret trigger that opens Hidden Apps.'},
  {label: 'App Lock', accent: '#B7CCFF', flow: 'APP_LOCK', helper: 'Pick PIN, password, pattern, or biometric-backed lock.'},
  {label: 'Lock + Hide', accent: '#60A5FA', flow: 'LOCK_HIDE', helper: 'Finish Smart Hide first, then add the app lock layer.'},
];

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedFlow, setSelectedFlow] = React.useState<FeatureFlow>('APP_HIDE');

  const continueFlow = React.useCallback(async () => {
    const nextRoute =
      selectedFlow === 'SMART_HIDE'
        ? 'SecretEntry'
        : selectedFlow === 'APP_LOCK'
          ? 'PrimaryLock'
          : selectedFlow === 'LOCK_HIDE'
            ? 'SecretEntry'
            : 'LauncherSetup';

    await localDataRepository.saveSettings({
      ...(await localDataRepository.getSettings()),
      onboardingComplete: false,
      onboardingResumeRoute: nextRoute,
      onboardingFeatureFlow: selectedFlow,
    });

    if (nextRoute === 'LauncherSetup') {
      navigation.navigate('LauncherSetup', {flow: selectedFlow});
      return;
    }
    if (nextRoute === 'PrimaryLock') {
      navigation.navigate('PrimaryLock', {flow: selectedFlow});
      return;
    }
    navigation.navigate('SecretEntry', {flow: selectedFlow});
  }, [navigation, selectedFlow]);

  return (
    <BlueFlowPage contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroWrap}>
        <BlueHero icon="🔐" title="VaultX" subtitle="Hide, lock, and open your private apps." />
        <Text style={styles.tagline}>PRIVATE. SIMPLE.</Text>
        <View style={styles.featureWrap}>
          <FeatureChip label="Hide Apps" accent="#7CC2FF" />
          <FeatureChip label="Smart Hide" accent="#93C5FD" />
          <FeatureChip label="App Lock" accent="#B7CCFF" />
          <FeatureChip label="Lock + Hide" accent="#60A5FA" />
        </View>
      </View>

      <BluePanel tone="soft" style={styles.notePanel}>
        <Text style={styles.noteTitle}>Choose a start</Text>
        <Text style={styles.noteCopy}>You can change everything later from the app.</Text>
      </BluePanel>

      <View style={styles.optionList}>
        {featureOptions.map(option => {
          const selected = selectedFlow === option.flow;
          return (
            <Pressable
              key={option.flow}
              onPress={() => setSelectedFlow(option.flow)}
              style={[
                styles.optionCard,
                {
                  borderColor: selected ? option.accent : '#1F3352',
                  backgroundColor: selected ? `${option.accent}18` : '#0E1A31',
                },
              ]}>
              <Text style={[styles.optionTitle, {color: selected ? option.accent : blueFlowPalette.textPrimary}]}>{option.label}</Text>
              <Text style={styles.optionCopy}>{option.helper}</Text>
            </Pressable>
          );
        })}
      </View>

      <BluePrimaryButton
        label="Let's Go"
        onPress={() => {
          void continueFlow();
        }}
      />

      <Pressable
        onPress={() => {
          setSelectedFlow('APP_HIDE');
          void continueFlow();
        }}
        style={styles.skipWrap}>
        <Text style={styles.skipText}>Skip intro</Text>
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
  optionList: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  optionCopy: {
    marginTop: 6,
    color: blueFlowPalette.textSecondary,
    fontSize: 12,
    lineHeight: 17,
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
