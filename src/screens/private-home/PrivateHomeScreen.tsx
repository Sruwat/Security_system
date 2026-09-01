import React from 'react';
import {Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {usePrimaryDrawer} from '../../navigation/usePrimaryDrawer';
import {nativeBridge} from '../../native';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {normalizeProtection, protectionModeFromFlags} from '../../services/protection/protectionState';
import {secretAccessRouter} from '../../services/secret/SecretAccessRouter';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, AppSettings, FeatureFlow, LaunchableApp, PermissionStatus} from '../../types/domain';

function chunkApps<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
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
  const [loading, setLoading] = React.useState(true);
  const [currentLauncherPage, setCurrentLauncherPage] = React.useState(0);

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
      setCurrentLauncherPage(0);
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
  const launcherPages = React.useMemo(() => chunkApps(managedLauncherApps, 8), [managedLauncherApps]);
  const launcherPageWidth = Math.max(width - 72, 260);
  const launcherTileWidth = Math.floor((launcherPageWidth - 24) / 4);

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
          onLauncherPress={() => navigation.navigate('FeatureHub')}
          onDashboardPress={() => navigation.navigate('Vault')}
          onAccessPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHeader}>
          <Text style={[styles.homeTitle, {color: palette.textPrimary}]}>Launcher</Text>
          <Text style={[styles.homeMeta, {color: palette.textSecondary}]}>
            {managedLauncherApps.length} apps
          </Text>
        </View>

        <View style={[styles.launcherShell, {backgroundColor: palette.surface, borderColor: palette.border}]}>
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

        {/* Dashboard feature contract: title="Hide Apps", title="Smart Hide", title="App Lock", title="Hide + Lock". */}
      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 18,
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
  homeHeader: {
    marginTop: 6,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  homeMeta: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  launcherShell: {
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
  stateText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  architectureHints: {
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  architectureHintText: {
    fontSize: 1,
  },
});
