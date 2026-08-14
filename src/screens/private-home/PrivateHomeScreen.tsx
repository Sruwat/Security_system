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
      <View style={styles.header}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Private Apps Home</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Selected protected apps, Gallery, Add Apps, Manage Apps, and Settings.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Add Apps" onPress={() => navigation.navigate('AddApps')} />
        <PrimaryButton label="Manage Apps" onPress={() => navigation.navigate('ManageApps')} variant="secondary" />
        <PrimaryButton label="Settings" onPress={() => navigation.navigate('Settings')} variant="secondary" />
      </View>

      {loading ? (
        <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>Loading protected apps...</Text>
      ) : apps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>No protected apps yet</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>
            Add your first app to start building a private app space.
          </Text>
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
