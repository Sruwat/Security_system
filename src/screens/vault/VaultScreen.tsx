import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {sessionManager} from '../../services/session/SessionManager';
import type {AppProtection} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';
import {useAppVariant} from '../../hooks/useAppVariant';

type Palette = (typeof figmaPalette)[keyof typeof figmaPalette];

function VaultMetric(props: {label: string; value: string; palette: Palette; tone?: 'accent' | 'surface'}) {
  const backgroundColor = props.tone === 'accent' ? props.palette.accent : props.palette.surface;
  const valueColor = props.tone === 'accent' ? '#FFFFFF' : props.palette.textPrimary;
  const labelColor = props.tone === 'accent' ? 'rgba(255,255,255,0.82)' : props.palette.textSecondary;

  return (
    <View style={[styles.metricCard, {backgroundColor, borderColor: props.palette.border}]}>
      <Text style={[styles.metricLabel, {color: labelColor}]}>{props.label}</Text>
      <Text style={[styles.metricValue, {color: valueColor}]}>{props.value}</Text>
    </View>
  );
}

export function VaultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const variant = useAppVariant();
  const palette = figmaPalette[variant];
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const pendingPackageName = launchCoordinator.getPendingLaunchPackageName();
  const pendingMode = launchCoordinator.getPendingLaunchMode();
  const pendingLabel = pendingMode === 'LOCK_HIDE' ? 'Protected app' : pendingPackageName;
  const hasVaultSession = sessionManager.getState()?.vaultUnlocked === true;

  const loadVault = React.useCallback(async () => {
    setLoading(true);
    try {
      setApps(await localDataRepository.getProtectedApps());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadVault();
  }, [loadVault]);

  const hiddenApps = React.useMemo(() => {
    return apps.filter(app => app.mode === 'HIDE' || app.mode === 'LOCK_HIDE');
  }, [apps]);

  const visibleHiddenApps = hiddenApps.filter(app => app.mode === 'HIDE');
  const lockedHiddenApps = hiddenApps.filter(app => app.mode === 'LOCK_HIDE');

  const openPendingApp = React.useCallback(async () => {
    if (!pendingPackageName) {
      return;
    }

    if (!hasVaultSession) {
      navigation.navigate('Calculator');
      return;
    }

    if (pendingMode === 'LOCK_HIDE') {
      const result = await nativeBridge.authenticateBiometric();
      if (result !== 'success') {
        Alert.alert('Authentication required', 'Biometric verification did not complete.');
        return;
      }

      const outcome = await launchCoordinator.completeAuthentication();
      if (outcome === 'app_launched') {
        navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
        return;
      }

      navigation.navigate('UnlockSuccess');
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
    <FigmaPage variant={variant}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Private vault</Text>
          </View>
          <View style={[styles.pill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.pillText, {color: palette.accent}]}>Secure</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Hidden apps and private content live here after authentication.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <View style={[styles.heroDot, {backgroundColor: palette.accent}]} />
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Your vault is a quiet home for private app launches.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>You can open hidden apps, review pending access, or jump back to the protected launcher.</Text>

          <View style={styles.metricRow}>
            <VaultMetric label="Hidden apps" value={`${hiddenApps.length}`} palette={palette} tone="accent" />
            <VaultMetric label="Access mode" value={pendingMode ?? 'Vault'} palette={palette} />
          </View>
        </View>

        {pendingPackageName ? (
          <View style={[styles.pendingCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <View style={styles.pendingHeader}>
              <View style={[styles.pendingBadge, {backgroundColor: palette.accentSoft}]}>
                <Text style={[styles.pendingBadgeText, {color: palette.accent}]}>Pending access</Text>
              </View>
              <Text style={[styles.pendingApp, {color: palette.textPrimary}]}>{pendingLabel}</Text>
            </View>
            <Text style={[styles.pendingText, {color: palette.textSecondary}]}>
              {pendingMode === 'LOCK_HIDE' ? 'A protected app is waiting for biometric confirmation.' : pendingMode ? `The app is waiting in ${pendingMode} mode.` : 'The app is waiting for vault access.'}
            </Text>
            <Text style={[styles.pendingHint, {color: palette.textSecondary}]}>Hidden launches stay routed through LaunchCoordinator.</Text>
            <FigmaActionButton
              variant={variant}
              label={pendingMode === 'LOCK_HIDE' ? 'Authenticate and open' : 'Open hidden app'}
              onPress={() => void openPendingApp()}
            />
          </View>
        ) : null}

        <FigmaBanner variant={variant} title="Banner ad" tone="surfaceElevated" />

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>My Private Apps</Text>
          <Pressable onPress={() => navigation.navigate('ManageApps')}>
            <Text style={[styles.sectionLink, {color: palette.accent}]}>Manage</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {loading ? (
            <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Loading hidden apps...</Text>
            </View>
          ) : hiddenApps.length === 0 ? (
            <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>No hidden apps yet</Text>
              <Pressable onPress={() => navigation.navigate('AddApps')} style={[styles.emptyButton, {backgroundColor: palette.accentSoft}]}>
                <Text style={[styles.emptyButtonText, {color: palette.accent}]}>Add apps</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {visibleHiddenApps.map(app => (
                <Pressable
                  key={app.packageName}
                  onPress={() => {
                    void launchCoordinator.launch(app.packageName).catch(error => {
                      Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch hidden app.');
                    });
                  }}
                  style={({pressed}) => [
                    styles.gridCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      opacity: pressed ? 0.94 : 1,
                    },
                  ]}>
                  <View style={[styles.iconBox, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.iconText, {color: palette.accent}]}>{app.label.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>{app.label}</Text>
                  <View style={[styles.modePill, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.modeText, {color: palette.accent}]}>HIDE</Text>
                  </View>
                </Pressable>
              ))}

              {lockedHiddenApps.map(app => (
                <Pressable
                  key={app.packageName}
                  onPress={() => {
                    launchCoordinator.restorePendingLaunch(app.packageName, app.mode);
                    navigation.navigate(hasVaultSession ? 'AuthGate' : 'Calculator');
                  }}
                  style={({pressed}) => [
                    styles.gridCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      opacity: pressed ? 0.94 : 1,
                    },
                  ]}>
                  <View style={[styles.iconBox, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.iconText, {color: palette.accent}]}>LK</Text>
                  </View>
                  <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Protected app</Text>
                  <View style={[styles.modePill, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.modeText, {color: palette.accent}]}>LOCK_HIDE</Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}

          <Pressable
            onPress={() => navigation.navigate('AddApps')}
            style={({pressed}) => [styles.addCard, {backgroundColor: palette.accentSoft, borderColor: palette.accent, opacity: pressed ? 0.94 : 1}]}>
            <Text style={[styles.addGlyph, {color: palette.accent}]}>+</Text>
            <Text style={[styles.addLabel, {color: palette.accent}]}>Add Apps</Text>
          </Pressable>
        </View>

        <View style={[styles.callout, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.calloutTitle, {color: palette.textPrimary}]}>Launch flow</Text>
          <Text style={[styles.calloutBody, {color: palette.textSecondary}]}>Opening a hidden app keeps the user inside the protected route instead of bypassing it.</Text>
        </View>

        <FigmaBanner variant={variant} placement="native" title="Native advertisement" subtitle="Placed after functional content" tone="surfaceElevated" />

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav variant={variant} active="home" />
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
  metricRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  metricValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  pendingCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  pendingHeader: {
    gap: 8,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  pendingApp: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  pendingText: {
    fontSize: 11,
    lineHeight: 15,
  },
  pendingHint: {
    fontSize: 8,
    lineHeight: 10,
  },
  sectionRow: {
    marginTop: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  sectionLink: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    minHeight: 126,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  emptyCard: {
    width: '48%',
    minHeight: 126,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 9,
  },
  emptyButton: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 10,
  },
  modePill: {
    minWidth: 54,
    alignSelf: 'flex-start',
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  addCard: {
    width: '48%',
    minHeight: 126,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGlyph: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
  addLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
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
