import React from 'react';
import {Alert, FlatList, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {nativeBridge} from '../../native';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {protectionManager} from '../../services/protection/ProtectionManager';
import {themeTokens} from '../../theme';
import type {AppProtection} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';
import {Screen} from '../../components/Screen';
import {PrimaryButton} from '../../components/PrimaryButton';
import {AppCard} from '../../components/AppCard';

export function VaultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const pendingPackageName = launchCoordinator.getPendingLaunchPackageName();
  const pendingMode = launchCoordinator.getPendingLaunchMode();

  const hiddenApps = React.useMemo(() => {
    return apps.filter(app => app.mode === 'HIDE' || app.mode === 'LOCK_HIDE');
  }, [apps]);

  const loadVault = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await protectionManager.listProtectedApps();
      setApps(next);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadVault();
  }, [loadVault]);

  const openPendingApp = React.useCallback(async () => {
    if (!pendingPackageName) {
      return;
    }

    if (pendingMode === 'LOCK_HIDE') {
      const result = await nativeBridge.authenticateBiometric();
      if (result !== 'success') {
        Alert.alert('Authentication required', 'Biometric verification did not complete.');
        return;
      }
    }

    try {
      const outcome = await launchCoordinator.completeAuthentication();
      if (outcome === 'app_launched') {
        navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
      }
    } catch (error) {
      Alert.alert('Unable to open app', error instanceof Error ? error.message : 'Failed to launch hidden app.');
    }
  }, [navigation, pendingMode, pendingPackageName]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Private Vault</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Hidden apps and private content live here after secret access and authentication.
        </Text>
      </View>

      {pendingPackageName ? (
        <View style={[styles.pendingCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.pendingTitle, {color: palette.textPrimary}]}>Pending access</Text>
          <Text style={[styles.pendingText, {color: palette.textSecondary}]}>
            {pendingPackageName}
            {pendingMode ? ` is waiting in ${pendingMode} mode.` : ' is waiting for vault access.'}
          </Text>
          <PrimaryButton
            label={pendingMode === 'LOCK_HIDE' ? 'Authenticate and open' : 'Open hidden app'}
            onPress={() => void openPendingApp()}
          />
        </View>
      ) : null}

      {loading ? (
        <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>Loading hidden apps...</Text>
      ) : hiddenApps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>No hidden apps yet</Text>
          <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>
            Add an app with HIDE or LOCK_HIDE protection to populate the vault.
          </Text>
        </View>
      ) : (
        <FlatList
          data={hiddenApps}
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
                  }
                }).catch(error => {
                  Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch hidden app.');
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
  pendingCard: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
  },
  pendingTitle: {
    fontSize: themeTokens.typography.body,
    fontWeight: '800',
  },
  pendingText: {
    fontSize: themeTokens.typography.body,
    lineHeight: 22,
  },
  list: {
    gap: themeTokens.spacing.sm,
    paddingBottom: themeTokens.spacing.lg,
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
