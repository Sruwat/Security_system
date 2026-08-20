import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BlueChoiceCard, BlueFlowPage, BlueHero, BluePrimaryButton, BlueProgressHeader} from '../../components/BlueFlow';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

export function PrimaryLockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedRoute, setSelectedRoute] = React.useState<'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup'>('PinSetup');

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('PrimaryLock');
  }, []);

  const goTo = React.useCallback(
    (route: 'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup') => {
      void localDataRepository.setOnboardingResumeRoute(route);
      navigation.navigate(route);
    },
    [navigation],
  );

  return (
    <BlueFlowPage contentContainerStyle={styles.scrollContent}>
      <BlueProgressHeader stepLabel="Step 2 of 4" progress={0.5} onBackPress={() => navigation.goBack()} />
      <BlueHero icon="🔒" title="App Lock" subtitle="Choose one lock type. This becomes the main security method for protected apps." />

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
