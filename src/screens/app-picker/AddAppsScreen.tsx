import React from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaHeader, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {buildProtectionPolicy} from './buildProtectionPolicy';
import {protectionManager} from '../../services/protection/ProtectionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {LaunchableApp} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

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

  const visibleApps = apps.slice(0, 5);
  const selectedCount = visibleApps.filter(app => app.packageName === selectedPackageName).length;

  const continueNext = React.useCallback(async () => {
    const selected = apps.find(app => app.packageName === selectedPackageName);
    if (!selected) {
      Alert.alert('Select an app', 'Choose an installed app first.');
      return;
    }

    setSaving(true);
    try {
      await protectionManager.upsertProtection(
        buildProtectionPolicy({
          app: selected,
          mode: 'LOCK_HIDE',
          authMethod: 'BIOMETRIC_FALLBACK',
          autoLockSeconds: 300,
        }),
      );
      navigation.navigate('ProtectionMode');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unable to save protection.');
    } finally {
      setSaving(false);
    }
  }, [apps, navigation, selectedPackageName]);

  return (
    <FigmaPage variant="light">
      <View style={styles.fill}>
        <FigmaHeader variant="light" title="Select apps" subtitle="Choose apps to protect." />

        <View style={styles.searchBar}>
          <Text style={[styles.searchText, {color: palette.textSecondary}]}>⌕  Search installed apps</Text>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading installed apps...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, {color: '#D92D20'}]}>{error}</Text>
            <Pressable onPress={() => void loadApps()} style={[styles.retryButton, {borderColor: palette.border}]}>
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
                  onPress={() => setSelectedPackageName(item.packageName)}
                  style={({pressed}) => [styles.appRow, {borderColor: isSelected ? palette.accentSoft : palette.border, opacity: pressed ? 0.94 : 1}]}>
                  <View style={styles.appIcon}>
                    <Text style={[styles.appIconText, {color: palette.accent}]}>{icon}</Text>
                  </View>
                  <Text style={[styles.appName, {color: palette.textPrimary}]}>{item.label}</Text>
                  <View style={[styles.statusPill, {backgroundColor: isSelected ? palette.accentSoft : '#F1EEFF'}]}>
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
          label={saving ? 'Saving...' : `Continue with ${Math.max(selectedCount, 1)} apps`}
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
  searchBar: {
    minHeight: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 20,
  },
  searchText: {
    fontSize: 9,
    lineHeight: 11,
  },
  list: {
    marginTop: 18,
    gap: 12,
  },
  appRow: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#F1EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  appName: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
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
    fontWeight: '700',
    lineHeight: 10,
  },
  stateBox: {
    marginTop: 18,
    minHeight: 60,
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 10,
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
  },
});
