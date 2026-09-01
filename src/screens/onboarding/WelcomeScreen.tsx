import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  const continueFlow = React.useCallback(async () => {
    await localDataRepository.saveSettings({
      ...(await localDataRepository.getSettings()),
      onboardingComplete: false,
      onboardingResumeRoute: undefined,
      onboardingFeatureFlow: 'APP_HIDE',
    });
    navigation.reset({index: 0, routes: [{name: 'FeatureHub'}]});
  }, [navigation]);

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.gridGlow} />
        <View style={styles.bottomGlow} />
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.outerRing, {borderColor: `${palette.accent}33`}]}>
            <View style={[styles.middleRing, {borderColor: `${palette.accent}66`}]}>
              <View style={[styles.lockOrb, {backgroundColor: palette.accentSoft, borderColor: palette.accent}]}>
                <Text style={[styles.lockGlyph, {color: palette.accent}]}>▣</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.brand, {color: palette.accent}]}>VaultX</Text>
          <Text style={[styles.tagline, {color: '#D8B4FE'}]}>HIDE. LOCK. DISAPPEAR.</Text>
          <Text style={[styles.description, {color: palette.textSecondary}]}>Private protection for your apps.{'\n'}Local control. No compromise.</Text>
        </View>

        <View style={styles.chips}>
          <FeatureChip label="App Hide" />
          <FeatureChip label="Smart Hide" />
          <FeatureChip label="App Lock" />
          <FeatureChip label="Lock + Hide" />
        </View>

        <View>
          <Pressable onPress={() => void continueFlow()} style={({pressed}) => [styles.primaryButton, {backgroundColor: palette.accent, opacity: pressed ? 0.94 : 1}]}>
            <Text style={styles.primaryButtonText}>Let’s Go</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </Pressable>
          <Pressable onPress={() => void continueFlow()} hitSlop={10} style={styles.skipButton}>
            <Text style={[styles.skipText, {color: palette.textSecondary}]}>Skip setup for now</Text>
          </Pressable>
          <Text style={[styles.privacy, {color: '#818CF8'}]}>Your data stays on this device.</Text>
        </View>
      </View>
    </FigmaPage>
  );
}

function FeatureChip(props: {label: string}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{props.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {backgroundColor: '#0A0F1D'},
  background: {...StyleSheet.absoluteFill, overflow: 'hidden'},
  gridGlow: {position: 'absolute', top: -150, left: -130, width: 430, height: 430, borderRadius: 215, backgroundColor: '#312E81', opacity: 0.24},
  bottomGlow: {position: 'absolute', right: -140, bottom: -140, width: 360, height: 360, borderRadius: 180, backgroundColor: '#6D28D9', opacity: 0.14},
  content: {flex: 1, justifyContent: 'space-between', paddingTop: 40, paddingBottom: 26},
  hero: {alignItems: 'center'},
  outerRing: {width: 142, height: 142, borderRadius: 71, borderWidth: 1, justifyContent: 'center', alignItems: 'center'},
  middleRing: {width: 112, height: 112, borderRadius: 56, borderWidth: 1, justifyContent: 'center', alignItems: 'center'},
  lockOrb: {width: 76, height: 76, borderRadius: 38, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  lockGlyph: {fontSize: 30, lineHeight: 34},
  brand: {marginTop: 28, fontSize: 52, lineHeight: 58, fontWeight: '900', letterSpacing: -1.6},
  tagline: {marginTop: 8, fontSize: 14, lineHeight: 18, fontWeight: '800', letterSpacing: 2.4},
  description: {marginTop: 20, fontSize: 15, lineHeight: 22, textAlign: 'center'},
  chips: {alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 20},
  chip: {minHeight: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.17)', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 13, justifyContent: 'center'},
  chipText: {color: '#C4B5FD', fontSize: 11, lineHeight: 14, fontWeight: '700'},
  primaryButton: {minHeight: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', flexDirection: 'row'},
  primaryButtonText: {color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '800'},
  primaryButtonArrow: {marginLeft: 10, color: '#FFFFFF', fontSize: 20, lineHeight: 23, fontWeight: '700'},
  skipButton: {marginTop: 16, alignItems: 'center'},
  skipText: {fontSize: 13, lineHeight: 18, fontWeight: '700'},
  privacy: {marginTop: 14, textAlign: 'center', fontSize: 11, lineHeight: 15},
});
