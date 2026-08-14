import React from 'react';
import {ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, View, useColorScheme} from 'react-native';
import {nativeBridge} from '../../native';
import type {LaunchableApp} from '../../types/domain';
import {themeTokens} from '../../theme';
import {Screen} from '../../components/Screen';
import {PrimaryButton} from '../../components/PrimaryButton';

export function AddAppsScreen() {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [apps, setApps] = React.useState<LaunchableApp[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const discovered = await nativeBridge.getLaunchableApps();
      setApps(discovered);
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

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Add Apps</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          Discover installed launchable apps and choose which ones to protect.
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

      <PrimaryButton label="Refresh apps" onPress={() => void loadApps()} />

      {loading ? (
        <View style={styles.stateRow}>
          <ActivityIndicator />
          <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading installed apps...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateRow}>
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
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>No launchable apps matched your search.</Text>
          }
          renderItem={({item}) => (
            <View style={[styles.row, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{item.label}</Text>
                <Text style={[styles.rowMeta, {color: palette.textSecondary}]}>{item.packageName}</Text>
                <Text style={[styles.rowMeta, {color: palette.textSecondary}]}>
                  {item.systemApp ? 'System app' : 'User app'}
                </Text>
              </View>
              <PrimaryButton
                label="Open"
                onPress={() => {
                  void nativeBridge.launchApp(item.packageName).catch(err => {
                    Alert.alert('Launch failed', err instanceof Error ? err.message : 'Unable to launch app.');
                  });
                }}
                variant="secondary"
                style={styles.launchButton}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: themeTokens.spacing.sm,
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
    paddingBottom: themeTokens.spacing.lg,
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
  launchButton: {
    minWidth: 88,
  },
});
