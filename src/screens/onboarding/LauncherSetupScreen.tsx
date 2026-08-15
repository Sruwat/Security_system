import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

function StepCard(props: {title: string; subtitle: string; index: string; palette: typeof figmaPalette.light}) {
  return (
    <View style={[styles.stepCard, {backgroundColor: props.palette.surface, borderColor: props.palette.border}]}>
      <View style={[styles.stepIndex, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.stepIndexText, {color: props.palette.accent}]}>{props.index}</Text>
      </View>
      <View style={styles.stepBody}>
        <Text style={[styles.stepTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.stepSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
    </View>
  );
}

export function LauncherSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Launcher setup</Text>
          </View>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepPillText, {color: palette.accent}]}>1 of 4</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Complete the one-time launcher setup so protected apps can stay hidden and easy to open from your private space.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <View style={[styles.heroDot, {backgroundColor: palette.accent}]} />
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Keep control inside Smart App Lock.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>This setup lets the launcher handle hiding, opening, and returning users to a secure home screen.</Text>
        </View>

        <View style={styles.steps}>
          <StepCard palette={palette} index="01" title="Set as default launcher" subtitle="Route the Home button through the private launcher." />
          <StepCard palette={palette} index="02" title="Allow app discovery" subtitle="Make protected apps visible to the private launcher." />
        </View>

        <View style={[styles.noteCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noteTitle, {color: palette.accent}]}>What this does not do</Text>
          <Text style={[styles.noteBody, {color: palette.textSecondary}]}>It does not claim Android-wide hiding or modify unrelated system apps.</Text>
        </View>

        <Pressable style={[styles.inlineLink, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.inlineLinkText, {color: palette.textSecondary}]}>Need help with launcher permissions?</Text>
        </Pressable>

        <View style={styles.spacer} />

        <FigmaActionButton variant="light" label="Continue" onPress={() => navigation.navigate('PrimaryLock')} />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
    letterSpacing: -0.1,
  },
  stepPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
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
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDot: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 23,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
  steps: {
    marginTop: 16,
    gap: 12,
  },
  stepCard: {
    minHeight: 74,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIndex: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  stepSubtitle: {
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
    fontSize: 11,
    lineHeight: 15,
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
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  spacer: {
    flex: 1,
  },
});
