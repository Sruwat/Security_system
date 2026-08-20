import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {APP_UNLOCK_CREDENTIAL_REF, VAULT_SECRET_CREDENTIAL_REF} from '../../services/security/credentialTypes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppSettings, PermissionStatus} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

function ToggleRow(props: {label: string; value: boolean; onToggle: () => void; palette: typeof figmaPalette.light | typeof figmaPalette.dark}) {
  return (
    <Pressable onPress={props.onToggle} style={({pressed}) => [styles.row, {backgroundColor: props.palette.surface, borderColor: props.palette.border, opacity: pressed ? 0.94 : 1}]}>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, {color: props.palette.textPrimary}]}>{props.label}</Text>
        <Text style={[styles.rowSubtitle, {color: props.palette.textSecondary}]}>{props.value ? 'Enabled' : 'Disabled'}</Text>
      </View>
      <View style={[styles.toggle, {backgroundColor: props.value ? props.palette.accent : props.palette.accentSoft}]}>
        <Text style={[styles.toggleText, {color: props.value ? '#FFFFFF' : props.palette.accent}]}>{props.value ? 'On' : 'Off'}</Text>
      </View>
    </Pressable>
  );
}

function useSettings() {
  const [settings, setSettings] = React.useState<AppSettings | null>(null);

  React.useEffect(() => {
    void localDataRepository.getSettings().then(setSettings);
    const unsubscribe = localDataRepository.subscribeToSettings(next => {
      setSettings(next);
    });
    return unsubscribe;
  }, []);

  const update = React.useCallback(async (patch: Partial<AppSettings>) => {
    const current = await localDataRepository.getSettings();
    const next = {...current, ...patch};
    await localDataRepository.saveSettings(next);
    setSettings(next);
  }, []);

  return {settings, update};
}

const autoLockOptions = [30, 60, 300, 900];

export function AppearanceSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {settings, update} = useSettings();
  const rows: Array<{label: string; subtitle: string; value: AppSettings['theme']}> = [
    {label: 'System', subtitle: 'Follow the device appearance', value: 'SYSTEM'},
    {label: 'Light', subtitle: 'Use the bright launcher surface', value: 'LIGHT'},
    {label: 'Dark', subtitle: 'Use the private dark launcher', value: 'DARK'},
  ];

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Appearance</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Switch between System, Light, and Dark presentation.</Text>

        <View style={styles.list}>
          {settings
            ? rows.map(row => {
                const selected = settings.theme === row.value;
                return (
                  <Pressable
                    key={row.value}
                    onPress={() => void update({theme: row.value})}
                    style={({pressed}) => [
                      styles.row,
                      {
                        backgroundColor: selected ? palette.accentSoft : palette.surface,
                        borderColor: selected ? palette.accent : palette.border,
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}>
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{row.label}</Text>
                      <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>{row.subtitle}</Text>
                    </View>
                    <View style={[styles.toggle, {backgroundColor: selected ? palette.accent : palette.accentSoft}]}>
                      <Text style={[styles.toggleText, {color: selected ? '#FFFFFF' : palette.accent}]}>{selected ? 'On' : 'Set'}</Text>
                    </View>
                  </Pressable>
                );
              })
            : null}
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Back to settings" onPress={() => navigation.navigate('Settings')} />
      </ScrollView>
    </FigmaPage>
  );
}

