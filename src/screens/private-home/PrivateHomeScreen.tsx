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
import type {AppProtection, AppSettings, LaunchableApp, PermissionStatus} from '../../types/domain';

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
  eyebrow?: string;
  onPress: () => void;
  palette: typeof figmaPalette.dark;
  accent?: string;
  number?: string;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.quickAction,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.accent ?? props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.quickActionRow}>
        <View style={styles.quickActionLead}>
          {props.number ? <Text style={[styles.quickActionNumber, {color: '#667085'}]}>{props.number}</Text> : null}
          {props.eyebrow ? <Text style={[styles.quickActionEyebrow, {color: props.accent ?? props.palette.accent}]}>{props.eyebrow}</Text> : null}
        </View>
        <View style={[styles.quickActionArrow, {backgroundColor: props.palette.surfaceElevated}]}>
          <Text style={[styles.quickActionArrowText, {color: props.palette.textSecondary}]}>→</Text>
        </View>
      </View>
      <Text style={[styles.quickActionTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
      <Text style={[styles.quickActionSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
    </Pressable>
  );
}

function PermissionBanner(props: {
  title: string;
  body: string;
  actionLabel: string;
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  bodyColor: string;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.warningCard,
        {
          backgroundColor: props.backgroundColor,
          borderColor: props.borderColor,
          opacity: pressed ? 0.96 : 1,
        },
      ]}>
      <Text style={[styles.warningTitle, {color: props.titleColor}]}>{props.title}</Text>
      <Text style={[styles.warningBody, {color: props.bodyColor}]}>{props.body}</Text>
      <View style={[styles.warningActionPill, {borderColor: props.titleColor}]}>
        <Text style={[styles.warningActionText, {color: props.titleColor}]}>{props.actionLabel}</Text>
      </View>
    </Pressable>
  );
}

