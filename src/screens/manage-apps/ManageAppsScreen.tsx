import React from 'react';
import {Alert, FlatList, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppCard} from '../../components/AppCard';
import {PrimaryButton} from '../../components/PrimaryButton';
import {Screen} from '../../components/Screen';
import {protectionManager} from '../../services/protection/ProtectionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {themeTokens} from '../../theme';
import type {AppProtection, ProtectionMode} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

const protectionModes: ProtectionMode[] = ['LOCK', 'HIDE', 'LOCK_HIDE', 'NONE'];

function cycleMode(mode: ProtectionMode): ProtectionMode {
  const index = protectionModes.indexOf(mode);
  return protectionModes[(index + 1) % protectionModes.length];
}

export function ManageAppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyPackage, setBusyPackage] = React.useState<string | null>(null);
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      setApps(await localDataRepository.getProtectedApps());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const updateMode = React.useCallback(
    async (app: AppProtection) => {
      setBusyPackage(app.packageName);
      try {
        const nextMode = cycleMode(app.mode);
        await protectionManager.upsertProtection({...app, mode: nextMode, updatedAt: Date.now()});
        await loadApps();
      } catch (error) {
        Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to change protection mode.');
      } finally {
        setBusyPackage(null);
      }
    },
    [loadApps],
  );

  const removeProtection = React.useCallback(
    async (app: AppProtection) => {
      setBusyPackage(app.packageName);
      try {
        await protectionManager.removeProtection(app.packageName);
        await loadApps();
      } catch (error) {
        Alert.alert('Remove failed', error instanceof Error ? error.message : 'Unable to remove protection.');
      } finally {
        setBusyPackage(null);
      }
    },
    [loadApps],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Manage Apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Change protection, authentication, timers, or remove protection.
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <PrimaryButton
          label={loading ? 'Refreshing...' : 'Refresh'}
          onPress={() => void loadApps()}
          variant="secondary"
        />
        <PrimaryButton label="Back home" onPress={() => navigation.navigate('PrivateHome')} variant="secondary" />
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>Loading managed apps...</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>
            Rebuilding your local protection list.
          </Text>
        </View>
      ) : apps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>Nothing to manage yet</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>
            Add an app first, then you can update protection modes and timers here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.list}
          renderItem={({item}) => (
            <View style={[styles.cardWrap, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <AppCard app={item} />
              <View style={styles.cardActions}>
                <PrimaryButton
                  label={busyPackage === item.packageName ? 'Updating...' : `Mode: ${item.mode}`}
                  onPress={() => void updateMode(item)}
                  variant="secondary"
                  style={styles.actionButton}
                />
                <PrimaryButton
                  label={busyPackage === item.packageName ? 'Removing...' : 'Remove protection'}
                  onPress={() => void removeProtection(item)}
                  variant="danger"
                  style={styles.actionButton}
                />
              </View>
              <Text style={[styles.cardMeta, {color: palette.textSecondary}]}>
                Auth: {item.authMethod} - Auto-lock {item.autoLockSeconds}s
              </Text>
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
  subtitle: {
    fontSize: themeTokens.typography.body,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
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
  cardWrap: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.sm,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
  },
  cardMeta: {
    fontSize: themeTokens.typography.caption,
  },
});
