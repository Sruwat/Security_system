import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

export function VaultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const pendingPackageName = launchCoordinator.getPendingLaunchPackageName();
  const pendingMode = launchCoordinator.getPendingLaunchMode();

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

  const openPendingApp = React.useCallback(async () => {
    if (!pendingPackageName) {
      return;
    }

    if (pendingMode === 'LOCK_HIDE') {
      const result = await nativeBridge.authenticateBiometric();
      if (result !== 'success') {
        Alert.alert('Authentication required', 'Biometric verification did not complete.');
        return;
      }
    }

    try {
      const outcome = await launchCoordinator.completeAuthentication();
      if (outcome === 'app_launched') {
        navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
      } else if (outcome === 'vault_unlocked') {
        navigation.navigate('SecretEntry');
      }
    } catch (error) {
      Alert.alert('Unable to open app', error instanceof Error ? error.message : 'Failed to launch hidden app.');
    }
  }, [navigation, pendingMode, pendingPackageName]);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Private Vault</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Hidden apps and private content live here.</Text>

        {pendingPackageName ? (
          <View style={[styles.pendingCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.pendingTitle, {color: palette.textPrimary}]}>Pending access</Text>
            <Text style={[styles.pendingText, {color: palette.textSecondary}]}>
              {pendingPackageName}
              {pendingMode ? ` is waiting in ${pendingMode} mode.` : ' is waiting for vault access.'}
            </Text>
            <Text style={[styles.pendingHint, {color: palette.textSecondary}]}>Hidden launches stay routed through LaunchCoordinator.</Text>
            <FigmaActionButton
              variant="dark"
              label={pendingMode === 'LOCK_HIDE' ? 'Authenticate and open' : 'Open hidden app'}
              onPress={() => void openPendingApp()}
            />
          </View>
        ) : null}

        <FigmaBanner variant="dark" title="Banner ad" tone="surfaceElevated" />

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>My Private Apps</Text>

        <View style={styles.grid}>
          {hiddenApps.length === 0 ? (
            <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>No hidden apps yet</Text>
            </View>
          ) : (
            hiddenApps.map(app => (
              <Pressable
                key={app.packageName}
                onPress={() => {
                  void launchCoordinator.launch(app.packageName).catch(error => {
                    Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch hidden app.');
                  });
                }}
                style={[styles.gridCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
                <View style={[styles.iconBox, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.iconText, {color: palette.accent}]}>{app.label.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>{app.label}</Text>
                <View style={[styles.modePill, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.modeText, {color: palette.accent}]}>{app.mode}</Text>
                </View>
              </Pressable>
            ))
          )}

          <Pressable onPress={() => navigation.navigate('AddApps')} style={[styles.addCard, {backgroundColor: palette.accentSoft, borderColor: palette.accent}]}>
            <Text style={[styles.addGlyph, {color: palette.accent}]}>＋</Text>
            <Text style={[styles.addLabel, {color: palette.accent}]}>Add Apps</Text>
          </Pressable>
        </View>

        <FigmaBanner
          variant="dark"
          title="Native advertisement"
          subtitle="Placed after functional content"
          tone="surfaceElevated"
        />

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav variant="dark" active="home" />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 17,
  },
  time: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
  },
  title: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 11,
  },
  pendingCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  pendingTitle: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  pendingText: {
    fontSize: 9,
    lineHeight: 12,
  },
  pendingHint: {
    fontSize: 8,
    lineHeight: 10,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 16,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    width: 148,
    minHeight: 112,
    borderRadius: 21,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  emptyCard: {
    width: 148,
    minHeight: 112,
    borderRadius: 21,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 9,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    marginTop: 6,
  },
  modePill: {
    minWidth: 54,
    alignSelf: 'flex-start',
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  addCard: {
    width: 148,
    minHeight: 112,
    borderRadius: 21,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGlyph: {
    fontSize: 25,
    fontWeight: '400',
    lineHeight: 28,
  },
  addLabel: {
    marginTop: 18,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  bottomSpacer: {
    height: 16,
  },
});
