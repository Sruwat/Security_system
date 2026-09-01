import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {FeatureFlow} from '../../types/domain';

type CredentialRoute = 'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup';

const lockOptions: Array<{route: CredentialRoute; title: string; subtitle: string; marker: string}> = [
  {route: 'PasswordSetup', title: 'Password', subtitle: 'Letters and numbers', marker: 'A'},
  {route: 'PinSetup', title: 'PIN', subtitle: '4-6 digits', marker: '1'},
  {route: 'PatternSetup', title: 'Pattern', subtitle: 'Draw to unlock', marker: 'O'},
  {route: 'BiometricSetup', title: 'Biometric', subtitle: 'Fingerprint or face', marker: 'B'},
];

export function PrimaryLockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PrimaryLock'>>();
  const palette = figmaPalette.dark;
  const [selectedRoute, setSelectedRoute] = React.useState<CredentialRoute>('PinSetup');
  const [featureFlow, setFeatureFlow] = React.useState<FeatureFlow>('APP_LOCK');

  React.useEffect(() => {
    void (async () => {
      const settings = await localDataRepository.getSettings();
      const activeFlow = route.params?.flow ?? settings.onboardingFeatureFlow ?? 'APP_LOCK';
      setFeatureFlow(activeFlow);
      await localDataRepository.saveSettings({...settings, onboardingResumeRoute: 'PrimaryLock', onboardingFeatureFlow: activeFlow});
    })();
  }, [route.params?.flow]);

  const continueToSetup = React.useCallback(async () => {
    const settings = await localDataRepository.getSettings();
    await localDataRepository.saveSettings({...settings, onboardingResumeRoute: selectedRoute, onboardingFeatureFlow: featureFlow});
    navigation.navigate(selectedRoute, {flow: featureFlow});
  }, [featureFlow, navigation, selectedRoute]);

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.backArrow, {color: palette.textPrimary}]}>←</Text>
          </Pressable>
          <View style={[styles.progressTrack, {backgroundColor: palette.border}]}>
            <View style={styles.progressFill} />
          </View>
          <Text style={[styles.stepLabel, {color: palette.textSecondary}]}>{featureFlow === 'LOCK_HIDE' ? 'Step 2 of 4' : 'Step 1 of 4'}</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroOrb}>
            <Text style={styles.heroGlyph}>L</Text>
          </View>
          <Text style={[styles.title, {color: '#93C5FD'}]}>{featureFlow === 'LOCK_HIDE' ? 'Lock + Hide' : 'App Lock'}</Text>
          <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Select your lock type</Text>
        </View>

        <View style={styles.grid}>
          {lockOptions.map(option => {
            const selected = selectedRoute === option.route;
            return (
              <Pressable
                key={option.route}
                onPress={() => setSelectedRoute(option.route)}
                style={({pressed}) => [
                  styles.option,
                  {
                    backgroundColor: selected ? '#172554' : palette.surface,
                    borderColor: selected ? '#3B82F6' : palette.border,
                    opacity: pressed ? 0.94 : 1,
                  },
                ]}>
                <View style={[styles.optionMarker, {backgroundColor: selected ? '#1E3A8A' : '#24234A'}]}>
                  <Text style={[styles.optionMarkerText, {color: selected ? '#BFDBFE' : palette.textSecondary}]}>{option.marker}</Text>
                </View>
                <Text style={[styles.optionTitle, {color: palette.textPrimary}]}>{option.title}</Text>
                <Text style={[styles.optionSubtitle, {color: palette.textSecondary}]}>{option.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.flex} />
        <Pressable onPress={() => void continueToSetup()} style={({pressed}) => [styles.continueButton, {opacity: pressed ? 0.94 : 1}]}>
          <Text style={styles.continueText}>Continue</Text>
          <Text style={styles.continueArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {backgroundColor: '#0A0F1D'},
  content: {flexGrow: 1, paddingTop: 8, paddingBottom: 28},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backButton: {width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  backArrow: {fontSize: 22, lineHeight: 26, fontWeight: '700'},
  progressTrack: {flex: 1, height: 4, borderRadius: 2, overflow: 'hidden'},
  progressFill: {width: '25%', height: '100%', borderRadius: 2, backgroundColor: '#3B82F6'},
  stepLabel: {fontSize: 11, lineHeight: 14, fontWeight: '700'},
  hero: {alignItems: 'center', marginTop: 32},
  heroOrb: {width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: '#2563EB', backgroundColor: '#10203B', alignItems: 'center', justifyContent: 'center'},
  heroGlyph: {color: '#93C5FD', fontSize: 28, lineHeight: 32, fontWeight: '900'},
  title: {marginTop: 20, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.5},
  subtitle: {marginTop: 6, fontSize: 14, lineHeight: 19},
  grid: {marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  option: {width: '48%', minHeight: 142, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 15},
  optionMarker: {width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  optionMarkerText: {fontSize: 18, lineHeight: 22, fontWeight: '900'},
  optionTitle: {marginTop: 12, fontSize: 15, lineHeight: 19, fontWeight: '800'},
  optionSubtitle: {marginTop: 4, fontSize: 11, lineHeight: 15, textAlign: 'center'},
  flex: {flex: 1, minHeight: 28},
  continueButton: {minHeight: 56, borderRadius: 28, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', flexDirection: 'row'},
  continueText: {color: '#FFFFFF', fontSize: 16, lineHeight: 20, fontWeight: '800'},
  continueArrow: {marginLeft: 10, color: '#FFFFFF', fontSize: 18, lineHeight: 21, fontWeight: '800'},
});
