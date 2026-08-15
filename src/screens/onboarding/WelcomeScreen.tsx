import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

const featurePills = ['Local only', 'No cloud sync', 'Biometric ready'];

function LockMark() {
  return (
    <View style={styles.lockMarkShell}>
      <View style={styles.lockMarkRing} />
      <View style={styles.lockMarkCard}>
        <View style={styles.lockMarkShackle} />
        <View style={styles.lockMarkBody}>
          <View style={styles.lockMarkKeyhole} />
        </View>
      </View>
    </View>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={[styles.brandMark, {backgroundColor: palette.accentSoft}]}>
            <View style={[styles.brandDot, {backgroundColor: palette.accent}]} />
          </View>
          <View style={styles.brandCopy}>
            <Text style={[styles.brandName, {color: palette.textPrimary}]}>Smart App Lock</Text>
            <Text style={[styles.brandTag, {color: palette.textSecondary}]}>Hide and protect what matters</Text>
          </View>
          <View style={[styles.versionPill, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.versionText, {color: palette.textSecondary}]}>v2.0</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroGlow, {backgroundColor: 'rgba(167, 139, 250, 0.2)'}]} />
          <View style={[styles.heroGlowSoft, {backgroundColor: 'rgba(59, 130, 246, 0.12)'}]} />
          <View style={[styles.heroCard, {backgroundColor: palette.surface}]}>
            <LockMark />
            <View style={styles.heroCaptionRow}>
              <View style={[styles.heroCaptionPill, {backgroundColor: palette.accentSoft}]}>
                <Text style={[styles.heroCaptionText, {color: palette.accent}]}>Private by design</Text>
              </View>
              <Text style={[styles.heroCaptionSecondary, {color: palette.textSecondary}]}>Device-only security</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Hide apps, vaults, and secrets behind one clean lock.</Text>
        <Text style={[styles.body, {color: palette.textSecondary}]}>
          Build a private space for the apps you want to keep out of sight, with local authentication and no cloud dependency.
        </Text>

        <View style={styles.pillRow}>
          {featurePills.map(pill => (
            <View key={pill} style={[styles.featurePill, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
              <Text style={[styles.featureText, {color: palette.accent}]}>{pill}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.noteCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.noteKicker, {color: palette.textSecondary}]}>What you can set up</Text>
          <View style={styles.noteList}>
            <View style={styles.noteRow}>
              <View style={[styles.noteBullet, {backgroundColor: palette.accent}]} />
              <Text style={[styles.noteText, {color: palette.textPrimary}]}>Choose apps to lock or hide</Text>
            </View>
            <View style={styles.noteRow}>
              <View style={[styles.noteBullet, {backgroundColor: palette.accent}]} />
              <Text style={[styles.noteText, {color: palette.textPrimary}]}>Create a PIN, password, or biometric fallback</Text>
            </View>
            <View style={styles.noteRow}>
              <View style={[styles.noteBullet, {backgroundColor: palette.accent}]} />
              <Text style={[styles.noteText, {color: palette.textPrimary}]}>Keep the launcher experience calm and consistent</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Start setup" onPress={() => navigation.navigate('LauncherSetup')} />

        <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate('AuthGate')}>
          <Text style={[styles.secondaryActionText, {color: palette.textSecondary}]}>I already have a lock</Text>
        </Pressable>
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
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDot: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  brandTag: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 11,
  },
  versionPill: {
    minHeight: 28,
    minWidth: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  versionText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  hero: {
    marginTop: 18,
    height: 282,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: 8,
    left: -10,
  },
  heroGlowSoft: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: 24,
    right: 10,
  },
  heroCard: {
    width: '100%',
    height: 246,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 18},
    elevation: 6,
  },
  heroCaptionRow: {
    marginTop: 22,
    alignItems: 'center',
    gap: 10,
  },
  heroCaptionPill: {
    minHeight: 28,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCaptionText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  heroCaptionSecondary: {
    fontSize: 9,
    lineHeight: 11,
  },
  lockMarkShell: {
    width: 146,
    height: 146,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockMarkRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(109, 91, 208, 0.16)',
    backgroundColor: 'rgba(109, 91, 208, 0.08)',
  },
  lockMarkCard: {
    width: 72,
    alignItems: 'center',
  },
  lockMarkShackle: {
    width: 32,
    height: 22,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#A78BFA',
    marginBottom: -1,
  },
  lockMarkBody: {
    width: 64,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockMarkKeyhole: {
    width: 12,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 29,
    letterSpacing: -0.1,
  },
  body: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
  },
  pillRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featurePill: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  noteCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  noteKicker: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  noteList: {
    marginTop: 14,
    gap: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
    minHeight: 22,
  },
  secondaryAction: {
    marginTop: 14,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  secondaryActionText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
});
