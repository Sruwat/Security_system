import React from 'react';
import {ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {nativeBridge} from '../../native';
import {protectionManager} from '../../services/protection/ProtectionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {themeTokens} from '../../theme';
import type {AuthMethod, LaunchableApp, ProtectionMode} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';
import {Screen} from '../../components/Screen';
import {PrimaryButton} from '../../components/PrimaryButton';
import {buildProtectionPolicy} from './buildProtectionPolicy';

const protectionModes: ProtectionMode[] = ['LOCK', 'HIDE', 'LOCK_HIDE'];
const authMethods: AuthMethod[] = ['PIN', 'PASSWORD', 'PATTERN', 'BIOMETRIC', 'BIOMETRIC_FALLBACK'];

export function AddAppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [apps, setApps] = React.useState<LaunchableApp[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPackageName, setSelectedPackageName] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<ProtectionMode>('LOCK');
  const [authMethod, setAuthMethod] = React.useState<AuthMethod>('BIOMETRIC_FALLBACK');
  const [autoLockSeconds, setAutoLockSeconds] = React.useState('300');

  const selectedApp = React.useMemo(() => {
    return apps.find(app => app.packageName === selectedPackageName) ?? null;
  }, [apps, selectedPackageName]);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [discovered, settings] = await Promise.all([
        nativeBridge.getLaunchableApps(),
        localDataRepository.getSettings(),
      ]);
      setApps(discovered);
      setAutoLockSeconds(String(settings.autoLockSecondsDefault));
      setSelectedPackageName(current => {
        if (current && discovered.some(app => app.packageName === current)) {
          return current;
        }
        return discovered[0]?.packageName ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load installed apps.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const filteredApps = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return apps;
    }

    return apps.filter(app => {
      return app.label.toLowerCase().includes(needle) || app.packageName.toLowerCase().includes(needle);
    });
  }, [apps, query]);

  const persistSelection = React.useCallback(async () => {
    if (!selectedApp) {
      Alert.alert('Select an app', 'Choose an installed app first.');
      return;
    }

    const autoLock = Number.parseInt(autoLockSeconds, 10);
    if (!Number.isFinite(autoLock) || autoLock < 0) {
      Alert.alert('Invalid timer', 'Auto-lock must be a valid non-negative number of seconds.');
      return;
    }

    setSaving(true);
    try {
      await protectionManager.upsertProtection(
        buildProtectionPolicy({
          app: selectedApp,
          mode,
          authMethod,
          autoLockSeconds: autoLock,
        }),
      );
      navigation.navigate('PrivateHome');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unable to save protection.');
    } finally {
      setSaving(false);
    }
  }, [authMethod, autoLockSeconds, mode, navigation, selectedApp]);

  return (
    <Screen>
      <View style={[styles.heroCard, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
        <Text style={[styles.kicker, {color: palette.accent}]}>Installed apps</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Add Apps</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          Discover installed apps, choose a protection mode, and save a local policy for Private Apps Home.
        </Text>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps"
        placeholderTextColor={palette.textSecondary}
        style={[
          styles.search,
          {
            color: palette.textPrimary,
            backgroundColor: palette.surface,
            borderColor: palette.border,
          },
        ]}
      />

      <PrimaryButton label="Refresh apps" onPress={() => void loadApps()} variant="secondary" />

      <View style={[styles.policyCard, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
        <Text style={[styles.policyTitle, {color: palette.textPrimary}]}>
          {selectedApp ? selectedApp.label : 'Select an app to continue'}
        </Text>
        <Text style={[styles.policyMeta, {color: palette.textSecondary}]}>
          Choose protection mode, auth method, and auto-lock timer before saving the policy.
        </Text>

        <Text style={[styles.sectionLabel, {color: palette.textPrimary}]}>Protection mode</Text>
        <View style={styles.optionRow}>
          {protectionModes.map(nextMode => (
            <PrimaryButton
              key={nextMode}
              label={nextMode}
              onPress={() => setMode(nextMode)}
              variant={mode === nextMode ? 'primary' : 'secondary'}
              style={styles.optionButton}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, {color: palette.textPrimary}]}>Authentication</Text>
        <View style={styles.optionRow}>
          {authMethods.map(nextAuth => (
            <PrimaryButton
              key={nextAuth}
              label={nextAuth}
              onPress={() => setAuthMethod(nextAuth)}
              variant={authMethod === nextAuth ? 'primary' : 'secondary'}
              style={styles.optionButton}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, {color: palette.textPrimary}]}>Auto-lock seconds</Text>
        <TextInput
          value={autoLockSeconds}
          onChangeText={setAutoLockSeconds}
          keyboardType="number-pad"
          placeholder="300"
          placeholderTextColor={palette.textSecondary}
          style={[
            styles.timerInput,
            {
              color: palette.textPrimary,
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        />
      </View>

      {loading ? (
        <View style={[styles.stateCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <ActivityIndicator />
          <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading installed apps...</Text>
        </View>
      ) : error ? (
        <View style={[styles.stateCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.errorText, {color: palette.danger}]}>{error}</Text>
          <PrimaryButton label="Try again" onPress={() => void loadApps()} variant="secondary" />
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={[styles.stateCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.stateText, {color: palette.textSecondary}]}>No launchable apps matched your search.</Text>
            </View>
          }
          renderItem={({item}) => {
            const isSelected = item.packageName === selectedPackageName;
            return (
              <Pressable
                onPress={() => setSelectedPackageName(item.packageName)}
                style={[
                  styles.row,
                  {
                    backgroundColor: palette.surface,
                    borderColor: isSelected ? palette.accent : palette.border,
                  },
                ]}>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{item.label}</Text>
                  <Text style={[styles.rowMeta, {color: palette.textSecondary}]}>{item.packageName}</Text>
                  <Text style={[styles.rowMeta, {color: palette.textSecondary}]}>
                    {item.systemApp ? 'System app' : 'User app'}
                  </Text>
                </View>
                <Text style={[styles.selectedBadge, {color: isSelected ? palette.accent : palette.textSecondary}]}>
                  {isSelected ? 'Selected' : 'Tap to select'}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <View style={[styles.footer, {backgroundColor: palette.background, borderColor: palette.border}]}>
        <View style={styles.footerCopy}>
          <Text style={[styles.footerTitle, {color: palette.textPrimary}]}>
            {selectedApp ? selectedApp.label : 'Ready to save a policy'}
          </Text>
          <Text style={[styles.footerText, {color: palette.textSecondary}]}>
            {mode} protection with {authMethod} authentication.
          </Text>
        </View>
        <PrimaryButton
          label={saving ? 'Saving...' : 'Save protection'}
          onPress={() => void persistSelection()}
          style={styles.footerButton}
        />
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
  },
  kicker: {
    fontSize: themeTokens.typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: themeTokens.typography.title,
    fontWeight: '800',
  },
  description: {
    fontSize: themeTokens.typography.body,
    lineHeight: 24,
  },
  search: {
    minHeight: 48,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.md,
    fontSize: themeTokens.typography.body,
  },
  stateCard: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  stateRow: {
    gap: themeTokens.spacing.md,
    alignItems: 'flex-start',
  },
  stateText: {
    fontSize: themeTokens.typography.body,
  },
  errorText: {
    fontSize: themeTokens.typography.body,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: themeTokens.spacing.md,
  },
  separator: {
    height: themeTokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeTokens.spacing.md,
    borderWidth: 1,
    borderRadius: themeTokens.radius.lg,
    padding: themeTokens.spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: themeTokens.typography.body,
    fontWeight: '700',
  },
  rowMeta: {
    fontSize: themeTokens.typography.caption,
  },
  selectedBadge: {
    fontSize: themeTokens.typography.caption,
    fontWeight: '700',
  },
  policyCard: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
  },
  policyTitle: {
    fontSize: themeTokens.typography.body,
    fontWeight: '800',
  },
  policyMeta: {
    fontSize: themeTokens.typography.caption,
    lineHeight: 18,
  },
  sectionLabel: {
    marginTop: themeTokens.spacing.xs,
    fontSize: themeTokens.typography.caption,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
  },
  optionButton: {
    minWidth: 98,
  },
  timerInput: {
    minHeight: 48,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.md,
    fontSize: themeTokens.typography.body,
  },
  saveButton: {
    marginTop: themeTokens.spacing.sm,
  },
  footer: {
    gap: themeTokens.spacing.sm,
    paddingTop: themeTokens.spacing.sm,
    borderTopWidth: 1,
  },
  footerCopy: {
    gap: 4,
  },
  footerTitle: {
    fontSize: themeTokens.typography.body,
    fontWeight: '800',
  },
  footerText: {
    fontSize: themeTokens.typography.caption,
  },
  footerButton: {
    width: '100%',
  },
});
