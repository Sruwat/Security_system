import React from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {LaunchableApp} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

export function AddAppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const [apps, setApps] = React.useState<LaunchableApp[]>([]);
  const [selectedPackageNames, setSelectedPackageNames] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const discovered = await nativeBridge.getLaunchableApps();
      const protectedApps = await localDataRepository.getProtectedApps();
      const protectedPackages = new Set(protectedApps.map(app => app.packageName));
      const available = discovered.filter(app => !protectedPackages.has(app.packageName));
      setApps(available);
      setSelectedPackageNames(current => current.filter(packageName => available.some(app => app.packageName === packageName)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load installed apps.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const visibleApps = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return apps.slice(0, 5);
    }

    return apps.filter(app => app.label.toLowerCase().includes(normalizedQuery)).slice(0, 5);
  }, [apps, query]);

  const selectedApps = React.useMemo(
    () => visibleApps.filter(app => selectedPackageNames.includes(app.packageName)),
    [selectedPackageNames, visibleApps],
  );

  const continueNext = React.useCallback(async () => {
    const selected = apps.filter(app => selectedPackageNames.includes(app.packageName));
    if (selected.length === 0) {
      Alert.alert('Select an app', 'Choose at least one installed app first.');
      return;
    }

    setSaving(true);
    try {
      const settings = await localDataRepository.getSettings();
      navigation.navigate('ProtectionMode', {
        draft: {
          app: selected[0],
          apps: selected,
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
  }, [apps, navigation, selectedPackageNames]);

  return (
    <FigmaPage variant="light">
      <View style={styles.fill}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Select apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Choose apps to protect.</Text>

        <View style={[styles.searchBar, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search installed apps"
            placeholderTextColor={palette.textSecondary}
            style={[styles.searchInput, {color: palette.textPrimary}]}
          />
        </View>

        {loading ? (
          <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading installed apps...</Text>
          </View>
        ) : error ? (
          <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateText, {color: '#D92D20'}]}>{error}</Text>
            <Pressable onPress={() => void loadApps()} style={[styles.retryButton, {backgroundColor: palette.accentSoft}]}>
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
              const isSelected = selectedPackageNames.includes(item.packageName);
              const label = isSelected ? 'Selected' : 'Add';

              return (
                <Pressable
                  onPress={() =>
                    setSelectedPackageNames(current =>
                      current.includes(item.packageName)
                        ? current.filter(packageName => packageName !== item.packageName)
                        : [...current, item.packageName],
                    )
                  }
                  style={({pressed}) => [
                    styles.appRow,
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.surface,
                      opacity: pressed ? 0.94 : 1,
                    },
                  ]}>
                  <View style={[styles.appIcon, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.appIconText, {color: palette.accent}]}>{item.label.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={styles.appBody}>
                    <Text style={[styles.appName, {color: palette.textPrimary}]}>{item.label}</Text>
                  </View>
                  <View style={[styles.statusPill, {backgroundColor: palette.accentSoft}]}>
                    <Text style={[styles.statusText, {color: palette.accent}]}>{label}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}

        <View style={styles.spacer} />

        <FigmaActionButton
          variant="light"
          label={saving ? 'Saving...' : `Continue with ${selectedPackageNames.length} app${selectedPackageNames.length === 1 ? '' : 's'}`}
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
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    marginTop: 28,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  searchBar: {
    minHeight: 84,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 76,
  },
  searchInput: {
    fontSize: 16,
    lineHeight: 22,
  },
  list: {
    marginTop: 40,
    gap: 18,
  },
  appRow: {
    minHeight: 102,
    borderWidth: 1,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 18,
  },
  appIcon: {
    width: 74,
    height: 74,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  appBody: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  statusPill: {
    minWidth: 138,
    minHeight: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  stateBox: {
    marginTop: 40,
    minHeight: 120,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
    minHeight: 12,
  },
});
