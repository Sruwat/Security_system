import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

function LockChoice(props: {title: string; subtitle: string; palette: typeof figmaPalette.dark; onPress: () => void}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.choiceCard,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.choiceBody}>
        <Text style={[styles.choiceTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.choiceSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <Text style={[styles.chevron, {color: props.palette.textSecondary}]}>{'>'}</Text>
    </Pressable>
  );
}

export function PrimaryLockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('PrimaryLock');
  }, []);

  const goTo = React.useCallback((route: 'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup') => {
    void localDataRepository.setOnboardingResumeRoute(route);
    navigation.navigate(route);
  }, [navigation]);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Primary lock</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Create once; reuse for protected access.</Text>

        <View style={styles.choices}>
          <LockChoice palette={palette} title="PIN" subtitle="4-6 digits" onPress={() => goTo('PinSetup')} />
          <LockChoice palette={palette} title="Password" subtitle="Text credential" onPress={() => goTo('PasswordSetup')} />
          <LockChoice palette={palette} title="Pattern" subtitle="Android-style pattern" onPress={() => goTo('PatternSetup')} />
          <LockChoice palette={palette} title="Biometric" subtitle="Optional after fallback" onPress={() => goTo('BiometricSetup')} />
        </View>

        <View style={[styles.noteCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noteTitle, {color: palette.accent}]}>Secure verification stays native.</Text>
          <Text style={[styles.noteBody, {color: palette.textSecondary}]}>Never store plaintext PIN in AsyncStorage.</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Create primary lock" onPress={() => goTo('PinSetup')} />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  stepPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
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
  choices: {
    marginTop: 58,
    gap: 14,
  },
  choiceCard: {
    minHeight: 112,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceBody: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  choiceSubtitle: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
  },
  noteCard: {
    marginTop: 80,
    minHeight: 176,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 36,
    paddingVertical: 44,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  noteBody: {
    marginTop: 28,
    fontSize: 11,
    lineHeight: 15,
  },
  chevron: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
});
