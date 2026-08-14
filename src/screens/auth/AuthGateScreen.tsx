import React from 'react';
import {Alert, StyleSheet, Text, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {nativeBridge} from '../../native';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {themeTokens} from '../../theme';
import type {RootStackParamList} from '../../navigation/routes';
import {Screen} from '../../components/Screen';
import {PrimaryButton} from '../../components/PrimaryButton';

export function AuthGateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'fail' | 'unavailable'>('idle');
  const promptAttemptedRef = React.useRef(false);
  const pendingLaunchPackageName = launchCoordinator.getPendingLaunchPackageName();

  const authenticate = React.useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const result = await nativeBridge.authenticateBiometric();
      if (result !== 'success') {
        setStatus(result);
        return;
      }

      const outcome = await launchCoordinator.completeAuthentication();
      setStatus('success');

      if (outcome === 'vault_unlocked' || outcome === 'app_launched') {
        navigation.reset({
          index: 0,
          routes: [{name: 'PrivateHome'}],
        });
      }
    } catch (error) {
      setStatus('fail');
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  }, [loading, navigation]);

  React.useEffect(() => {
    if (!promptAttemptedRef.current) {
      promptAttemptedRef.current = true;
      void authenticate();
    }
  }, [authenticate]);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Unlock Private Apps</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          {pendingLaunchPackageName
            ? `Authenticate to open ${pendingLaunchPackageName}.`
            : 'Authenticate to return to Private Apps Home.'}
        </Text>

        {status === 'unavailable' ? (
          <Text style={[styles.message, {color: palette.danger}]}>Biometric authentication is unavailable on this device.</Text>
        ) : status === 'fail' ? (
          <Text style={[styles.message, {color: palette.danger}]}>Authentication did not complete. Try again.</Text>
        ) : status === 'success' ? (
          <Text style={[styles.message, {color: palette.accent}]}>Authentication succeeded.</Text>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label={loading ? 'Authenticating...' : 'Authenticate'} onPress={() => void authenticate()} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: themeTokens.spacing.md,
  },
  title: {
    fontSize: themeTokens.typography.title,
    fontWeight: '800',
  },
  description: {
    fontSize: themeTokens.typography.body,
    lineHeight: 24,
  },
  message: {
    fontSize: themeTokens.typography.body,
    fontWeight: '600',
  },
  actions: {
    gap: themeTokens.spacing.sm,
    marginTop: themeTokens.spacing.sm,
  },
});
