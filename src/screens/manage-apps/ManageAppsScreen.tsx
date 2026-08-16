import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
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

function describeMode(mode: ProtectionMode): string {
  return mode === 'LOCK_HIDE' ? 'Lock + Hide' : mode === 'LOCK' ? 'Lock' : mode === 'HIDE' ? 'Hide' : 'Open';
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

  useFocusEffect(
    React.useCallback(() => {
      void loadApps();
    }, [loadApps]),
  );

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
      navigation.navigate('RemoveApp', {
        app: {
          packageName: app.packageName,
          label: app.label,
          mode: app.mode,
        },
      });
    },
    [navigation],
  );

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Manage Apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Change, add or remove apps.</Text>

        <FigmaBanner screen="manage-apps" variant="dark" title="Banner ad" tone="surfaceElevated" />

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
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{app.label}</Text>
                  <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>{describeMode(app.mode)}</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable onPress={() => void updateMode(app)} style={[styles.actionPill, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.actionText, {color: palette.accent}]}>
                      {busyPackage === app.packageName ? 'Updating...' : 'Change'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => void removeProtection(app)} style={[styles.actionPill, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.actionText, {color: palette.accent}]}>
                      {busyPackage === app.packageName ? 'Removing...' : 'Remove'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable onPress={() => navigation.navigate('AddApps')} style={[styles.addMoreRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.addMoreText, {color: palette.textPrimary}]}>+ Add more apps</Text>
            </Pressable>
          </View>
        )}

        <FigmaBanner
          screen="manage-apps"
          variant="dark"
          placement="native"
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
    paddingBottom: 8,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    marginTop: 28,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
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
    marginTop: 36,
  },
  row: {
    borderWidth: 1,
    borderRadius: 34,
    minHeight: 140,
    paddingHorizontal: 30,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  rowSubtitle: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPill: {
    minWidth: 112,
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  addMoreRow: {
    borderWidth: 1,
    borderRadius: 34,
    minHeight: 98,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  addMoreText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 10,
  },
});
