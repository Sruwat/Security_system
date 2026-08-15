import React from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaBanner, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {LaunchableApp} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

function AddAppSummary(props: {label: string; value: string; palette: typeof figmaPalette.light}) {
  return (
    <View style={[styles.summaryCard, {backgroundColor: props.palette.surface, borderColor: props.palette.border}]}>
      <Text style={[styles.summaryLabel, {color: props.palette.textSecondary}]}>{props.label}</Text>
      <Text style={[styles.summaryValue, {color: props.palette.textPrimary}]}>{props.value}</Text>
    </View>
  );
}

export function AddAppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const [apps, setApps] = React.useState<LaunchableApp[]>([]);
  const [selectedPackageName, setSelectedPackageName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const discovered = await nativeBridge.getLaunchableApps();
      setApps(discovered);
      setSelectedPackageName(current => current ?? discovered[0]?.packageName ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load installed apps.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const visibleApps = apps.slice(0, 6);
  const selectedCount = visibleApps.filter(app => app.packageName === selectedPackageName).length;

  const continueNext = React.useCallback(async () => {
    const selected = apps.find(app => app.packageName === selectedPackageName);
    if (!selected) {
      Alert.alert('Select an app', 'Choose an installed app first.');
      return;
    }

    setSaving(true);
    try {
      const settings = await localDataRepository.getSettings();
      navigation.navigate('ProtectionMode', {
        draft: {
          app: selected,
          mode: 'LOCK_HIDE',
          authMethod: 'BIOMETRIC_FALLBACK',
          autoLockSeconds: settings.autoLockSecondsDefault,
        },
        onboarding: !settings.onboardingComplete,
      });
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unable to save protection.');
    } finally {
      setSaving(false);
    }
  }, [apps, navigation, selectedPackageName]);

  return (
    <FigmaPage variant="light">
      <View style={styles.fill}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Select apps</Text>
          </View>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>2 of 4</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Choose the apps you want to keep private. You can change this later in Manage Apps.</Text>

        <View style={styles.summaryRow}>
          <AddAppSummary label="Installed shown" value={`${visibleApps.length}`} palette={palette} />
          <AddAppSummary label="Selected" value={`${Math.max(selectedCount, 1)}`} palette={palette} />
        </View>

        <View style={[styles.searchBar, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.searchText, {color: palette.textSecondary}]}>Search installed apps</Text>
        </View>

        {loading ? (
          <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading installed apps...</Text>
          </View>
        ) : error ? (
          <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateText, {color: '#D92D20'}]}>{error}</Text>
            <Pressable onPress={() => void loadApps()} style={[styles.retryButton, {borderColor: palette.border, backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.retryText, {color: palette.accent}]}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={visibleApps}
            keyExtractor={item => item.packageName}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={({item}) => {
              const isSelected = item.packageName === selectedPackageName;
              const label = isSelected ? 'Selected' : 'Add';
              const icon = item.label.slice(0, 2).toUpperCase();

              return (
                <Pressable
                  onPress={() => setSelectedPackageName(current => (current === item.packageName ? null : item.packageName))}
                  style={({pressed}) => [
                    styles.appRow,
                    {
                      borderColor: isSelected ? palette.accent : palette.border,
                      backgroundColor: isSelected ? palette.accentSoft : palette.surface,
                      opacity: pressed ? 0.94 : 1,
                    },
                  ]}>
                  <View style={[styles.appIcon, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.appIconText, {color: palette.accent}]}>{icon}</Text>
                  </View>
                  <View style={styles.appBody}>
                    <Text style={[styles.appName, {color: palette.textPrimary}]}>{item.label}</Text>
                    <Text style={[styles.appMeta, {color: palette.textSecondary}]}>{item.systemApp ? 'System app' : 'User app'}</Text>
                  </View>
                  <View style={[styles.statusPill, {backgroundColor: isSelected ? palette.accent : palette.accentSoft}]}>
                    <Text style={[styles.statusText, {color: isSelected ? '#FFFFFF' : palette.accent}]}>{label}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}

        <FigmaBanner variant="light" placement="native" title="Native advertisement" subtitle="Placed after functional content" tone="surfaceElevated" />

        <View style={styles.spacer} />

        <FigmaActionButton
          variant="light"
          label={saving ? 'Saving...' : `Continue with ${Math.max(selectedCount, 1)} app${Math.max(selectedCount, 1) === 1 ? '' : 's'}`}
          onPress={() => void continueNext()}
        />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
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
  stepPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  searchBar: {
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchText: {
    fontSize: 10,
    lineHeight: 12,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  appRow: {
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  appIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  appBody: {
    flex: 1,
  },
  appName: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  appMeta: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 10,
  },
  statusPill: {
    minWidth: 66,
    minHeight: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
  },
  stateBox: {
    marginTop: 14,
    minHeight: 86,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  stateText: {
    fontSize: 10,
    lineHeight: 13,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 8,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
    minHeight: 4,
  },
});
