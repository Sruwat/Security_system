import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, AppSettings} from '../../types/domain';

function formatPrimaryLock(settings: AppSettings): string {
  return settings.primaryAuthMethod === 'PASSWORD'
    ? 'Password'
    : settings.primaryAuthMethod === 'PATTERN'
      ? 'Pattern'
      : 'PIN';
}

function formatSecretAccess(settings: AppSettings): string {
  return settings.secretEntryMethod === 'CALCULATOR_CODE'
    ? 'Calculator code'
    : settings.secretEntryMethod === 'DOUBLE_TAP'
      ? 'Double tap'
      : settings.secretEntryMethod === 'TRIPLE_TAP'
        ? 'Triple tap'
        : settings.secretEntryMethod === 'LONG_PRESS'
          ? 'Long press'
          : 'Pinch';
}

function formatAutoLock(seconds: number): string {
  return seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minutes`;
}

function SettingRow(props: {title: string; subtitle: string; onPress?: () => void; palette: typeof figmaPalette.light}) {
  return (
    <Pressable onPress={props.onPress} style={({pressed}) => [styles.row, {backgroundColor: props.palette.surface, borderColor: props.palette.border, opacity: pressed ? 0.94 : 1}]}>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.rowSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <Text style={[styles.chevron, {color: props.palette.textSecondary}]}>›</Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [protectedApps, setProtectedApps] = React.useState<AppProtection[]>([]);

  React.useEffect(() => {
    void localDataRepository.getSettings().then(setSettings);
    void localDataRepository.getProtectedApps().then(setProtectedApps);
    const unsubscribeSettings = localDataRepository.subscribeToSettings(next => {
      setSettings(next);
    });
    const unsubscribeApps = localDataRepository.subscribeToProtectedApps(next => {
      setProtectedApps(next);
    });
    return () => {
      unsubscribeSettings();
      unsubscribeApps();
    };
  }, []);

  const rows = settings
    ? [
        ['Appearance', settings.theme === 'SYSTEM' ? 'System / Light / Dark' : settings.theme],
        ['Primary lock', formatPrimaryLock(settings)],
        ['Secret access', formatSecretAccess(settings)],
        ['Auto-lock', formatAutoLock(settings.autoLockSecondsDefault)],
        ['Manage apps', `${protectedApps.length} protected`],
        ['Privacy info', 'On-device only'],
      ]
    : [];

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Settings</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Privacy & appearance.</Text>

        <FigmaBanner screen="settings" variant="light" title="Banner ad" tone="surface" />

        <View style={styles.list}>
          {rows.map(([title, subtitle]) => (
            <SettingRow
              key={title}
              title={title}
              subtitle={subtitle}
              palette={palette}
              onPress={
                title === 'Appearance'
                  ? () => navigation.navigate('AppearanceSettings')
                  : title === 'Primary lock'
                    ? () => navigation.navigate('PrimaryLock')
                    : title === 'Secret access'
                      ? () => navigation.navigate('SecretEntry')
                      : title === 'Auto-lock'
                        ? () => navigation.navigate('AutoLockSettings')
                        : title === 'Manage apps'
                          ? () => navigation.navigate('ManageApps')
                          : () => navigation.navigate('PrivacyCenter')
              }
            />
          ))}
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
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    marginTop: 28,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    marginTop: 16,
    gap: 14,
  },
  row: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 10,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 8,
  },
});
