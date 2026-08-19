import React from 'react';
import {Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {LaunchableApp, ProtectionMode} from '../../types/domain';

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
  const route = useRoute<RouteProp<RootStackParamList, 'AddApps'>>();
  const palette = figmaPalette.dark;
  const [apps, setApps] = React.useState<LaunchableApp[]>([]);
  const [selectedPackageNames, setSelectedPackageNames] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const presetMode: ProtectionMode = route.params?.preset ?? 'LOCK_HIDE';

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
    void localDataRepository.setOnboardingResumeRoute('AddApps');
    void loadApps();
  }, [loadApps]);

  const toggleSelection = React.useCallback((packageName: string) => {
    setSelectedPackageNames(current =>
      current.includes(packageName) ? current.filter(currentPackageName => currentPackageName !== packageName) : [...current, packageName],
    );
  }, []);

  const selectedApps = React.useMemo(
    () => apps.filter(app => selectedPackageNames.includes(app.packageName)).sort((a, b) => a.label.localeCompare(b.label)),
    [apps, selectedPackageNames],
  );

  const visibleApps = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? apps.filter(app => app.label.toLowerCase().includes(normalizedQuery) || app.packageName.toLowerCase().includes(normalizedQuery))
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
      if (!settings.onboardingComplete) {
        await localDataRepository.setOnboardingResumeRoute('ProtectionMode');
      }
      navigation.navigate('ProtectionMode', {
        draft: {
          app: selected[0],
          apps: selected,
          mode: presetMode,
          authMethod: settings.defaultLockType ?? 'PIN',
          autoLockSeconds: settings.autoLockSecondsDefault,
        },
        onboarding: !settings.onboardingComplete,
      });
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unable to save protection.');
    } finally {
      setSaving(false);
    }
  }, [apps, navigation, presetMode, selectedPackageNames]);

  const headline = presetMode === 'HIDE' ? 'Hide Apps' : presetMode === 'LOCK' ? 'App Lock' : 'Hide + Lock';
  const helperCopy =
    presetMode === 'HIDE'
      ? 'Choose apps that should disappear from your managed launcher and stay in Hidden Apps.'
      : presetMode === 'LOCK'
        ? 'Choose apps that should stay visible but require authentication before opening.'
        : 'Choose apps that should stay hidden and require authentication before access.';

  const renderHeader = React.useCallback(
    () => (
      <View>
        <View style={styles.progressRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, presetMode === 'HIDE' ? styles.progressFillHide : presetMode === 'LOCK' ? styles.progressFillLock : styles.progressFillCombined]} />
          </View>
          <Text style={styles.progressLabel}>{presetMode === 'HIDE' ? 'Step 4 of 5' : 'Step 2 of 4'}</Text>
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIconShell, presetMode === 'HIDE' ? styles.heroHide : presetMode === 'LOCK' ? styles.heroLock : styles.heroCombined]}>
            <Text style={styles.heroIcon}>{presetMode === 'HIDE' ? '🙈' : presetMode === 'LOCK' ? '🔒' : '🛡️'}</Text>
          </View>
          <Text style={[styles.pageTitle, {color: palette.textPrimary}]}>
            {presetMode === 'HIDE' ? 'Select Apps to Hide' : presetMode === 'LOCK' ? 'Select Apps to Lock' : 'Select Apps to Hide + Lock'}
          </Text>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>{helperCopy}</Text>

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
            <Text style={[styles.metaValue, {color: palette.accent}]}>{selectedPackageNames.length} selected</Text>
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
          <Text style={[styles.helpTitle, {color: palette.accent}]}>
            {presetMode === 'HIDE' ? 'Hidden apps stay in Vault' : presetMode === 'LOCK' ? 'Lock uses your saved credential' : 'Both protections are applied together'}
          </Text>
          <Text style={[styles.helpText, {color: palette.textSecondary}]}>
            Hide works inside this managed launcher experience. Lock protection continues through the app-auth flow after you save protection.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Installed apps</Text>
      </View>
    ),
    [apps.length, helperCopy, palette, query, selectedApps, selectedPackageNames.length, toggleSelection],
  );

  const renderEmpty = React.useCallback(
    () => (
      <View style={[styles.stateBox, {backgroundColor: palette.surface, borderColor: palette.border}]}>
        <Text style={[styles.stateTitle, {color: palette.textPrimary}]}>
          {query.trim() ? 'No app matched your search' : 'No launchable apps found'}
        </Text>
        <Text style={[styles.stateText, {color: palette.textSecondary}]}>
          {query.trim() ? 'Try a shorter app name or clear the search.' : 'Check launcher setup and app discovery permissions, then try again.'}
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
              <Text style={[styles.appIconText, {color: isSelected ? '#FFFFFF' : palette.accent}]}>{appInitials(item.label)}</Text>
            </View>
          )}
          <View style={styles.appBody}>
            <Text style={[styles.appName, {color: palette.textPrimary}]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.appMeta, {color: palette.textSecondary}]} numberOfLines={1}>
              {item.systemApp ? 'System app' : 'Installed app'} {'|'} {item.packageName}
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
    <FigmaPage variant="dark" style={styles.page}>
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
            <Pressable onPress={() => void loadApps()} style={[styles.retryButton, {backgroundColor: palette.accentSoft}]}>
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
          variant="dark"
          label={saving ? 'Saving...' : `Continue with ${selectedPackageNames.length} app${selectedPackageNames.length === 1 ? '' : 's'}`}
          onPress={() => void continueNext()}
        />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#091124',
  },
  fill: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#233876',
    backgroundColor: '#101C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#1E2B4B',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillHide: {
    width: '24%',
    backgroundColor: '#2563EB',
  },
  progressFillLock: {
    width: '28%',
    backgroundColor: '#EF4444',
  },
  progressFillCombined: {
    width: '36%',
    backgroundColor: '#8B5CF6',
  },
  progressLabel: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconShell: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHide: {
    borderColor: '#2563EB',
    backgroundColor: '#0F1E3C',
  },
  heroLock: {
    borderColor: '#7F1D1D',
    backgroundColor: '#2A0E0E',
  },
  heroCombined: {
    borderColor: '#7C3AED',
    backgroundColor: '#1C1634',
  },
  heroIcon: {
    fontSize: 30,
  },
  pageTitle: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  listView: {
    flex: 1,
  },
  list: {
    paddingBottom: 12,
  },
  searchBar: {
    minHeight: 72,
    borderRadius: 24,
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
    borderRadius: 24,
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
