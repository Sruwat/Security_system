import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
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
  const palette = figmaPalette.dark;

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <View style={styles.heroOrb}>
            <View style={styles.heroRingOuter} />
            <View style={styles.heroRingMid} />
            <View style={styles.heroCenter}>
              <Text style={styles.heroIcon}>􀎡</Text>
            </View>
          </View>

          <Text style={[styles.brand, {color: palette.accent}]}>VaultX</Text>
          <Text style={[styles.tagline, {color: '#D6BBFB'}]}>HIDE. LOCK. DISAPPEAR.</Text>
          <Text style={[styles.copy, {color: '#98A2B3'}]}>
            Military-grade privacy for your apps.{'\n'}No traces. Zero compromise.
          </Text>

          <View style={styles.featureWrap}>
            <FeatureChip label="App Hide" accent="#60A5FA" />
            <FeatureChip label="Smart Hide" accent="#F9A8D4" />
            <FeatureChip label="App Lock" accent="#FBBF24" />
            <FeatureChip label="Lock+Hide" accent="#FB923C" />
          </View>
        </View>

        <Pressable
          onPress={() => {
            void localDataRepository.setOnboardingResumeRoute('LauncherSetup');
            navigation.navigate('LauncherSetup');
          }}
          style={({pressed}) => [
            styles.primaryButton,
            {
              opacity: pressed ? 0.95 : 1,
            },
          ]}>
          <Text style={styles.primaryButtonText}>Let&apos;s Go</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>

        <Text style={[styles.footerText, {color: '#98A2B3'}]}>By continuing you agree to our Privacy Policy</Text>
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#090617',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: 42,
    paddingBottom: 28,
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 38,
  },
  heroOrb: {
    width: 178,
    height: 178,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingOuter: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  heroRingMid: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  heroCenter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1C1634',
    borderWidth: 1,
    borderColor: '#6D5BD0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 12},
  },
  heroIcon: {
    fontSize: 26,
    color: '#A78BFA',
    fontWeight: '700',
  },
  brand: {
    marginTop: 16,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 50,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  copy: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  featureWrap: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  featureChip: {
    minHeight: 38,
    borderRadius: 19,
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
  primaryButton: {
    minHeight: 56,
    borderRadius: 28,
    marginTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    shadowColor: '#A855F7',
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 10},
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  primaryButtonArrow: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  footerText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
});
