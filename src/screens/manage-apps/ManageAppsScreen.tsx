import React from 'react';
import {Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBanner, FigmaInnerLayout, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {protectionManager} from '../../services/protection/ProtectionManager';
import type {AppProtection, ProtectionMode} from '../../types/domain';
import {describeProtection, normalizeProtection, protectionFlagsFromMode, protectionModeFromFlags} from '../../services/protection/protectionState';

function describeMode(mode: ProtectionMode): string {
  return mode === 'LOCK_HIDE' ? 'Lock + Hide' : mode === 'LOCK' ? 'Lock' : mode === 'HIDE' ? 'Hide' : 'Open';
}

export function ManageAppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyPackage, setBusyPackage] = React.useState<string | null>(null);
  const [selectedApp, setSelectedApp] = React.useState<AppProtection | null>(null);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      setApps((await localDataRepository.getProtectedApps()).map(normalizeProtection).filter(app => app.enabled));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadApps();
    }, [loadApps]),
  );

  const saveFlags = React.useCallback(
    async (app: AppProtection, nextMode: ProtectionMode) => {
      setBusyPackage(app.packageName);
      try {
        const nextFlags = protectionFlagsFromMode(nextMode);
        if (nextMode === 'NONE') {
          await protectionManager.removeProtection(app.packageName);
        } else {
          await protectionManager.upsertProtection(
            normalizeProtection({
              ...app,
              ...nextFlags,
              enabled: true,
              mode: nextMode,
              updatedAt: Date.now(),
            }),
          );
        }
        await loadApps();
        setSelectedApp(current => (current?.packageName === app.packageName ? normalizeProtection({...app, ...nextFlags, enabled: nextMode !== 'NONE', mode: nextMode}) : current));
      } catch (error) {
        Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to change protection mode.');
      } finally {
        setBusyPackage(null);
      }
    },
    [loadApps],
  );

  const toggleHide = React.useCallback(
    async (app: AppProtection) => {
      const currentMode = app.mode ?? protectionModeFromFlags(app);
      const nextMode: ProtectionMode =
        currentMode === 'LOCK_HIDE' ? 'LOCK' : currentMode === 'HIDE' ? 'NONE' : currentMode === 'LOCK' ? 'LOCK_HIDE' : 'HIDE';
      await saveFlags(app, nextMode);
    },
    [saveFlags],
  );

  const toggleLock = React.useCallback(
    async (app: AppProtection) => {
      const currentMode = app.mode ?? protectionModeFromFlags(app);
      const nextMode: ProtectionMode =
        currentMode === 'LOCK_HIDE' ? 'HIDE' : currentMode === 'LOCK' ? 'NONE' : currentMode === 'HIDE' ? 'LOCK_HIDE' : 'LOCK';
      await saveFlags(app, nextMode);
    },
    [saveFlags],
  );

  const openChangeLock = React.useCallback(
    (app: AppProtection) => {
      navigation.navigate('ProtectionMode', {
        draft: {
          app: {
            packageName: app.packageName,
            label: app.label,
            iconUri: app.iconUri,
            systemApp: false,
          },
          mode: app.mode ?? protectionModeFromFlags(app),
          authMethod: app.lockType ?? app.authMethod ?? 'PIN',
          autoLockSeconds: app.autoLockSeconds ?? 30,
          triggerType: app.triggerType,
        },
        onboarding: false,
        flow: app.isHidden && app.isLocked ? 'LOCK_HIDE' : app.isHidden ? 'APP_HIDE' : 'APP_LOCK',
      });
    },
    [navigation],
  );

  const removeProtection = React.useCallback(
    async (app: AppProtection) => {
      setSelectedApp(null);
      navigation.navigate('RemoveApp', {
        app: {
          packageName: app.packageName,
          label: app.label,
          mode: app.mode ?? protectionModeFromFlags(app),
        },
      });
    },
    [navigation],
  );

  return (
    <FigmaInnerLayout variant="dark" title="Manage Apps" onBackPress={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Review every protected app in one place and keep the same Hide, Lock, or Lock + Hide flow consistent.</Text>

        <FigmaBanner screen="manage-apps" variant="dark" title="Banner ad" tone="surfaceElevated" />

        {loading ? (
          <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Loading managed apps...</Text>
          </View>
        ) : apps.length === 0 ? (
            <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Nothing to manage yet</Text>
              <Pressable onPress={() => navigation.navigate('AddApps', {preset: 'LOCK_HIDE', flow: 'LOCK_HIDE'})} style={[styles.emptyButton, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.emptyButtonText, {color: palette.accent}]}>Start protection</Text>
              </Pressable>
            </View>
        ) : (
          <View style={styles.list}>
            {apps.map(app => (
              <View key={app.packageName} style={[styles.row, {backgroundColor: palette.surface, borderColor: palette.border}]}>
                <Pressable onPress={() => setSelectedApp(app)} style={({pressed}) => [styles.rowHeader, {opacity: pressed ? 0.94 : 1}]}>
                  {app.iconUri ? (
                    <Image source={{uri: app.iconUri}} style={styles.appArtwork} resizeMode="contain" />
                  ) : (
                    <View style={[styles.appIconFallback, {backgroundColor: palette.accentSoft}]}>
                      <Text style={[styles.appIconText, {color: palette.accent}]}>
                        {app.label
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(part => part[0]?.toUpperCase() ?? '')
                          .join('')
                          .slice(0, 2)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.rowBody}>
                    <Text style={[styles.rowTitle, {color: palette.textPrimary}]} numberOfLines={2}>
                      {app.label}
                    </Text>
                    <Text style={[styles.rowPackage, {color: palette.textSecondary}]} numberOfLines={1}>
                      {app.packageName}
                    </Text>
                    <View style={styles.modeRow}>
                      <View style={[styles.modePill, {backgroundColor: palette.accentSoft}]}>
                        <Text style={[styles.modeText, {color: palette.accent}]}>{describeProtection(normalizeProtection(app))}</Text>
                      </View>
                      <View style={[styles.modePill, {backgroundColor: palette.surfaceElevated}]}>
                        <Text style={[styles.modeText, {color: palette.textPrimary}]}>{describeMode(app.mode ?? protectionModeFromFlags(app))}</Text>
                      </View>
                      <View style={[styles.modePill, {backgroundColor: palette.surfaceElevated}]}>
                        <Text style={[styles.modeText, {color: palette.textSecondary}]}>Tap to manage</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>
            ))}

            <Pressable onPress={() => navigation.navigate('AddApps', {preset: 'LOCK_HIDE', flow: 'LOCK_HIDE'})} style={[styles.addMoreRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.addMoreText, {color: palette.textPrimary}]}>+ Protect more apps</Text>
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
      </ScrollView>

      <Modal visible={selectedApp !== null} transparent animationType="fade" onRequestClose={() => setSelectedApp(null)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetScrim} onPress={() => setSelectedApp(null)} />
          {selectedApp ? (
            <View style={[styles.sheetCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.sheetTitle, {color: palette.textPrimary}]} numberOfLines={1}>
                {selectedApp.label}
              </Text>
              <Text style={[styles.sheetSubtitle, {color: palette.textSecondary}]}>
                {describeProtection(normalizeProtection(selectedApp))} • {describeMode(selectedApp.mode ?? protectionModeFromFlags(selectedApp))}
              </Text>

                <View style={styles.sheetActions}>
                    <Pressable
                      onPress={() => {
                        setSelectedApp(null);
                        navigation.navigate('PrivateHome');
                      }}
                      style={[styles.sheetAction, {backgroundColor: palette.accentSoft}]}>
                      <Text style={[styles.sheetActionText, {color: palette.accent}]}>Open from Launcher</Text>
                    </Pressable>
                <Pressable onPress={() => void toggleHide(selectedApp)} style={[styles.sheetAction, {backgroundColor: selectedApp.isHidden ? palette.accentSoft : palette.surfaceElevated}]}>
                  <Text style={[styles.sheetActionText, {color: palette.accent}]}>
                    {busyPackage === selectedApp.packageName ? 'Saving...' : selectedApp.isHidden ? 'Hide OFF' : 'Hide ON'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void toggleLock(selectedApp)} style={[styles.sheetAction, {backgroundColor: selectedApp.isLocked ? palette.accentSoft : palette.surfaceElevated}]}>
                  <Text style={[styles.sheetActionText, {color: palette.accent}]}>
                    {busyPackage === selectedApp.packageName ? 'Saving...' : selectedApp.isLocked ? 'Lock OFF' : 'Lock ON'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectedApp(null);
                    openChangeLock(selectedApp);
                  }}
                  style={[styles.sheetAction, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.sheetActionText, {color: palette.accent}]}>Change Lock</Text>
                </Pressable>
                <Pressable onPress={() => void removeProtection(selectedApp)} style={[styles.sheetAction, {backgroundColor: '#2B1320'}]}>
                  <Text style={[styles.sheetActionText, {color: '#FCA5A5'}]}>Remove Protection</Text>
                </Pressable>
                <Pressable onPress={() => setSelectedApp(null)} style={[styles.sheetAction, {backgroundColor: palette.surfaceElevated}]}>
                  <Text style={[styles.sheetActionText, {color: palette.textPrimary}]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </FigmaInnerLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 8,
  },
  subtitle: {
    marginTop: 6,
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
    minHeight: 132,
    paddingHorizontal: 30,
    paddingVertical: 24,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  appArtwork: {
    width: 62,
    height: 62,
    borderRadius: 20,
  },
  appIconFallback: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  rowPackage: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
  },
  modePill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  modeRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5, 10, 20, 0.32)',
  },
  sheetScrim: {
    flex: 1,
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  sheetSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  sheetActions: {
    marginTop: 18,
    gap: 10,
  },
  sheetAction: {
    minHeight: 54,
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  sheetActionText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
});
