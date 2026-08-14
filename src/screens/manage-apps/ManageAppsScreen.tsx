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
      setBusyPackage(app.packageName);
      try {
        await protectionManager.removeProtection(app.packageName);
        await loadApps();
      } catch (error) {
        Alert.alert('Remove failed', error instanceof Error ? error.message : 'Unable to remove protection.');
      } finally {
        setBusyPackage(null);
      }
    },
    [loadApps],
  );

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Manage Apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Change, add or remove apps.</Text>

        <FigmaBanner variant="dark" title="Banner ad" tone="surfaceElevated" />

        {loading ? (
          <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Loading managed apps...</Text>
          </View>
        ) : apps.length === 0 ? (
          <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Nothing to manage yet</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {apps.map(app => (
              <View key={app.packageName} style={[styles.row, {backgroundColor: palette.surface, borderColor: palette.border}]}>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{app.label}</Text>
                  <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>{app.mode === 'LOCK_HIDE' ? 'Lock + Hide' : app.mode}</Text>
                </View>
                <Pressable onPress={() => void updateMode(app)} style={styles.actionPill}>
                  <Text style={[styles.actionText, {color: palette.accent}]}>
                    {busyPackage === app.packageName ? 'Updating...' : 'Change'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void removeProtection(app)} style={styles.actionPill}>
                  <Text style={[styles.actionText, {color: palette.accent}]}>
                    {busyPackage === app.packageName ? 'Removing...' : 'Remove'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={() => navigation.navigate('AddApps')} style={[styles.addRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.addText, {color: palette.textPrimary}]}>+ Add more apps</Text>
        </Pressable>

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
  emptyCard: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  emptyText: {
    fontSize: 10,
  },
  list: {
    gap: 12,
    marginTop: 18,
  },
  row: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  rowSubtitle: {
    marginTop: 6,
    fontSize: 8,
    lineHeight: 10,
  },
  actionPill: {
    minWidth: 54,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#211A3A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  addRow: {
    marginTop: 14,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 17,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  addText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  bottomSpacer: {
    height: 16,
  },
});
