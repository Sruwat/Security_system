import React from 'react';
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaBanner, FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
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
      <Text style={[styles.appLabel, {color: props.palette.textPrimary}]}>{props.label}</Text>
      <View style={[styles.badgePill, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.badgeText, {color: props.palette.accent}]}>{modeLabel(props.app.mode)}</Text>
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
      title="Vault"
      drawerTitle="Smart App Lock"
      drawerOpen={drawerOpen}
      onDrawerOpen={openDrawer}
      onDrawerClose={closeDrawer}
      drawerDestinations={drawerDestinations}
      bottomNav={
        <FigmaBottomNav
          variant={variant}
          active="home"
          onHomePress={() => navigation.navigate('PrivateHome')}
          onGalleryPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>This is your private space. Hidden apps stay here and follow the access rules you already chose.</Text>

        <FigmaBanner screen="vault" variant={variant} title="Banner ad" tone="surface" />

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

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Hidden Apps</Text>

        <View style={styles.grid}>
          {loading ? (
            <View style={[styles.appCard, styles.loadingCard, {backgroundColor: propsBg(variant), borderColor: palette.border}]}>
              <Text style={[styles.loadingText, {color: palette.textSecondary}]}>Loading...</Text>
            </View>
          ) : hiddenApps.length === 0 ? (
            <View style={[styles.appCard, styles.loadingCard, {backgroundColor: propsBg(variant), borderColor: palette.border}]}>
              <Text style={[styles.loadingText, {color: palette.textSecondary}]}>No hidden apps yet</Text>
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

          <Pressable
            onPress={() => navigation.navigate('AddApps', {preset: 'HIDE', flow: 'APP_HIDE'})}
            style={({pressed}) => [
              styles.addCard,
              {backgroundColor: palette.accentSoft, borderColor: palette.accent, opacity: pressed ? 0.94 : 1},
            ]}>
            <Text style={[styles.addGlyph, {color: palette.accent}]}>+</Text>
            <Text style={[styles.addLabel, {color: palette.accent}]}>Add Apps</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('ManageApps')} style={[styles.manageRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.manageText, {color: palette.textPrimary}]}>Manage Hidden and Locked Apps</Text>
        </Pressable>

        <FigmaBanner screen="vault" variant={variant} placement="native" title="Native advertisement" subtitle="Placed after functional content" tone="surfaceElevated" />
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
  sectionTitle: {
    marginTop: 42,
    marginBottom: 24,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  appCard: {
    width: '47.5%',
    minHeight: 232,
    borderWidth: 1,
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingVertical: 26,
  },
  loadingCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appArtwork: {
    width: 88,
    height: 88,
    borderRadius: 24,
  },
  appIconText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  appLabel: {
    marginTop: 28,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  badgePill: {
    marginTop: 20,
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  addCard: {
    width: '47.5%',
    minHeight: 232,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGlyph: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '300',
  },
  addLabel: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  manageRow: {
    marginTop: 30,
    minHeight: 98,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  manageText: {
    fontSize: 15,
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
