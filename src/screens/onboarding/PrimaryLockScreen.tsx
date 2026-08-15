import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

function LockChoice(props: {title: string; subtitle: string; icon: string; palette: typeof figmaPalette.dark}) {
  return (
    <View style={[styles.choiceCard, {backgroundColor: props.palette.surface, borderColor: props.palette.border}]}>
      <View style={[styles.choiceIcon, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.choiceIconText, {color: props.palette.accent}]}>{props.icon}</Text>
      </View>
      <View style={styles.choiceBody}>
        <Text style={[styles.choiceTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.choiceSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
    </View>
  );
}

export function PrimaryLockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>3 of 4</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Create a primary lock</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Choose the secure method you'll use to unlock protected apps and vault content.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.heroGraphic}>
            <View style={[styles.heroRing, {borderColor: palette.accentSoft}]} />
            <View style={[styles.heroCenter, {backgroundColor: palette.accent}]}>
              <Text style={styles.heroCenterText}>PIN</Text>
            </View>
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>One credential, every protected surface.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>PIN is the default fallback, while biometrics can be enabled for faster access later.</Text>
        </View>

        <View style={styles.choices}>
          <LockChoice palette={palette} icon="1234" title="PIN" subtitle="Fast numeric fallback" />
          <LockChoice palette={palette} icon="Aa" title="Password" subtitle="Text-based credential" />
          <LockChoice palette={palette} icon="O" title="Pattern" subtitle="Android-style gesture lock" />
          <LockChoice palette={palette} icon="B" title="Biometric" subtitle="Use fingerprint or face unlock" />
        </View>

        <View style={[styles.noteCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noteTitle, {color: palette.accent}]}>Security note</Text>
          <Text style={[styles.noteBody, {color: palette.textSecondary}]}>Credentials should stay local and never be stored as plain text.</Text>
        </View>

        <Pressable style={[styles.inlineLink, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.inlineLinkText, {color: palette.textSecondary}]}>Need to review credential requirements?</Text>
        </Pressable>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Create primary lock" onPress={() => navigation.navigate('AddApps')} />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    marginTop: 10,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
    letterSpacing: -0.1,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
  },
  heroCard: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  heroGraphic: {
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
  },
  heroCenter: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  heroTitle: {
    marginTop: 2,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 23,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
  choices: {
    marginTop: 16,
    gap: 12,
  },
  choiceCard: {
    minHeight: 72,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconText: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  choiceBody: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  choiceSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  noteCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  noteBody: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 14,
  },
  inlineLink: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLinkText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  spacer: {
    flex: 1,
  },
});
