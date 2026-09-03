import React from 'react';
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
import {useAppVariant} from '../../hooks/useAppVariant';
import type {RootStackParamList} from '../../navigation/routes';
import {usePrimaryDrawer} from '../../navigation/usePrimaryDrawer';
import {nativeBridge} from '../../native';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {normalizeProtection, protectionModeFromFlags} from '../../services/protection/protectionState';
import {sessionManager} from '../../services/session/SessionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection} from '../../types/domain';

type Palette = (typeof figmaPalette)[keyof typeof figmaPalette];

function modeLabel(mode: AppProtection['mode']): string {
  if (mode === 'LOCK_HIDE') {
    return 'BOTH';
  }
  if (mode === 'HIDE') {
    return 'HIDDEN';
  }
  if (mode === 'LOCK') {
    return 'LOCKED';
  }
  return 'OPEN';
}

function VaultCard(props: {
  app: AppProtection;
  palette: Palette;
  label: string;
  onPress: () => void;
}) {
  const iconLabel = props.app.label
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
        styles.appCard,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      {props.app.iconUri ? (
        <Image source={{uri: props.app.iconUri}} style={styles.appArtwork} resizeMode="contain" />
      ) : (
        <View style={[styles.appIcon, {backgroundColor: props.palette.accentSoft}]}>
          <Text style={[styles.appIconText, {color: props.palette.accent}]}>{iconLabel}</Text>
        </View>
      )}
      <View style={styles.appCopy}>
        <Text style={[styles.appLabel, {color: props.palette.textPrimary}]}>{props.label}</Text>
        <Text style={[styles.appMeta, {color: props.palette.textSecondary}]}>Private access configured</Text>
      </View>
      <View style={[styles.badgePill, {backgroundColor: props.app.isLocked ? '#3A1722' : props.palette.accentSoft}]}>
        <Text style={[styles.badgeText, {color: props.app.isLocked ? '#FDA4AF' : props.palette.accent}]}>{modeLabel(props.app.mode)}</Text>
      </View>
    </Pressable>
  );
}

