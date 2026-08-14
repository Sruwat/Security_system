import React from 'react';
import {Alert, FlatList, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppCard} from '../../components/AppCard';
import {PrimaryButton} from '../../components/PrimaryButton';
import {Screen} from '../../components/Screen';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {themeTokens} from '../../theme';
import type {AppProtection} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const protectedCount = apps.length;

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await localDataRepository.getProtectedApps();
      setApps(next);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  return (
    <Screen>
      <View style={[styles.heroCard, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={[styles.kicker, {color: palette.accent}]}>Protected space</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Private Apps Home</Text>
            <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
              Discover, lock, hide, and open protected apps from a single controlled surface.
            </Text>
          </View>
          <View style={[styles.countBubble, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.countValue, {color: palette.accent}]}>{protectedCount}</Text>
            <Text style={[styles.countLabel, {color: palette.textSecondary}]}>protected</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Add Apps" onPress={() => navigation.navigate('AddApps')} />
          <PrimaryButton label="Manage Apps" onPress={() => navigation.navigate('ManageApps')} variant="secondary" />
          <PrimaryButton label="Gallery" onPress={() => navigation.navigate('Gallery')} variant="secondary" />
          <PrimaryButton label="Settings" onPress={() => navigation.navigate('Settings')} variant="secondary" />
        </View>
      </View>

      {loading ? (
        <View style={[styles.emptyState, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>Loading protected apps...</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>Preparing your private launcher surface.</Text>
        </View>
      ) : apps.length === 0 ? (
        <View style={[styles.emptyState, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>No protected apps yet</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>
            Add your first app to start building a private app space.
          </Text>
          <PrimaryButton label="Add your first app" onPress={() => navigation.navigate('AddApps')} />
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <AppCard
              app={item}
              onPress={() => {
                void launchCoordinator.launch(item.packageName).then(result => {
                  if (result === 'auth_required') {
                    navigation.navigate('AuthGate');
                    return;
                  }

                  if (result === 'secret_required') {
                    navigation.navigate('SecretEntry');
                    return;
                  }
                }).catch(error => {
                  Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch app.');
                });
              }}
            />
          )}
        />
      )}
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
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: themeTokens.spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: themeTokens.spacing.sm,
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
  subtitle: {
    fontSize: themeTokens.typography.body,
    lineHeight: 22,
  },
  countBubble: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: themeTokens.radius.lg,
    paddingVertical: themeTokens.spacing.md,
    paddingHorizontal: themeTokens.spacing.sm,
  },
  countValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  countLabel: {
    fontSize: themeTokens.typography.caption,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
  },
  list: {
    gap: themeTokens.spacing.sm,
    paddingBottom: themeTokens.spacing.xl,
  },
  emptyState: {
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    gap: themeTokens.spacing.sm,
  },
  emptyTitle: {
    fontSize: themeTokens.typography.headline,
    fontWeight: '700',
  },
  emptyBody: {
    marginTop: themeTokens.spacing.xs,
    fontSize: themeTokens.typography.body,
    lineHeight: 22,
  },
});
