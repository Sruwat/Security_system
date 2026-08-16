import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

function DiamondMark() {
  return (
    <View style={styles.diamondOuter}>
      <View style={styles.diamondInner} />
    </View>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Welcome</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Private apps stay on this device.</Text>

        <View style={[styles.heroShell, {backgroundColor: palette.accent}]}>
          <View style={styles.heroCard}>
            <DiamondMark />
          </View>
        </View>

        <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Lock. Hide. Keep private.</Text>
        <Text style={[styles.heroMeta, {color: palette.textSecondary}]}>No account • No cloud • Local protection</Text>

        <View style={styles.spacer} />

        {/* Security flow wiring remains native-backed:
            createCredential(APP_UNLOCK_CREDENTIAL_TYPE, ...)
            createCredential(VAULT_SECRET_CREDENTIAL_TYPE, ...) */}
        <FigmaActionButton
          variant="dark"
          label="Start setup"
          onPress={() => {
            void localDataRepository.setOnboardingResumeRoute('LauncherSetup');
            navigation.navigate('LauncherSetup');
          }}
        />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#090D16',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    marginTop: 28,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
  },
  heroShell: {
    marginTop: 56,
    minHeight: 438,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    width: 302,
    height: 270,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondOuter: {
    width: 68,
    height: 68,
    borderWidth: 6,
    borderColor: '#6D5BD0',
    transform: [{rotate: '45deg'}],
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondInner: {
    width: 28,
    height: 28,
    backgroundColor: '#6D5BD0',
  },
  heroTitle: {
    marginTop: 94,
    marginLeft: 20,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  heroMeta: {
    marginTop: 18,
    marginLeft: 20,
    fontSize: 12,
    lineHeight: 16,
  },
  spacer: {
    flex: 1,
    minHeight: 356,
  },
});
