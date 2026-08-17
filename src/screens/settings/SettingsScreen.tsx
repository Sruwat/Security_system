import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {usePrimaryDrawer} from '../../navigation/usePrimaryDrawer';
import {nativeBridge} from '../../native';
import {describeProtection, lockTypeLabel} from '../../services/protection/protectionState';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, AppSettings, PermissionStatus} from '../../types/domain';

function GroupCard(props: {
  title: string;
  rows: Array<{title: string; subtitle: string; onPress: () => void}>;
  palette: typeof figmaPalette.light;
}) {
  return (
    <View style={[styles.groupCard, {backgroundColor: props.palette.surface, borderColor: props.palette.border}]}>
      <Text style={[styles.groupTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
      <View style={styles.groupRows}>
        {props.rows.map(row => (
          <Pressable key={row.title} onPress={row.onPress} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, {color: props.palette.textPrimary}]}>{row.title}</Text>
              <Text style={[styles.rowSubtitle, {color: props.palette.textSecondary}]}>{row.subtitle}</Text>
            </View>
            <Text style={[styles.rowChevron, {color: props.palette.textSecondary}]}>{'>'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [protectedApps, setProtectedApps] = React.useState<AppProtection[]>([]);
  const [permissionStatuses, setPermissionStatuses] = React.useState<PermissionStatus[]>([]);

  React.useEffect(() => {
    void localDataRepository.getSettings().then(setSettings);
    void localDataRepository.getProtectedApps().then(setProtectedApps);
    void nativeBridge.getPermissionStatuses().then(setPermissionStatuses);
    const unsubscribeSettings = localDataRepository.subscribeToSettings(setSettings);
    const unsubscribeApps = localDataRepository.subscribeToProtectedApps(setProtectedApps);

    return () => {
      unsubscribeSettings();
      unsubscribeApps();
    };
  }, []);

  if (!settings) {
    return (
      <FigmaRootLayout
        variant="light"
        title="Settings"
        drawerTitle="Smart App Lock"
        drawerOpen={drawerOpen}
        onDrawerOpen={openDrawer}
        onDrawerClose={closeDrawer}
        drawerDestinations={drawerDestinations}>
        <View style={styles.loadingShell}>
          <Text style={[styles.loadingText, {color: palette.textSecondary}]}>Loading settings...</Text>
        </View>
      </FigmaRootLayout>
    );
  }

  const hiddenApps = protectedApps.filter(app => app.isHidden);
  const lockedApps = protectedApps.filter(app => app.isLocked);
  const hideAndLockApps = protectedApps.filter(app => app.isHidden && app.isLocked);
  const sampleProtectedApp = protectedApps[0];
  const launcherStatus = permissionStatuses.find(item => item.key === 'defaultLauncher');
  const backgroundStatus = permissionStatuses.find(item => item.key === 'backgroundProtection');

  return (
    <FigmaRootLayout
      variant="light"
      title="Settings"
      drawerTitle="Smart App Lock"
      drawerOpen={drawerOpen}
      onDrawerOpen={openDrawer}
      onDrawerClose={closeDrawer}
      drawerDestinations={drawerDestinations}
      bottomNav={
        <FigmaBottomNav
          variant="light"
          active="settings"
          onHomePress={() => navigation.navigate('PrivateHome')}
          onGalleryPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Update security, secret access, disguise, and protected-app controls from one place.
        </Text>

        <GroupCard
          title="Security"
          palette={palette}
          rows={[
            {
              title: 'Primary Lock',
              subtitle: `Current default: ${lockTypeLabel(settings.defaultLockType)}`,
              onPress: () => navigation.navigate('PrimaryLock'),
            },
            {
              title: 'Auto-lock',
              subtitle: backgroundStatus ? backgroundStatus.status.replace(/_/g, ' ') : `Current timeout: ${settings.autoLockSecondsDefault}s`,
              onPress: () => navigation.navigate('AutoLockSettings'),
            },
          ]}
        />

        <GroupCard
          title="Smart Access"
          palette={palette}
          rows={[
            {
              title: 'Secret Trigger',
              subtitle: settings.secretAccessType.replace(/_/g, ' '),
              onPress: () => navigation.navigate('SecretEntry'),
            },
            {
              title: 'Hidden Apps',
              subtitle: `${hiddenApps.length} app${hiddenApps.length === 1 ? '' : 's'} in Vault`,
              onPress: () => navigation.navigate('Vault'),
            },
          ]}
        />

        <GroupCard
          title="App Disguise"
          palette={palette}
          rows={[
            {
              title: 'Current Disguise',
              subtitle: settings.disguiseType,
              onPress: () => navigation.navigate('SecretEntry'),
            },
            {
              title: 'Appearance',
              subtitle: settings.theme.toLowerCase(),
              onPress: () => navigation.navigate('AppearanceSettings'),
            },
          ]}
        />

        <GroupCard
          title="Protected Apps"
          palette={palette}
          rows={[
            {
              title: 'Manage Protected Apps',
              subtitle: sampleProtectedApp ? `${sampleProtectedApp.label}: ${describeProtection(sampleProtectedApp)}` : 'No protected apps yet',
              onPress: () => navigation.navigate('ManageApps'),
            },
            {
              title: 'Locked Apps',
              subtitle: `${lockedApps.length} app${lockedApps.length === 1 ? '' : 's'}`,
              onPress: () => navigation.navigate('ManageApps'),
            },
            {
              title: 'Hide + Lock',
              subtitle: `${hideAndLockApps.length} app${hideAndLockApps.length === 1 ? '' : 's'}`,
              onPress: () => navigation.navigate('ManageApps'),
            },
          ]}
        />

        <GroupCard
          title="Recovery"
          palette={palette}
          rows={[
            {
              title: 'Privacy Center',
              subtitle: launcherStatus ? `Launcher: ${launcherStatus.status.replace(/_/g, ' ')}` : 'Check launcher and accessibility readiness',
              onPress: () => navigation.navigate('PrivacyCenter'),
            },
            {
              title: 'AdManager Rules',
              subtitle: 'Review local ad surfaces and placement rules',
              onPress: () => navigation.navigate('AdManagerRules'),
            },
          ]}
        />
      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 18,
  },
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
  },
  groupCard: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  groupRows: {
    marginTop: 10,
    gap: 10,
  },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
  },
  rowChevron: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
});
