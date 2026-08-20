import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BlueChoiceCard, BlueFlowPage, BluePanel, BluePrimaryButton, BlueProgressHeader, BlueSectionTitle, blueFlowPalette} from '../../components/BlueFlow';
import {nativeBridge} from '../../native';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {LauncherState} from '../../types/domain';

export function LauncherSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [launcherState, setLauncherState] = React.useState<LauncherState>({isDefaultLauncher: false, activeDisguise: 'default'});

  const refreshLauncherState = React.useCallback(async () => {
    setLauncherState(await nativeBridge.getLauncherState());
  }, []);

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('LauncherSetup');
    void refreshLauncherState();
  }, [refreshLauncherState]);

  return (
    <BlueFlowPage contentContainerStyle={styles.scrollContent}>
      <BlueProgressHeader stepLabel="Step 1 of 4" progress={0.25} onBackPress={() => navigation.goBack()} />
      <BlueSectionTitle title="Required Permissions" subtitle="Give Hide and Lock the Android access they need before you start protecting apps." />

      <ScrollView contentContainerStyle={styles.rows} showsVerticalScrollIndicator={false}>
        <BlueChoiceCard
          title="Default Launcher"
          subtitle={launcherState.isDefaultLauncher ? 'Enabled on this device' : 'Set Smart App Lock as your Home launcher'}
          rightLabel={launcherState.isDefaultLauncher ? 'Ready' : 'Open'}
          selected={launcherState.isDefaultLauncher}
          icon="🏠"
          onPress={() => {
            void nativeBridge.requestLauncherSelection()
              .then(refreshLauncherState)
              .catch(error => {
                Alert.alert('Launcher setup failed', error instanceof Error ? error.message : 'Unable to open launcher settings.');
              });
          }}
        />
        <BlueChoiceCard
          title="App Discovery"
          subtitle="Refresh installed apps and confirm package access is working."
          rightLabel="Refresh"
          icon="📱"
          onPress={() => {
            void refreshLauncherState();
          }}
        />
        {launcherState.isDefaultLauncher ? (
          <BlueChoiceCard
            title="Use Phone Launcher"
            subtitle="Open Android Home settings and switch back to your OEM launcher at any time."
            rightLabel="Open"
            icon="↔️"
            onPress={() => {
              void nativeBridge.openSystemSetting('home').catch(error => {
                Alert.alert('Home settings unavailable', error instanceof Error ? error.message : 'Unable to open Home settings.');
              });
            }}
          />
        ) : null}

        <BluePanel tone="soft" style={styles.noteCard}>
          <Text style={styles.noteTitle}>Managed launcher model</Text>
          <Text style={styles.noteBody}>
            Hidden apps stay private inside this launcher. Your OEM launcher always remains accessible through Home settings, because standard Android does not let third-party apps remove apps from every launcher.
          </Text>
        </BluePanel>

        <View style={styles.spacer} />

        <BluePrimaryButton
          label="Continue"
          onPress={() => {
            void localDataRepository.setOnboardingResumeRoute('PrimaryLock');
            navigation.navigate('PrimaryLock');
          }}
        />
      </ScrollView>
    </BlueFlowPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  rows: {
    gap: 14,
    flexGrow: 1,
  },
  noteCard: {
    marginTop: 2,
  },
  noteTitle: {
    color: blueFlowPalette.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  noteBody: {
    marginTop: 8,
    color: blueFlowPalette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
