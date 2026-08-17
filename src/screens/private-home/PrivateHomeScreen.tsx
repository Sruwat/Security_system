import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {usePrimaryDrawer} from '../../navigation/usePrimaryDrawer';
import {nativeBridge} from '../../native';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {describeProtection, lockTypeLabel, normalizeProtection, protectionModeFromFlags} from '../../services/protection/protectionState';
import {secretAccessRouter} from '../../services/secret/SecretAccessRouter';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, LaunchableApp, PermissionStatus} from '../../types/domain';

function countLabel(value: number, singular: string, plural = singular) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function StatCard(props: {
  label: string;
  value: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  textPrimary: string;
  textSecondary: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={[styles.statValue, {color: props.accent}]}>{props.value}</Text>
      <Text style={[styles.statLabel, {color: props.textPrimary}]}>{props.label}</Text>
      <Text style={[styles.statSubtitle, {color: props.textSecondary}]}>{props.subtitle}</Text>
    </>
  );

  if (!props.onPress) {
    return <View style={[styles.statCard, {backgroundColor: props.accentSoft}]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.statCard,
        {
          backgroundColor: props.accentSoft,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      {content}
    </Pressable>
  );
}

function QuickAction(props: {
  title: string;
  subtitle: string;
  onPress: () => void;
  palette: typeof figmaPalette.light;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.quickAction,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <Text style={[styles.quickActionTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
      <Text style={[styles.quickActionSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
    </Pressable>
  );
}

function AppRow(props: {
  app: AppProtection;
  palette: typeof figmaPalette.light;
  onPress: () => void;
  onLaunch: () => void;
}) {
  const status = describeProtection(props.app);
  const accent = props.app.isHidden && props.app.isLocked ? '#D92D20' : props.app.isHidden ? props.palette.accent : '#1D4ED8';

  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.appRow,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.95 : 1,
        },
      ]}>
      <View style={[styles.appAvatar, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.appAvatarText, {color: props.palette.accent}]}>
          {props.app.label.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.appBody}>
        <Text style={[styles.appName, {color: props.palette.textPrimary}]} numberOfLines={1}>
          {props.app.label}
        </Text>
        <Text style={[styles.appStatus, {color: accent}]}>{status}</Text>
        <Text style={[styles.appMeta, {color: props.palette.textSecondary}]}>
          {props.app.isLocked ? `${lockTypeLabel(props.app.lockType)} lock` : 'No lock'} {'|'} Auto-lock {props.app.autoLockSeconds ?? 30}s
        </Text>
      </View>
      <Pressable onPress={props.onLaunch} style={[styles.launchPill, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.launchPillText, {color: props.palette.accent}]}>Open</Text>
      </Pressable>
    </Pressable>
  );
}

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [launcherApps, setLauncherApps] = React.useState<LaunchableApp[]>([]);
  const [permissionStatuses, setPermissionStatuses] = React.useState<PermissionStatus[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      const stored = await localDataRepository.getProtectedApps();
      setApps(stored.map(normalizeProtection));
      const [discoveredApps, statuses] = await Promise.all([
        nativeBridge.getLaunchableApps().catch(() => []),
        nativeBridge.getPermissionStatuses().catch(() => []),
      ]);
      setLauncherApps(discoveredApps);
      setPermissionStatuses(statuses);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadApps();
    }, [loadApps]),
  );

  const counts = React.useMemo(() => {
    const protectedApps = apps.filter(app => app.enabled);
    const hiddenApps = protectedApps.filter(app => app.isHidden);
    const lockedApps = protectedApps.filter(app => app.isLocked);

    return {
      protectedApps,
      hiddenApps,
      lockedApps,
    };
  }, [apps]);

  const launcherStatus = React.useMemo(
    () => permissionStatuses.find(item => item.key === 'defaultLauncher'),
    [permissionStatuses],
  );
  const accessibilityStatus = React.useMemo(
    () => permissionStatuses.find(item => item.key === 'accessibility'),
    [permissionStatuses],
  );
  const managedLauncherApps = React.useMemo(() => {
    const hiddenPackages = new Set(counts.hiddenApps.map(app => app.packageName));
    return launcherApps.filter(app => !hiddenPackages.has(app.packageName));
  }, [counts.hiddenApps, launcherApps]);

  const openApp = React.useCallback(
    async (app: AppProtection) => {
      try {
        const outcome = await launchCoordinator.launch(app.packageName);
        if (outcome === 'auth_required') {
          navigation.navigate('AuthGate');
          return;
        }
        if (outcome === 'secret_required') {
          navigation.navigate('Calculator');
        }
      } catch (error) {
        Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch app.');
      }
    },
    [navigation],
  );

  const openLauncherApp = React.useCallback(
    async (app: LaunchableApp) => {
      try {
        const outcome = await launchCoordinator.launch(app.packageName);
        if (outcome === 'auth_required') {
          navigation.navigate('AuthGate');
          return;
        }
        if (outcome === 'secret_required') {
          navigation.navigate('Calculator');
        }
      } catch (error) {
        Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch app.');
      }
    },
    [navigation],
  );

  const editApp = React.useCallback(
    (app: AppProtection) => {
      navigation.navigate('ProtectionMode', {
        draft: {
          app: {
            packageName: app.packageName,
            label: app.label,
            iconUri: app.iconUri,
            systemApp: false,
          },
          mode: protectionModeFromFlags(app),
          authMethod: app.lockType ?? app.authMethod ?? 'PIN',
          autoLockSeconds: app.autoLockSeconds ?? 30,
        },
        onboarding: false,
      });
    },
    [navigation],
  );

  const openSecretAccess = React.useCallback(() => {
    void secretAccessRouter.handleSecretAccess().then(next => {
      if (next === 'auth_required') {
        navigation.navigate('AuthGate');
        return;
      }
      if (next === 'vault') {
        navigation.navigate('Vault');
        return;
      }
      navigation.navigate('Calculator');
    });
  }, [navigation]);

  return (
    <FigmaRootLayout
      variant="light"
      title="Protection Dashboard"
      drawerTitle="Smart App Lock"
      drawerOpen={drawerOpen}
      onDrawerOpen={openDrawer}
      onDrawerClose={closeDrawer}
      drawerDestinations={drawerDestinations}
      bottomNav={
        <FigmaBottomNav
          variant="light"
          active="home"
          onHomePress={() => navigation.navigate('PrivateHome')}
          onGalleryPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Hide apps, lock apps, or combine both protections from one simple control center.
        </Text>

        {launcherStatus?.status !== 'enabled' ? (
          <View style={[styles.warningCard, {backgroundColor: '#FEF3C7', borderColor: '#F59E0B'}]}>
            <Text style={[styles.warningTitle, {color: '#92400E'}]}>Managed launcher not active</Text>
            <Text style={[styles.warningBody, {color: '#92400E'}]}>
              Hidden apps stay out of this launcher only after Smart App Lock is selected as the default Home app.
            </Text>
          </View>
        ) : null}

        {accessibilityStatus?.status !== 'enabled' ? (
          <View style={[styles.warningCard, {backgroundColor: '#FEE2E2', borderColor: '#EF4444'}]}>
            <Text style={[styles.warningTitle, {color: '#991B1B'}]}>Lock protection needs Accessibility</Text>
            <Text style={[styles.warningBody, {color: '#991B1B'}]}>
              Locked apps are saved, but Android launch interception will not enforce them until Accessibility is enabled.
            </Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <StatCard
            label="Protected Apps"
            value={String(counts.protectedApps.length)}
            subtitle={countLabel(counts.protectedApps.length, 'app')}
            accent={palette.accent}
            accentSoft={palette.accentSoft}
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
          />
          <StatCard
            label="Hidden Apps"
            value={String(counts.hiddenApps.length)}
            subtitle={countLabel(counts.hiddenApps.length, 'hidden app', 'hidden apps')}
            accent="#1D4ED8"
            accentSoft="#DBEAFE"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
            onPress={() => navigation.navigate('Vault')}
          />
          <StatCard
            label="Locked Apps"
            value={String(counts.lockedApps.length)}
            subtitle={countLabel(counts.lockedApps.length, 'locked app', 'locked apps')}
            accent="#D92D20"
            accentSoft="#FEE4E2"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
          />
        </View>

        <View style={styles.quickActions}>
          <QuickAction
            title="Hide Apps"
            subtitle="Select apps that should live only in the hidden area."
            onPress={() => navigation.navigate('AddApps', {preset: 'HIDE'})}
            palette={palette}
          />
          <QuickAction
            title="Lock Apps"
            subtitle="Add a PIN, password, pattern, or biometric gate."
            onPress={() => navigation.navigate('AddApps', {preset: 'LOCK'})}
            palette={palette}
          />
          <QuickAction
            title="Hide + Lock"
            subtitle="Keep apps private and require authentication before access."
            onPress={() => navigation.navigate('AddApps', {preset: 'LOCK_HIDE'})}
            palette={palette}
          />
          <QuickAction
            title="Secret Access"
            subtitle="Open the hidden area through your configured secret method."
            onPress={openSecretAccess}
            palette={palette}
          />
        </View>

        <View style={[styles.sectionCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Managed Launcher</Text>
            <Text style={[styles.sectionLink, {color: palette.accent}]}>
              {managedLauncherApps.length} visible
            </Text>
          </View>

          {loading ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading launcher apps...</Text>
          ) : managedLauncherApps.length === 0 ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>
              No visible apps found. Hidden apps still remain inside Vault.
            </Text>
          ) : (
            <View style={styles.appList}>
              {managedLauncherApps.slice(0, 12).map(app => (
                <Pressable
                  key={app.packageName}
                  onPress={() => void openLauncherApp(app)}
                  style={({pressed}) => [
                    styles.launcherRow,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      opacity: pressed ? 0.95 : 1,
                    },
                  ]}>
                  <View style={[styles.appAvatar, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.appAvatarText, {color: palette.accent}]}>
                      {app.label.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.appBody}>
                    <Text style={[styles.appName, {color: palette.textPrimary}]} numberOfLines={1}>
                      {app.label}
                    </Text>
                    <Text style={[styles.appMeta, {color: palette.textSecondary}]} numberOfLines={1}>
                      {app.packageName}
                    </Text>
                  </View>
                  <View style={[styles.launchPill, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.launchPillText, {color: palette.accent}]}>Open</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Protected Apps</Text>
            <Pressable onPress={() => navigation.navigate('ManageApps')}>
              <Text style={[styles.sectionLink, {color: palette.accent}]}>Manage all</Text>
            </Pressable>
          </View>

          {loading ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading protected apps...</Text>
          ) : counts.protectedApps.length === 0 ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>
              No protected apps yet. Start with Hide Apps, Lock Apps, or Hide + Lock.
            </Text>
          ) : (
            <View style={styles.appList}>
              {counts.protectedApps.map(app => (
                <AppRow
                  key={app.packageName}
                  app={app}
                  palette={palette}
                  onPress={() => editApp(app)}
                  onLaunch={() => void openApp(app)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Current user flow</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Hide only: Secret Access {'>'} Hidden Apps</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Lock only: Open App {'>'} Lock Screen {'>'} App</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Hide + Lock: Secret Access {'>'} Lock Screen {'>'} Hidden Apps</Text>
        </View>
      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 18,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  warningCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  warningBody: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  statsRow: {
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  statSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },
  quickActions: {
    marginTop: 20,
    gap: 12,
  },
  quickAction: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  quickActionSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionCard: {
    marginTop: 20,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  stateText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  appList: {
    marginTop: 14,
    gap: 12,
  },
  launcherRow: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appRow: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  appBody: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  appStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  appMeta: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
  },
  launchPill: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchPillText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  flowLine: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
  },
});