export function VaultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const variant = useAppVariant();
  const palette = figmaPalette[variant];
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const pendingPackageName = launchCoordinator.getPendingLaunchPackageName();
  const pendingMode = launchCoordinator.getPendingLaunchMode();
  const hasVaultSession = sessionManager.isVaultUnlocked();

  const loadVault = React.useCallback(async () => {
    setLoading(true);
    try {
      setApps(await localDataRepository.getProtectedApps());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadVault();
    }, [loadVault]),
  );

  const hiddenApps = React.useMemo(() => {
    return apps.map(normalizeProtection).filter(app => app.isHidden);
  }, [apps]);
  const pendingApp = React.useMemo(
    () => hiddenApps.find(app => app.packageName === pendingPackageName),
    [hiddenApps, pendingPackageName],
  );
  const pendingLabel = pendingApp?.label ?? pendingPackageName ?? 'Private space';

  const visibleHiddenApps = hiddenApps.filter(app => !app.isLocked);
  const lockedHiddenApps = hiddenApps.filter(app => app.isLocked);

  const openPendingApp = React.useCallback(async () => {
    if (!pendingPackageName) {
      return;
    }

    if (!hasVaultSession) {
      navigation.navigate('Calculator');
      return;
    }

    if (pendingMode === 'LOCK_HIDE') {
      const outcome = await launchCoordinator.launchFromVault(pendingPackageName);
      if (outcome === 'auth_required') {
        navigation.navigate('AuthGate');
        return;
      }
      if (outcome === 'launched') {
        navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
        return;
      }
      Alert.alert('Launch failed', 'Unable to continue to the protected hidden app.');
      return;
    }

    const outcome = await launchCoordinator.launch(pendingPackageName);
    if (outcome === 'launched') {
      navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
      return;
    }

    if (outcome === 'auth_required') {
      navigation.navigate('AuthGate');
      return;
    }

    navigation.navigate('Calculator');
  }, [hasVaultSession, navigation, pendingMode, pendingPackageName]);

  return (
    <FigmaRootLayout
      variant={variant}
      title="My Vault"
      drawerTitle="Smart App Lock"
      drawerOpen={drawerOpen}
      onDrawerOpen={openDrawer}
      onDrawerClose={closeDrawer}
      drawerDestinations={drawerDestinations}
      rightActionLabel="+ Add"
      onRightActionPress={() => navigation.navigate('AddApps', {preset: 'HIDE', flow: 'APP_HIDE'})}
      bottomNav={
        <FigmaBottomNav
          variant={variant}
          active="access"
          onLauncherPress={() => navigation.navigate('FeatureHub')}
          onDashboardPress={() => navigation.navigate('Vault')}
          onAccessPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.statsCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: palette.textPrimary}]}>{apps.filter(app => app.isLocked).length}</Text>
            <Text style={[styles.statLabel, {color: palette.textSecondary}]}>Locked</Text>
          </View>
          <View style={[styles.statDivider, {backgroundColor: palette.border}]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: palette.textPrimary}]}>{hiddenApps.length}</Text>
            <Text style={[styles.statLabel, {color: palette.textSecondary}]}>Hidden</Text>
          </View>
          <View style={[styles.statDivider, {backgroundColor: palette.border}]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: palette.textPrimary}]}>{apps.filter(app => app.enabled).length}</Text>
            <Text style={[styles.statLabel, {color: palette.textSecondary}]}>Total</Text>
          </View>
        </View>

        {pendingPackageName ? (
          <View style={[styles.pendingCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <View style={[styles.pendingBadge, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.pendingBadgeText, {color: palette.accent}]}>Pending access</Text>
            </View>
            <Text style={[styles.pendingApp, {color: palette.textPrimary}]}>{pendingLabel}</Text>
            <Text style={[styles.pendingText, {color: palette.textSecondary}]}>
              {pendingMode === 'LOCK_HIDE'
                ? 'A hidden locked app is waiting for authentication before it can open.'
                : pendingMode
                  ? `The app is waiting in ${pendingMode} mode.`
                  : 'The app is waiting for private access.'}
            </Text>
            <FigmaActionButton
              variant={variant}
              label={pendingMode === 'LOCK_HIDE' ? 'Continue to Unlock' : 'Open Hidden App'}
              onPress={() => void openPendingApp()}
            />
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Protected Apps</Text>
        </View>

        <View style={styles.grid}>
          {loading ? (
            <View style={[styles.appCard, styles.loadingCard, {backgroundColor: propsBg(variant), borderColor: palette.border}]}>
              <Text style={[styles.loadingText, {color: palette.textSecondary}]}>Loading...</Text>
            </View>
          ) : hiddenApps.length === 0 ? (
            <View style={[styles.emptyCard, {backgroundColor: propsBg(variant), borderColor: palette.border}]}>
              <Text style={styles.emptyGlyph}>▣</Text>
              <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>Vault is Empty</Text>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Add your first protected app using the features on the Home tab</Text>
              <FigmaActionButton variant={variant} label="Go to Home" onPress={() => navigation.navigate('FeatureHub')} />
            </View>
          ) : (
            <>
              {visibleHiddenApps.map(app => (
                <VaultCard
                  key={app.packageName}
                  app={app}
                  palette={palette}
                  label={app.label}
                  onPress={() => {
                    void launchCoordinator
                      .launchFromVault(app.packageName)
                      .then(outcome => {
                        if (outcome === 'launched') {
                          navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
                          return;
                        }

                        if (outcome === 'auth_required') {
                          navigation.navigate('AuthGate');
                          return;
                        }
                      })
                      .catch(error => {
                        Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch hidden app.');
                      });
                  }}
                />
              ))}

              {lockedHiddenApps.map(app => (
                <VaultCard
                  key={app.packageName}
                  app={app}
                  palette={palette}
                  label={app.label}
                  onPress={() => {
                    launchCoordinator.restorePendingLaunch(app.packageName, app.mode ?? protectionModeFromFlags(app));
                    navigation.navigate(hasVaultSession ? 'AuthGate' : 'Calculator');
                  }}
                />
              ))}
            </>
          )}

        </View>

        <Pressable onPress={() => navigation.navigate('ManageApps')} style={[styles.manageRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.manageText, {color: palette.textPrimary}]}>Manage Hidden and Locked Apps</Text>
        </Pressable>

      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  darkPage: {
    backgroundColor: '#090D16',
  },
  lightPage: {
    backgroundColor: '#F7F8FC',
  },
  scrollContent: {
    paddingBottom: 18,
  },
  statsCard: {
    marginTop: 6,
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 34,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 18,
  },
  pendingCard: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  pendingApp: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  pendingText: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeader: {marginTop: 28, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  sectionTitle: {fontSize: 19, fontWeight: '800', lineHeight: 24, letterSpacing: -0.2},
  addText: {fontSize: 12, lineHeight: 16, fontWeight: '800'},
  grid: {
    gap: 10,
  },
  appCard: {
    width: '100%',
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    minHeight: 230,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 24,
  },
  emptyGlyph: {
    color: '#A5B4FC',
    fontSize: 34,
    lineHeight: 38,
  },
  emptyTitle: {
    marginTop: 13,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 6,
    marginBottom: 18,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appArtwork: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  appIconText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
  },
  appLabel: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  appCopy: {flex: 1},
  appMeta: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
  },
  badgePill: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 14,
  },
  manageRow: {
    marginTop: 18,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  manageText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  loadingText: {
    fontSize: 12,
    lineHeight: 16,
  },
});

function propsBg(variant: 'light' | 'dark') {
  return variant === 'dark' ? '#1B2232' : '#FFFFFF';
}
