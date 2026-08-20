import React from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BlueChoiceCard, BlueFlowPage, BluePanel, BluePrimaryButton, BlueProgressHeader, BlueSectionTitle, blueFlowPalette} from '../../components/BlueFlow';
import {nativeBridge} from '../../native';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {FeatureFlow, LauncherState} from '../../types/domain';

export function LauncherSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'LauncherSetup'>>();
  const [launcherState, setLauncherState] = React.useState<LauncherState>({isDefaultLauncher: false, activeDisguise: 'default'});
  const [featureFlow, setFeatureFlow] = React.useState<FeatureFlow>('APP_HIDE');

  const refreshLauncherState = React.useCallback(async () => {
    setLauncherState(await nativeBridge.getLauncherState());
  }, []);

  React.useEffect(() => {
    void (async () => {
      const settings = await localDataRepository.getSettings();
      const activeFlow = route.params?.flow ?? settings.onboardingFeatureFlow ?? 'APP_HIDE';
      setFeatureFlow(activeFlow);
      await localDataRepository.saveSettings({
        ...settings,
        onboardingResumeRoute: 'LauncherSetup',
        onboardingFeatureFlow: activeFlow,
      });
      await refreshLauncherState();
    })();
  }, [refreshLauncherState, route.params?.flow]);

  return (
    <BlueFlowPage contentContainerStyle={styles.scrollContent}>
      <BlueProgressHeader stepLabel={featureFlow === 'APP_HIDE' ? 'Step 1 of 4' : 'Launcher Setup'} progress={0.25} onBackPress={() => navigation.goBack()} />
      <BlueSectionTitle
        title="Permissions"
        subtitle="Turn on launcher access, then continue to home."
      />

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
        <BluePanel tone="soft" style={styles.noteCard}>
          <Text style={styles.noteTitle}>Home first</Text>
          <Text style={styles.noteBody}>
            After this step, VaultX opens directly into your app launcher. Hide, lock, and other setup flows start only when you choose them.
          </Text>
        </BluePanel>

        <View style={styles.spacer} />

        <BluePrimaryButton
          label="Open Launcher"
          onPress={() => {
            void (async () => {
              const settings = await localDataRepository.getSettings();
              await localDataRepository.saveSettings({
                ...settings,
                onboardingComplete: true,
                onboardingResumeRoute: undefined,
                onboardingFeatureFlow: undefined,
              });
              navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
            })();
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
