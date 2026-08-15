import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

function ModeCard(props: {
  title: string;
  subtitle: string;
  selected?: boolean;
  palette: typeof figmaPalette.dark;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.modeCard,
        {
          backgroundColor: props.selected ? props.palette.accentSoft : props.palette.surface,
          borderColor: props.selected ? props.palette.accent : props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={[styles.modeBadge, {backgroundColor: props.selected ? props.palette.accent : props.palette.accentSoft}]}>
        <Text style={[styles.modeBadgeText, {color: props.selected ? '#FFFFFF' : props.palette.accent}]}>
          {props.selected ? 'Selected' : 'Mode'}
        </Text>
      </View>
      <View style={styles.modeBody}>
        <Text style={[styles.modeTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.modeSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
    </Pressable>
  );
}

export function ProtectionModeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>4 of 4</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Set protection mode</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Instagram is just one example. Pick the level of protection you want for this app.</Text>

        <View style={[styles.appCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.appIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.appIconText, {color: palette.accent}]}>IG</Text>
          </View>
          <View style={styles.appBody}>
            <Text style={[styles.appTitle, {color: palette.textPrimary}]}>Instagram</Text>
            <Text style={[styles.appSubtitle, {color: palette.textSecondary}]}>Protected app profile</Text>
          </View>
        </View>

        <View style={styles.cards}>
          <ModeCard palette={palette} title="None" subtitle="Open normally" onPress={() => undefined} />
          <ModeCard palette={palette} title="Lock" subtitle="Authenticate to open" onPress={() => undefined} />
          <ModeCard palette={palette} title="Hide" subtitle="Remove from launcher" onPress={() => undefined} />
          <ModeCard palette={palette} title="Lock + Hide" subtitle="Hide + authenticate" selected onPress={() => undefined} />
        </View>

        <View style={[styles.notice, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noticeText, {color: palette.accent}]}>Lock + Hide keeps the app out of the launcher while still requiring authentication to open.</Text>
        </View>

        <View style={styles.infoStack}>
          <Pressable onPress={() => navigation.navigate('AutoLockSettings')} style={[styles.infoRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.infoTitle, {color: palette.textPrimary}]}>Auto-lock</Text>
            <Text style={[styles.infoMeta, {color: palette.textSecondary}]}>30 seconds</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('AuthGate')} style={[styles.infoRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.infoTitle, {color: palette.textPrimary}]}>Authentication</Text>
            <Text style={[styles.infoMeta, {color: palette.textSecondary}]}>Fingerprint + PIN</Text>
          </Pressable>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Save protection" onPress={() => navigation.navigate('SecretEntry')} />
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
  appCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  appBody: {
    flex: 1,
  },
  appTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  appSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  cards: {
    marginTop: 16,
    gap: 12,
  },
  modeCard: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeBadge: {
    minWidth: 70,
    minHeight: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
  },
  modeBody: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  modeSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  notice: {
    marginTop: 16,
    minHeight: 68,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  noticeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  infoStack: {
    marginTop: 14,
    gap: 10,
  },
  infoRow: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  infoMeta: {
    fontSize: 8,
    lineHeight: 10,
  },
  spacer: {
    flex: 1,
  },
});
