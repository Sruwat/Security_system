import React from 'react';
import {Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
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
import type {AppProtection, AppSettings, FeatureFlow, LaunchableApp, PermissionStatus} from '../../types/domain';

function countLabel(value: number, singular: string, plural = singular) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function chunkApps<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
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

function LauncherTile(props: {
  app: LaunchableApp;
  palette: typeof figmaPalette.dark;
  width: number;
  onPress: () => void;
}) {
  const initials = props.app.label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.launcherTile,
        {
          width: props.width,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      {props.app.iconUri ? (
        <Image source={{uri: props.app.iconUri}} style={styles.launcherTileArtwork} resizeMode="contain" />
      ) : (
        <View style={[styles.launcherTileIcon, {backgroundColor: props.palette.accentSoft}]}>
          <Text style={[styles.launcherTileInitials, {color: props.palette.accent}]}>{initials}</Text>
        </View>
      )}
      <Text style={[styles.launcherTileLabel, {color: props.palette.textPrimary}]} numberOfLines={2}>
        {props.app.label}
      </Text>
    </Pressable>
  );
}

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {width} = useWindowDimensions();
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [launcherApps, setLauncherApps] = React.useState<LaunchableApp[]>([]);
  const [permissionStatuses, setPermissionStatuses] = React.useState<PermissionStatus[]>([]);
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentLauncherPage, setCurrentLauncherPage] = React.useState(0);

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
      setCurrentLauncherPage(0);
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
  const launcherPages = React.useMemo(() => chunkApps(managedLauncherApps, 8), [managedLauncherApps]);
  const launcherPageWidth = Math.max(width - 72, 260);
  const launcherTileWidth = Math.floor((launcherPageWidth - 24) / 4);
  const readiness = React.useMemo(
    () => ({
      launcherReady: launcherStatus?.status === 'enabled',
      accessibilityReady: accessibilityStatus?.status === 'enabled',
      credentialReady: Boolean(settings?.onboardingComplete && settings?.primaryAuthMethod),
    }),
    [accessibilityStatus?.status, launcherStatus?.status, settings?.onboardingComplete, settings?.primaryAuthMethod],
  );

  const startFeatureFlow = React.useCallback(
    (flow: FeatureFlow) => {
      if (flow === 'SMART_HIDE') {
        navigation.navigate('SecretEntry', {flow});
        return;
      }

      const preset = flow === 'APP_HIDE' ? 'HIDE' : flow === 'APP_LOCK' ? 'LOCK' : 'LOCK_HIDE';
      navigation.navigate('AddApps', {preset, flow});
    },
    [navigation],
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
        flow: app.isHidden && app.isLocked ? 'LOCK_HIDE' : app.isHidden ? 'APP_HIDE' : 'APP_LOCK',
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
          variant="dark"
          active="launcher"
          onLauncherPress={() => navigation.navigate('PrivateHome')}
          onDashboardPress={() => navigation.navigate('ManageApps')}
          onAccessPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.launcherShell, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Apps</Text>
            <Text style={[styles.sectionLink, {color: palette.accent}]}>{managedLauncherApps.length}</Text>
          </View>

          {loading ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading launcher apps...</Text>
          ) : managedLauncherApps.length === 0 ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>No visible apps found. Hidden apps still remain inside Vault.</Text>
          ) : (
            <>
              <FlatList
                horizontal
                pagingEnabled
                data={launcherPages}
                keyExtractor={(_, index) => `launcher-page-${index}`}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToAlignment="start"
                disableIntervalMomentum
                contentContainerStyle={styles.launcherPager}
                onMomentumScrollEnd={event => {
                  const nextPage = Math.round(event.nativeEvent.contentOffset.x / launcherPageWidth);
                  setCurrentLauncherPage(nextPage);
                }}
                renderItem={({item}) => (
                  <View style={[styles.launcherPage, {width: launcherPageWidth}]}>
                    {item.map(app => (
                      <LauncherTile
                        key={app.packageName}
                        app={app}
                        palette={palette}
                        width={launcherTileWidth}
                        onPress={() => void openLauncherApp(app)}
                      />
                    ))}
                  </View>
                )}
              />
              <View style={styles.launcherDots}>
                {launcherPages.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[
                      styles.launcherDot,
                      {
                        backgroundColor: index === currentLauncherPage ? palette.accent : palette.border,
                        width: index === currentLauncherPage ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.quickStrip}>
          <QuickAction
            title="Hide Apps"
            subtitle="Private apps"
            onPress={() => startFeatureFlow('APP_HIDE')}
            palette={palette}
            accent="#3B82F6"
          />
          <QuickAction
            title="Smart Hide"
            subtitle={settings?.secretAccessType ? settings.secretAccessType.replace(/_/g, ' ') : 'Secret trigger'}
            onPress={() => startFeatureFlow('SMART_HIDE')}
            palette={palette}
            accent="#22C55E"
          />
          <QuickAction
            title="App Lock"
            subtitle="Secure apps"
            onPress={() => startFeatureFlow('APP_LOCK')}
            palette={palette}
            accent="#EF4444"
          />
          <QuickAction
            title="Hide + Lock"
            subtitle="Both"
            onPress={() => startFeatureFlow('LOCK_HIDE')}
            palette={palette}
            accent="#8B5CF6"
          />
        </View>

        <View style={styles.statsCompactRow}>
          <StatCard
            label="Protected"
            value={String(counts.protectedApps.length)}
            subtitle={countLabel(counts.protectedApps.length, 'app')}
            accent="#8B5CF6"
            accentSoft="#1C1634"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
            onPress={() => navigation.navigate('ManageApps')}
          />
          <StatCard
            label="Hidden"
            value={String(counts.hiddenApps.length)}
            subtitle={countLabel(counts.hiddenApps.length, 'app')}
            accent="#60A5FA"
            accentSoft="#172554"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
            onPress={() => navigation.navigate('Vault')}
          />
        </View>

        {launcherStatus?.status !== 'enabled' ? (
          <PermissionBanner
            title="Launcher needed"
            body="Hide works inside this launcher after Home access is enabled."
            actionLabel="Home settings"
            onPress={() => void openPermissionSetting('home')}
            backgroundColor="#241739"
            borderColor="#3B82F6"
            titleColor="#93C5FD"
            bodyColor="#CBD5E1"
          />
        ) : null}

        {accessibilityStatus?.status !== 'enabled' ? (
          <PermissionBanner
            title="Lock needs Accessibility"
            body="App Lock stays saved but won't enforce until Accessibility is on."
            actionLabel="Accessibility"
            onPress={() => void openPermissionSetting('accessibility')}
            backgroundColor="#2B1320"
            borderColor="#EF4444"
            titleColor="#FCA5A5"
            bodyColor="#CBD5E1"
          />
        ) : null}

        <View style={[styles.sectionCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.supportActions}>
            <QuickAction
              title="Dashboard"
              subtitle="Protected apps"
              onPress={() => navigation.navigate('ManageApps')}
              palette={palette}
            />
            <QuickAction
              title="Secret Access"
              subtitle="Vault and disguise"
              onPress={openSecretAccess}
              palette={palette}
            />
            <QuickAction
              title="Settings"
              subtitle="Security"
              onPress={() => navigation.navigate('Settings')}
              palette={palette}
            />
            {hasPermissionIssue ? (
              <QuickAction
                title="Fix Permissions"
                subtitle="Launcher and lock access"
                onPress={() => navigation.navigate('PrivacyCenter')}
                palette={palette}
              />
            ) : null}
          </View>
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
  launcherShell: {
    marginTop: 6,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  launcherPager: {
    paddingTop: 12,
  },
  launcherPage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 16,
    paddingRight: 8,
  },
  launcherTile: {
    alignItems: 'center',
  },
  launcherTileArtwork: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },
  launcherTileIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherTileInitials: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  launcherTileLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  launcherDots: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  launcherDot: {
    height: 8,
    borderRadius: 999,
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
  quickStrip: {
    marginTop: 16,
    gap: 10,
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
    marginTop: 16,
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
  supportActions: {
    gap: 12,
  },
  statsCompactRow: {
    marginTop: 16,
    gap: 12,
  },
});
