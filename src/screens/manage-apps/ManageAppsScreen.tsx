import React from 'react';
import {FlatList, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {PrimaryButton} from '../../components/PrimaryButton';
import {Screen} from '../../components/Screen';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {themeTokens} from '../../theme';
import type {AppProtection} from '../../types/domain';
import {AppCard} from '../../components/AppCard';

export function ManageAppsScreen() {
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];

  React.useEffect(() => {
    let mounted = true;
    localDataRepository.getProtectedApps().then(next => {
      if (mounted) {
        setApps(next);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Manage Apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Change protection, authentication, timers, or remove protection.</Text>
      </View>

      <PrimaryButton label="Refresh" onPress={() => undefined} variant="secondary" />

      {apps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>Nothing to manage yet</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>Add an app first, then you can update protection modes and timers here.</Text>
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.list}
          renderItem={({item}) => <AppCard app={item} />}
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
  subtitle: {
    fontSize: themeTokens.typography.body,
    lineHeight: 22,
  },
  empty: {
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    backgroundColor: themeTokens.colors.light.surface,
  },
  emptyTitle: {
    fontSize: themeTokens.typography.body,
    fontWeight: '700',
  },
  emptyBody: {
    marginTop: themeTokens.spacing.xs,
    fontSize: themeTokens.typography.body,
    lineHeight: 22,
  },
  list: {
    gap: themeTokens.spacing.sm,
    paddingBottom: themeTokens.spacing.xl,
  },
});
