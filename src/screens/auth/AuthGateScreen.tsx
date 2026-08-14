import React from 'react';
import {Alert, StyleSheet, Text, TextInput, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {nativeBridge} from '../../native';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {themeTokens} from '../../theme';
import type {RootStackParamList} from '../../navigation/routes';
import {Screen} from '../../components/Screen';
import {PrimaryButton} from '../../components/PrimaryButton';
import {APP_UNLOCK_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';

export function AuthGateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'fail' | 'unavailable'>('idle');
  const [pin, setPin] = React.useState('');
  const [pinLoading, setPinLoading] = React.useState(false);
  const promptAttemptedRef = React.useRef(false);
  const pendingLaunchPackageName = launchCoordinator.getPendingLaunchPackageName();

  const completeAuthentication = React.useCallback(
    async (method: 'biometric' | 'pin', pinValue?: string) => {
      if (method === 'pin') {
        const candidate = (pinValue ?? '').trim();
        if (!candidate) {
          Alert.alert('PIN required', 'Enter your app unlock PIN to continue.');
          return;
        }

        setPinLoading(true);
        try {
          const verified = await nativeBridge.verifyCredential(APP_UNLOCK_CREDENTIAL_TYPE, candidate);
          if (!verified) {
            setStatus('fail');
            Alert.alert('PIN mismatch', 'The PIN did not match the stored credential.');
            return;
          }
        } catch (error) {
          setStatus('fail');
          Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to verify the PIN.');
          return;
        } finally {
          setPinLoading(false);
        }
      }

      const outcome = await launchCoordinator.completeAuthentication();
      setStatus('success');

      navigation.reset({
        index: 0,
        routes: [{name: 'PrivateHome'}],
      });

      return outcome;
    },
    [navigation],
  );

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

      await completeAuthentication('biometric');
    } catch (error) {
      setStatus('fail');
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  }, [completeAuthentication, loading]);

  const submitPin = React.useCallback(async () => {
    if (pinLoading) {
      return;
    }

    await completeAuthentication('pin', pin);
  }, [completeAuthentication, pin, pinLoading]);

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

        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="App unlock PIN"
          placeholderTextColor={palette.textSecondary}
          secureTextEntry
          keyboardType="number-pad"
          style={[
            styles.input,
            {
              color: palette.textPrimary,
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        />

        <View style={styles.actions}>
          <PrimaryButton label={loading ? 'Authenticating...' : 'Authenticate'} onPress={() => void authenticate()} />
          <PrimaryButton label={pinLoading ? 'Checking PIN...' : 'Use PIN'} onPress={() => void submitPin()} variant="secondary" />
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
  input: {
    minHeight: 48,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.md,
    fontSize: themeTokens.typography.body,
  },
  actions: {
    gap: themeTokens.spacing.sm,
    marginTop: themeTokens.spacing.sm,
  },
});