export function PrivacyCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {settings, update} = useSettings();
  const [permissionStatuses, setPermissionStatuses] = React.useState<PermissionStatus[]>([]);
  const [recoveryBusy, setRecoveryBusy] = React.useState<string | null>(null);

  const refreshPermissionStatuses = React.useCallback(async () => {
    setPermissionStatuses(await nativeBridge.getPermissionStatuses());
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refreshPermissionStatuses();
    }, [refreshPermissionStatuses]),
  );

  const runRecoveryGate = React.useCallback(async (): Promise<boolean> => {
    const result = await nativeBridge.authenticateBiometric();
    if (result === 'success') {
      return true;
    }
    if (result === 'fail') {
      Alert.alert('Verification failed', 'Device verification did not complete, so the reset was cancelled.');
      return false;
    }

    return await new Promise<boolean>(resolve => {
      Alert.alert(
        'Device verification unavailable',
        'This device cannot complete secure biometric verification right now. Continue with a controlled local reset?',
        [
          {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
          {text: 'Continue reset', style: 'destructive', onPress: () => resolve(true)},
        ],
      );
    });
  }, []);

  const resetPrimaryLock = React.useCallback(async () => {
    setRecoveryBusy('primary');
    try {
      const allowed = await runRecoveryGate();
      if (!allowed) {
        return;
      }
      await nativeBridge.deleteCredential(APP_UNLOCK_CREDENTIAL_REF);
      await nativeBridge.clearTransientAccess();
      const current = await localDataRepository.getSettings();
      await localDataRepository.saveSettings({
        ...current,
        onboardingComplete: false,
        onboardingResumeRoute: 'PrimaryLock',
      });
      navigation.reset({index: 0, routes: [{name: 'PrimaryLock'}]});
    } finally {
      setRecoveryBusy(null);
    }
  }, [navigation, runRecoveryGate]);

  const resetAllProtection = React.useCallback(async () => {
    setRecoveryBusy('all');
    try {
      const allowed = await runRecoveryGate();
      if (!allowed) {
        return;
      }
      await nativeBridge.deleteCredential(APP_UNLOCK_CREDENTIAL_REF);
      await nativeBridge.deleteCredential(VAULT_SECRET_CREDENTIAL_REF);
      await nativeBridge.clearTransientAccess();
      await localDataRepository.saveProtectedApps([]);
      const current = await localDataRepository.getSettings();
      await localDataRepository.saveSettings({
        ...current,
        onboardingComplete: false,
        onboardingResumeRoute: 'Welcome',
        secretAccessType: 'triple_tap',
        secretEntryMethod: 'TRIPLE_TAP',
        disguiseType: 'default',
      });
      navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
    } finally {
      setRecoveryBusy(null);
    }
  }, [navigation, runRecoveryGate]);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Privacy Center</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Review the live Android setup state alongside the local privacy options that stay on this device.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Permissions and protection</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Open the relevant Android settings, then return here to re-check the current state automatically.</Text>
        </View>

        <View style={styles.list}>
          {permissionStatuses.map(item => (
            <Pressable
              key={item.key}
              onPress={() => {
                void nativeBridge.openSystemSetting(item.settingsAction).then(refreshPermissionStatuses);
              }}
              style={({pressed}) => [
                styles.row,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.94 : 1,
                },
              ]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{item.label}</Text>
                <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <View style={[styles.toggle, {backgroundColor: palette.accentSoft}]}>
                <Text style={[styles.toggleText, {color: palette.accent}]}>Open</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>On-device privacy settings</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>These options stay local and affect which ad surfaces appear inside the app.</Text>
        </View>

        {settings ? (
          <View style={styles.list}>
            <ToggleRow label="Banner ads" value={settings.bannerEnabled} onToggle={() => void update({bannerEnabled: !settings.bannerEnabled})} palette={palette} />
            <ToggleRow label="Native ads" value={settings.nativeAdEnabled} onToggle={() => void update({nativeAdEnabled: !settings.nativeAdEnabled})} palette={palette} />
          </View>
        ) : null}

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Recovery</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Reset local protection only after device verification, or use a controlled local reset if verification is unavailable.</Text>
        </View>

        <View style={styles.list}>
          <Pressable onPress={() => void resetPrimaryLock()} style={({pressed}) => [styles.row, {backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.94 : 1}]}>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>Reset primary lock</Text>
              <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>Recreate PIN, password, or pattern without revealing the previous credential.</Text>
            </View>
            <View style={[styles.toggle, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.toggleText, {color: palette.accent}]}>{recoveryBusy === 'primary' ? 'Working' : 'Reset'}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => void resetAllProtection()} style={({pressed}) => [styles.row, {backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.94 : 1}]}>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>Reset all protection</Text>
              <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>Clear credentials, protected apps, and secret access setup from this device.</Text>
            </View>
            <View style={[styles.toggle, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.toggleText, {color: palette.accent}]}>{recoveryBusy === 'all' ? 'Working' : 'Reset'}</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Back to settings" onPress={() => navigation.navigate('Settings')} />
      </ScrollView>
    </FigmaPage>
  );
}

export function AdManagerRulesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {settings, update} = useSettings();

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>AdManager Rules</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Review where banners and native ads can appear in the current flow.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Ad placement rules</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Banner ads can appear after setup or near top-level content. Native ads sit after functional content at the end of scroll sections.</Text>
        </View>

        {settings ? (
          <View style={styles.list}>
            <ToggleRow label="Allow banner ads" value={settings.bannerEnabled} onToggle={() => void update({bannerEnabled: !settings.bannerEnabled})} palette={palette} />
            <ToggleRow label="Allow native ads" value={settings.nativeAdEnabled} onToggle={() => void update({nativeAdEnabled: !settings.nativeAdEnabled})} palette={palette} />
          </View>
        ) : null}

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Back to settings" onPress={() => navigation.navigate('Settings')} />
      </ScrollView>
    </FigmaPage>
  );
}

export function AutoLockSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {settings, update} = useSettings();

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Auto-lock</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Choose how long the private session stays open after authentication.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Session timeout</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>This value controls the vault timer and protected launch sessions on the device.</Text>
        </View>

        <View style={styles.list}>
          {settings
            ? autoLockOptions.map(seconds => {
                const selected = settings.autoLockSecondsDefault === seconds;
                return (
                  <Pressable
                    key={seconds}
                    onPress={() => void update({autoLockSecondsDefault: seconds})}
                    style={({pressed}) => [
                      styles.row,
                      {
                        backgroundColor: selected ? palette.accentSoft : palette.surface,
                        borderColor: selected ? palette.accent : palette.border,
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}>
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minutes`}</Text>
                      <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>
                        {selected ? 'Current auto-lock setting' : 'Tap to select'}
                      </Text>
                    </View>
                    <View style={[styles.toggle, {backgroundColor: selected ? palette.accent : palette.accentSoft}]}>
                      <Text style={[styles.toggleText, {color: selected ? '#FFFFFF' : palette.accent}]}>{selected ? 'On' : 'Set'}</Text>
                    </View>
                  </Pressable>
                );
              })
            : null}
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Back to settings" onPress={() => navigation.navigate('Settings')} />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
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
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
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
  toggle: {
    minWidth: 52,
    minHeight: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  toggleText: {
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
  },
  spacer: {
    flex: 1,
  },
});
