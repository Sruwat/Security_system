import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

const rows = [
  ['Appearance', 'System / Light / Dark'],
  ['Primary lock', 'Fingerprint + PIN'],
  ['Secret access', 'Calculator code'],
  ['Auto-lock', '30 seconds'],
  ['Manage apps', '3 protected'],
  ['Privacy info', 'On-device only'],
  ['Privacy Center', 'Ads and local data'],
  ['AdManager Rules', 'Banner + native ads'],
];

function SettingRow(props: {title: string; subtitle: string; palette: typeof figmaPalette.light; onPress?: () => void}) {
  return (
    <Pressable onPress={props.onPress} style={({pressed}) => [styles.row, {backgroundColor: props.palette.surface, borderColor: props.palette.border, opacity: pressed ? 0.94 : 1}]}>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.rowSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <View style={[styles.chevPill, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.chevron, {color: props.palette.accent}]}>›</Text>
      </View>
    </Pressable>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Settings</Text>
          </View>
          <View style={[styles.pill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.pillText, {color: palette.accent}]}>Privacy</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Keep the private launcher tuned to your preferences.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <View style={[styles.heroDot, {backgroundColor: palette.accent}]} />
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>A few details, all in one place.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Appearance, authentication, and privacy settings stay grouped together for quick changes.</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.summaryLabel, {color: palette.textSecondary}]}>Protected apps</Text>
            <Text style={[styles.summaryValue, {color: palette.textPrimary}]}>3</Text>
          </View>
          <View style={[styles.summaryCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
            <Text style={[styles.summaryLabel, {color: palette.textSecondary}]}>Secret access</Text>
            <Text style={[styles.summaryValue, {color: palette.accent}]}>Ready</Text>
          </View>
        </View>

        <FigmaBanner variant="light" title="Banner ad" tone="surfaceElevated" />

        <View style={styles.list}>
          {rows.map(([title, subtitle]) => (
            <SettingRow
              key={title}
              title={title}
              subtitle={subtitle}
              palette={palette}
              onPress={
                title === 'Auto-lock'
                  ? () => navigation.navigate('AutoLockSettings')
                  : title === 'Secret access'
                    ? () => navigation.navigate('SecretEntry')
                    : title === 'Manage apps'
                      ? () => navigation.navigate('ManageApps')
                      : title === 'Privacy Center'
                  ? () => navigation.navigate('PrivacyCenter')
                  : title === 'AdManager Rules'
                    ? () => navigation.navigate('AdManagerRules')
                    : undefined
              }
            />
          ))}
        </View>

        <View style={[styles.callout, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.calloutTitle, {color: palette.accent}]}>Local only</Text>
          <Text style={[styles.calloutBody, {color: palette.textSecondary}]}>Settings are stored on-device and reflect the current private launcher state.</Text>
        </View>

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav variant="light" active="settings" />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 18,
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
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  pill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  row: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  rowSubtitle: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 10,
  },
  chevPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 14,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  callout: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  calloutTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  calloutBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },
  bottomSpacer: {
    height: 4,
  },
});
