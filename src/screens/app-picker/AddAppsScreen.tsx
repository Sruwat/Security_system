import React from 'react';
import {Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {LaunchableApp} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

function appInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

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
      setSelectedPackageNames(current =>
        current.filter(packageName => available.some(app => app.packageName === packageName)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load installed apps.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const toggleSelection = React.useCallback((packageName: string) => {
    setSelectedPackageNames(current =>
      current.includes(packageName)
        ? current.filter(currentPackageName => currentPackageName !== packageName)
        : [...current, packageName],
    );
  }, []);

  const selectedApps = React.useMemo(
    () =>
      apps
        .filter(app => selectedPackageNames.includes(app.packageName))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [apps, selectedPackageNames],
  );

  const visibleApps = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? apps.filter(
          app =>
            app.label.toLowerCase().includes(normalizedQuery) ||
            app.packageName.toLowerCase().includes(normalizedQuery),
        )
      : apps;

    return [...filtered].sort((a, b) => {
      const aSelected = selectedPackageNames.includes(a.packageName) ? 0 : 1;
      const bSelected = selectedPackageNames.includes(b.packageName) ? 0 : 1;
      if (aSelected !== bSelected) {
        return aSelected - bSelected;
      }
      if (a.systemApp !== b.systemApp) {
        return a.systemApp ? 1 : -1;
      }
      return a.label.localeCompare(b.label);
    });
  }, [apps, query, selectedPackageNames]);

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

  const renderHeader = React.useCallback(
    () => (
      <View>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Select apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Scan your phone, choose the apps you want to protect, and continue in one simple flow.
        </Text>

        <View style={[styles.searchBar, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by app name"
            placeholderTextColor={palette.textSecondary}
            style={[styles.searchInput, {color: palette.textPrimary}]}
          />
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.metaValue, {color: palette.textPrimary}]}>
              {apps.length} installed app{apps.length === 1 ? '' : 's'}
            </Text>
            <Text style={[styles.metaLabel, {color: palette.textSecondary}]}>Ready to choose</Text>
          </View>
          <View style={[styles.metaCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
            <Text style={[styles.metaValue, {color: palette.accent}]}>
              {selectedPackageNames.length} selected
            </Text>
            <Text style={[styles.metaLabel, {color: palette.textSecondary}]}>Tap again to remove</Text>
          </View>
        </View>

        {selectedApps.length > 0 ? (
          <View style={[styles.selectedBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.selectedTitle, {color: palette.textPrimary}]}>Selected apps</Text>
            <View style={styles.selectedWrap}>
              {selectedApps.map(app => (
                <Pressable
                  key={app.packageName}
                  onPress={() => toggleSelection(app.packageName)}
                  style={[styles.selectedChip, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.selectedChipText, {color: palette.accent}]}>{app.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.helpCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.helpTitle, {color: palette.accent}]}>Easy to understand</Text>
          <Text style={[styles.helpText, {color: palette.textSecondary}]}>
            Choose any app here first. On normal Android phones, Hide is reliable inside this launcher flow, but other launchers may still show the app unless this app is set as the Home launcher.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Installed apps</Text>
      </View>
    ),
    [apps.length, palette, query, selectedApps, selectedPackageNames.length, toggleSelection],
  );

  const renderEmpty = React.useCallback(
    () => (
      <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
        <Text style={[styles.stateTitle, {color: palette.textPrimary}]}>
          {query.trim() ? 'No app matched your search' : 'No launchable apps found'}
        </Text>
        <Text style={[styles.stateText, {color: palette.textSecondary}]}>
          {query.trim()
            ? 'Try a shorter app name or clear the search.'
            : 'Check launcher setup and app discovery permissions, then try again.'}
        </Text>
      </View>
    ),
    [palette, query],
  );

  const renderItem = React.useCallback(
    ({item}: {item: LaunchableApp}) => {
      const isSelected = selectedPackageNames.includes(item.packageName);

      return (
        <Pressable
          onPress={() => toggleSelection(item.packageName)}
          style={({pressed}) => [
            styles.appRow,
            {
              borderColor: isSelected ? palette.accent : palette.border,
              backgroundColor: isSelected ? palette.accentSoft : palette.surface,
              opacity: pressed ? 0.94 : 1,
            },
          ]}>
          {item.iconUri ? (
            <Image source={{uri: item.iconUri}} style={styles.appArtwork} resizeMode="contain" />
          ) : (
            <View style={[styles.appIcon, {backgroundColor: isSelected ? palette.accent : palette.accentSoft}]}>
              <Text style={[styles.appIconText, {color: isSelected ? '#FFFFFF' : palette.accent}]}>
                {appInitials(item.label)}
              </Text>
            </View>
          )}
          <View style={styles.appBody}>
            <Text style={[styles.appName, {color: palette.textPrimary}]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.appMeta, {color: palette.textSecondary}]} numberOfLines={1}>
              {item.systemApp ? 'System app' : 'Installed app'} · {item.packageName}
            </Text>
          </View>
          <View style={[styles.statusPill, {backgroundColor: isSelected ? palette.accent : palette.accentSoft}]}>
            <Text style={[styles.statusText, {color: isSelected ? '#FFFFFF' : palette.accent}]}>
              {isSelected ? 'Selected' : 'Select'}
            </Text>
          </View>
        </Pressable>
      );
    },
    [palette, selectedPackageNames, toggleSelection],
  );

  return (
    <FigmaPage variant="light">
      <View style={styles.fill}>
        {loading ? (
          <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateTitle, {color: palette.textPrimary}]}>Scanning installed apps...</Text>
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Please wait a moment.</Text>
          </View>
        ) : error ? (
          <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateTitle, {color: palette.textPrimary}]}>Could not load apps</Text>
            <Text style={[styles.stateText, {color: '#D92D20'}]}>{error}</Text>
            <Pressable
              onPress={() => void loadApps()}
              style={[styles.retryButton, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.retryText, {color: palette.accent}]}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            style={styles.listView}
            data={visibleApps}
            keyExtractor={item => item.packageName}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            ItemSeparatorComponent={() => <View style={styles.rowGap} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
          />
        )}

        {!loading && !error ? <View style={styles.footerGap} /> : <View style={styles.spacer} />}

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
  listView: {
    flex: 1,
  },
  list: {
    paddingBottom: 12,
  },
  searchBar: {
    minHeight: 88,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 28,
  },
  searchInput: {
    fontSize: 17,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  metaCard: {
    flex: 1,
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  metaLabel: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
  },
  selectedBox: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  selectedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  selectedChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  helpCard: {
    marginTop: 18,
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  helpText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  appRow: {
    minHeight: 98,
    borderWidth: 1,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  appIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appArtwork: {
    width: 62,
    height: 62,
    borderRadius: 20,
  },
  appIconText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  appBody: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  appMeta: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
  },
  statusPill: {
    minWidth: 96,
    minHeight: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  rowGap: {
    height: 12,
  },
  stateBox: {
    marginTop: 24,
    minHeight: 128,
    borderRadius: 34,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 28,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
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
  footerGap: {
    height: 16,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
});
