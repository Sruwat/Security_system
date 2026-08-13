import React from 'react';
import {FlatList, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {AppCard} from '../../components/AppCard';
import {PrimaryButton} from '../../components/PrimaryButton';
import {Screen} from '../../components/Screen';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {themeTokens} from '../../theme';
import type {AppProtection} from '../../types/domain';

export function PrivateHomeScreen() {
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
        <Text style={[styles.title, {color: palette.textPrimary}]}>Private Apps Home</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Selected protected apps, Gallery, Add Apps, Manage Apps, and Settings.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Add Apps" onPress={() => undefined} />
        <PrimaryButton label="Manage Apps" onPress={() => undefined} variant="secondary" />
      </View>

      {apps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>No protected apps yet</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>Add your first app to start building a private app space.</Text>
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
  actions: {
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
  },
  list: {
    gap: themeTokens.spacing.sm,
    paddingBottom: themeTokens.spacing.xl,
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
});