function AppRow(props: {
  app: AppProtection;
  palette: typeof figmaPalette.dark;
  onPress: () => void;
  onLaunch: () => void;
}) {
  const status = describeProtection(props.app);
  const accent = props.app.isHidden && props.app.isLocked ? '#D92D20' : props.app.isHidden ? props.palette.accent : '#1D4ED8';

  return (
    <View
      style={[
        styles.appRow,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
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
      <View style={styles.appActions}>
        <Pressable onPress={props.onPress} style={[styles.launchPill, {backgroundColor: props.palette.accentSoft}]}>
          <Text style={[styles.launchPillText, {color: props.palette.accent}]}>Manage</Text>
        </Pressable>
        <Pressable onPress={props.onLaunch} style={[styles.launchPill, {backgroundColor: props.palette.accentSoft}]}>
          <Text style={[styles.launchPillText, {color: props.palette.accent}]}>Open</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [launcherApps, setLauncherApps] = React.useState<LaunchableApp[]>([]);
  const [permissionStatuses, setPermissionStatuses] = React.useState<PermissionStatus[]>([]);
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      const stored = await localDataRepository.getProtectedApps();
      setApps(stored.map(normalizeProtection));
      const [discoveredApps, statuses, nextSettings] = await Promise.all([
        nativeBridge.getLaunchableApps().catch(() => []),
        nativeBridge.getPermissionStatuses().catch(() => []),
        localDataRepository.getSettings().catch(() => null),
      ]);
      setLauncherApps(discoveredApps);
      setPermissionStatuses(statuses);
      setSettings(nextSettings);
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
  const readiness = React.useMemo(
    () => ({
      launcherReady: launcherStatus?.status === 'enabled',
      accessibilityReady: accessibilityStatus?.status === 'enabled',
      credentialReady: Boolean(settings?.onboardingComplete && settings?.primaryAuthMethod),
    }),
    [accessibilityStatus?.status, launcherStatus?.status, settings?.onboardingComplete, settings?.primaryAuthMethod],
  );

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

  const openPermissionSetting = React.useCallback(async (settingsAction: string) => {
    try {
      await nativeBridge.openSystemSetting(settingsAction);
    } catch (error) {
      Alert.alert('Unable to open settings', error instanceof Error ? error.message : 'Android settings could not be opened.');
    }
  }, []);

  const hasPermissionIssue = launcherStatus?.status !== 'enabled' || accessibilityStatus?.status !== 'enabled';

  return (
    <FigmaRootLayout
      variant="dark"
      title="VaultX"
      drawerTitle="VaultX"
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
        <Text style={[styles.pageTitle, {color: palette.textPrimary}]}>Select a Feature</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Move through one clean private flow: choose a mode, protect apps, then manage everything from this dashboard.
        </Text>

        <View style={styles.quickActions}>
          <QuickAction
            title="Hide Apps"
            subtitle="Pick apps that should disappear from your managed launcher and stay inside Vault."
            eyebrow="Inside App Hide"
            onPress={() => navigation.navigate('AddApps', {preset: 'HIDE'})}
            palette={palette}
            accent="#3B82F6"
            number="01"
          />
          <QuickAction
            title="Smart Hide"
            subtitle="Choose the secret trigger that opens your hidden space."
            eyebrow={settings?.secretAccessType ? settings.secretAccessType.replace(/_/g, ' / ') : 'Triple Tap / Shake'}
            onPress={() => navigation.navigate('SecretEntry')}
            palette={palette}
            accent="#22C55E"
            number="02"
          />
          <QuickAction
            title="App Lock"
            subtitle="Keep apps visible but require authentication before they open."
            eyebrow="PIN / Pattern / Pass"
            onPress={() => navigation.navigate('AddApps', {preset: 'LOCK'})}
            palette={palette}
            accent="#EF4444"
            number="03"
          />
          <QuickAction
            title="Hide + Lock"
            subtitle="Hide apps from the launcher and require authentication before access."
            eyebrow="Step 1→2 Combined"
            onPress={() => navigation.navigate('AddApps', {preset: 'LOCK_HIDE'})}
            palette={palette}
            accent="#8B5CF6"
            number="04"
          />
        </View>

        {launcherStatus?.status !== 'enabled' ? (
          <PermissionBanner
            title="Managed launcher not active"
            body="Hidden apps stay out of this launcher only after Smart App Lock is selected as the default Home app."
            actionLabel="Open Home settings"
            onPress={() => void openPermissionSetting('home')}
            backgroundColor="#241739"
            borderColor="#3B82F6"
            titleColor="#93C5FD"
            bodyColor="#CBD5E1"
          />
        ) : null}

        {accessibilityStatus?.status !== 'enabled' ? (
          <PermissionBanner
            title="Lock protection needs Accessibility"
            body="Locked apps are saved, but Android launch interception will not enforce them until Accessibility is enabled."
            actionLabel="Open Accessibility"
            onPress={() => void openPermissionSetting('accessibility')}
            backgroundColor="#2B1320"
            borderColor="#EF4444"
            titleColor="#FCA5A5"
            bodyColor="#CBD5E1"
          />
        ) : null}

        <View style={styles.statsRow}>
          <StatCard
            label="Protected Apps"
            value={String(counts.protectedApps.length)}
            subtitle={countLabel(counts.protectedApps.length, 'app')}
            accent="#8B5CF6"
            accentSoft="#1C1634"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
          />
          <StatCard
            label="Hidden Apps"
            value={String(counts.hiddenApps.length)}
            subtitle={countLabel(counts.hiddenApps.length, 'hidden app', 'hidden apps')}
            accent="#60A5FA"
            accentSoft="#172554"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
            onPress={() => navigation.navigate('Vault')}
          />
          <StatCard
            label="Locked Apps"
            value={String(counts.lockedApps.length)}
            subtitle={countLabel(counts.lockedApps.length, 'locked app', 'locked apps')}
            accent="#F87171"
            accentSoft="#331313"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
          />
        </View>

        <View style={[styles.sectionCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Readiness</Text>
            <Pressable onPress={() => navigation.navigate('PrivacyCenter')}>
              <Text style={[styles.sectionLink, {color: palette.accent}]}>Review all</Text>
            </Pressable>
          </View>
          <View style={styles.readinessGrid}>
            <View style={[styles.readinessCard, {backgroundColor: readiness.launcherReady ? palette.accentSoft : '#FEF3C7'}]}>
              <Text style={[styles.readinessTitle, {color: readiness.launcherReady ? palette.accent : '#92400E'}]}>Launcher Ready</Text>
              <Text style={[styles.readinessBody, {color: palette.textSecondary}]}>
                {readiness.launcherReady ? 'Hide works in your managed launcher.' : 'Set Smart App Lock as Home launcher for Hide mode.'}
              </Text>
            </View>
            <View style={[styles.readinessCard, {backgroundColor: readiness.accessibilityReady ? '#FEE4E2' : '#FEE2E2'}]}>
              <Text style={[styles.readinessTitle, {color: '#991B1B'}]}>Accessibility Ready</Text>
              <Text style={[styles.readinessBody, {color: palette.textSecondary}]}>
                {readiness.accessibilityReady ? 'External app lock interception is active.' : 'Enable Accessibility before locked apps can be enforced.'}
              </Text>
            </View>
            <View style={[styles.readinessCard, {backgroundColor: palette.surfaceElevated}]}>
              <Text style={[styles.readinessTitle, {color: palette.textPrimary}]}>Credential Ready</Text>
              <Text style={[styles.readinessBody, {color: palette.textSecondary}]}>
                {readiness.credentialReady ? `${settings?.primaryAuthMethod ?? 'PIN'} is configured for protected access.` : 'Finish security setup to protect apps.'}
              </Text>
            </View>
          </View>
          <View style={styles.supportActions}>
            <QuickAction
            title="Open Hidden Apps"
            subtitle="Use your current secret access rules right now."
            onPress={openSecretAccess}
            palette={palette}
            />
            {launcherStatus?.status === 'enabled' ? (
              <QuickAction
                title="Use Phone Launcher"
                subtitle="Open Home settings and switch back to your OEM launcher any time."
                onPress={() => void openPermissionSetting('home')}
                palette={palette}
              />
            ) : null}
            {hasPermissionIssue ? (
              <QuickAction
                title="Fix Permissions"
                subtitle="Open Android settings for launcher, accessibility, and protection requirements."
                onPress={() => navigation.navigate('PrivacyCenter')}
                palette={palette}
              />
            ) : null}
          </View>
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
              No protected apps yet. Start with Hide Apps, App Lock, or Hide + Lock.
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
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Hide only: Secret Trigger {'>'} Hidden Apps</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Lock only: Open App {'>'} Lock Screen {'>'} App</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Hide + Lock: Secret Trigger {'>'} Lock Screen {'>'} Hidden Apps {'>'} App</Text>
        </View>
      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 18,
  },
  pageTitle: {
    marginTop: 6,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
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
  warningActionPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  warningActionText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
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
    marginTop: 24,
    gap: 12,
  },
  quickAction: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickActionTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  quickActionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  quickActionNumber: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  quickActionSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 19,
  },
  quickActionArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionArrowText: {
    fontSize: 18,
    fontWeight: '800',
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
  appActions: {
    gap: 8,
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
  readinessGrid: {
    marginTop: 14,
    gap: 12,
  },
  readinessCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  readinessTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  readinessBody: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },
  supportActions: {
    marginTop: 14,
    gap: 12,
  },
});
