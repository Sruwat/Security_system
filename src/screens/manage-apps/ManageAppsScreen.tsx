import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {protectionManager} from '../../services/protection/ProtectionManager';
import type {AppProtection, ProtectionMode} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

const protectionModes: ProtectionMode[] = ['LOCK_HIDE', 'HIDE', 'LOCK', 'NONE'];

function cycleMode(mode: ProtectionMode): ProtectionMode {
  const index = protectionModes.indexOf(mode);
  return protectionModes[(index + 1) % protectionModes.length];
}

function StatCard(props: {label: string; value: string; palette: typeof figmaPalette.dark; tone?: 'accent' | 'surface'}) {
  const backgroundColor = props.tone === 'accent' ? props.palette.accent : props.palette.surface;
  const valueColor = props.tone === 'accent' ? '#FFFFFF' : props.palette.textPrimary;
  const labelColor = props.tone === 'accent' ? 'rgba(255,255,255,0.82)' : props.palette.textSecondary;

  return (
    <View style={[styles.statCard, {backgroundColor, borderColor: props.palette.border}]}>
      <Text style={[styles.statLabel, {color: labelColor}]}>{props.label}</Text>
      <Text style={[styles.statValue, {color: valueColor}]}>{props.value}</Text>
    </View>
  );
}

export function ManageAppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyPackage, setBusyPackage] = React.useState<string | null>(null);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      setApps(await localDataRepository.getProtectedApps());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const updateMode = React.useCallback(
    async (app: AppProtection) => {
      setBusyPackage(app.packageName);
      try {
        await protectionManager.upsertProtection({...app, mode: cycleMode(app.mode), updatedAt: Date.now()});
        await loadApps();
      } catch (error) {
        Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to change protection mode.');
      } finally {
        setBusyPackage(null);
      }
    },
    [loadApps],
  );

  const removeProtection = React.useCallback(
    async (app: AppProtection) => {
      Alert.alert('Remove app?', `Remove protection for ${app.label}?`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyPackage(app.packageName);
              try {
                await protectionManager.removeProtection(app.packageName);
                await loadApps();
                navigation.navigate('AppRemoved', {label: app.label});
              } catch (error) {
                Alert.alert('Remove failed', error instanceof Error ? error.message : 'Unable to remove protection.');
              } finally {
                setBusyPackage(null);
              }
            })();
          },
        },
      ]);
    },
    [loadApps],
  );

  const protectedCount = apps.length;
  const hideCount = apps.filter(app => app.mode === 'HIDE' || app.mode === 'LOCK_HIDE').length;

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Manage apps</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('AddApps')} style={[styles.addChip, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.addChipText, {color: palette.accent}]}>Add new</Text>
          </Pressable>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Adjust how each app behaves. Change the mode, hide it, or remove protection entirely.</Text>

        <View style={styles.statsRow}>
          <StatCard label="Protected apps" value={`${protectedCount}`} palette={palette} tone="accent" />
          <StatCard label="Hidden apps" value={`${hideCount}`} palette={palette} />
        </View>

        {loading ? (
          <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Loading managed apps...</Text>
          </View>
        ) : apps.length === 0 ? (
          <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Nothing to manage yet</Text>
            <Pressable onPress={() => navigation.navigate('AddApps')} style={[styles.emptyButton, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.emptyButtonText, {color: palette.accent}]}>Add apps</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {apps.map(app => (
              <View key={app.packageName} style={[styles.row, {backgroundColor: palette.surface, borderColor: palette.border}]}>
                <View style={[styles.iconBox, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.iconText, {color: palette.accent}]}>{app.label.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{app.label}</Text>
                  <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>{app.mode === 'LOCK_HIDE' ? 'Lock + Hide' : app.mode}</Text>
                </View>
                <Pressable onPress={() => void updateMode(app)} style={[styles.actionPill, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.actionText, {color: palette.accent}]}>
                    {busyPackage === app.packageName ? 'Updating...' : 'Change'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void removeProtection(app)} style={[styles.actionPill, styles.removePill, {backgroundColor: palette.surfaceElevated}]}>
                  <Text style={[styles.actionText, {color: palette.textSecondary}]}>
                    {busyPackage === app.packageName ? 'Removing...' : 'Remove'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.callout, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.calloutTitle, {color: palette.textPrimary}]}>Tip</Text>
          <Text style={[styles.calloutBody, {color: palette.textSecondary}]}>Lock + Hide keeps the app out of the launcher while still requiring authentication to open.</Text>
        </View>

        <FigmaBanner variant="dark" placement="native" title="Native advertisement" subtitle="Placed after functional content" tone="surfaceElevated" />

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav variant="dark" active="home" />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 8,
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
  addChip: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChipText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  emptyCard: {
    marginTop: 16,
    minHeight: 104,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyText: {
    fontSize: 10,
    lineHeight: 13,
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
  list: {
    gap: 12,
    marginTop: 16,
  },
  row: {
    borderWidth: 1,
    borderRadius: 24,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  actionPill: {
    minWidth: 60,
    minHeight: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  removePill: {
    marginLeft: 2,
  },
  actionText: {
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
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
