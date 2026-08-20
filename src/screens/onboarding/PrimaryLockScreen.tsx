import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BlueChoiceCard, BlueFlowPage, BlueHero, BluePrimaryButton, BlueProgressHeader} from '../../components/BlueFlow';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {FeatureFlow} from '../../types/domain';

export function PrimaryLockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PrimaryLock'>>();
  const [selectedRoute, setSelectedRoute] = React.useState<'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup'>('PinSetup');
  const [featureFlow, setFeatureFlow] = React.useState<FeatureFlow>('APP_LOCK');

  React.useEffect(() => {
    void (async () => {
      const settings = await localDataRepository.getSettings();
      const activeFlow = route.params?.flow ?? settings.onboardingFeatureFlow ?? 'APP_LOCK';
      setFeatureFlow(activeFlow);
      await localDataRepository.saveSettings({...settings, onboardingResumeRoute: 'PrimaryLock', onboardingFeatureFlow: activeFlow});
    })();
  }, [route.params?.flow]);

  const goTo = React.useCallback(
    (route: 'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup') => {
      void (async () => {
        const settings = await localDataRepository.getSettings();
        await localDataRepository.saveSettings({...settings, onboardingResumeRoute: route, onboardingFeatureFlow: featureFlow});
        navigation.navigate(route, {flow: featureFlow});
      })();
    },
    [featureFlow, navigation],
  );

  const stepLabel = featureFlow === 'LOCK_HIDE' ? 'Step 2 of 4' : 'Step 1 of 3';
  const progress = featureFlow === 'LOCK_HIDE' ? 0.5 : 0.33;
  const title = featureFlow === 'LOCK_HIDE' ? 'Lock + Hide' : 'App Lock';
  const subtitle =
    featureFlow === 'LOCK_HIDE'
      ? 'Step 2: choose the lock type that completes the combined flow.'
      : 'Choose one lock type. This becomes the main security method for protected apps.';

  return (
    <BlueFlowPage contentContainerStyle={styles.scrollContent}>
      <BlueProgressHeader stepLabel={stepLabel} progress={progress} onBackPress={() => navigation.goBack()} />
      <BlueHero icon="🔒" title={title} subtitle={subtitle} />

      <View style={styles.grid}>
        <BlueChoiceCard
          title="PIN"
          subtitle="Fast and simple 4 to 6 digit access"
          icon="🔢"
          selected={selectedRoute === 'PinSetup'}
          onPress={() => setSelectedRoute('PinSetup')}
        />
        <BlueChoiceCard
          title="Password"
          subtitle="Letters and numbers for stronger manual access"
          icon="🔑"
          selected={selectedRoute === 'PasswordSetup'}
          onPress={() => setSelectedRoute('PasswordSetup')}
        />
        <BlueChoiceCard
          title="Pattern"
          subtitle="Use an Android-style pattern path"
          icon="✳️"
          selected={selectedRoute === 'PatternSetup'}
          onPress={() => setSelectedRoute('PatternSetup')}
        />
        <BlueChoiceCard
          title="Biometric"
          subtitle="Use fingerprint or face with secure fallback"
          icon="🫆"
          selected={selectedRoute === 'BiometricSetup'}
          onPress={() => setSelectedRoute('BiometricSetup')}
        />
      </View>

      <View style={styles.spacer} />

      <BluePrimaryButton label="Continue" onPress={() => goTo(selectedRoute)} />
    </BlueFlowPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  grid: {
    gap: 14,
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
});
