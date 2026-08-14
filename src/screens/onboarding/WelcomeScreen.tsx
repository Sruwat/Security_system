import React from 'react';
import {Alert, StyleSheet, Text, TextInput, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {PrimaryButton} from '../../components/PrimaryButton';
import {Screen} from '../../components/Screen';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {themeTokens} from '../../theme';
import type {RootStackParamList} from '../../navigation/routes';
import {APP_UNLOCK_CREDENTIAL_TYPE, VAULT_SECRET_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [secretCode, setSecretCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const completeSetup = React.useCallback(async () => {
    if (loading) {
      return;
    }

    const trimmedPin = pin.trim();
    const trimmedConfirm = confirmPin.trim();
    const trimmedSecret = secretCode.trim();
    if (trimmedPin.length < 4) {
      Alert.alert('PIN required', 'Choose a PIN with at least 4 digits.');
      return;
    }
    if (trimmedPin !== trimmedConfirm) {
      Alert.alert('PIN mismatch', 'Confirm the same PIN to continue.');
      return;
    }
    if (trimmedSecret.length < 4) {
      Alert.alert('Secret required', 'Choose a vault secret code with at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      await nativeBridge.createCredential(APP_UNLOCK_CREDENTIAL_TYPE, trimmedPin);
      await nativeBridge.createCredential(VAULT_SECRET_CREDENTIAL_TYPE, trimmedSecret);
      await localDataRepository.setOnboardingComplete(true);
      navigation.reset({
        index: 0,
        routes: [{name: 'AuthGate'}],
      });
    } catch (error) {
      Alert.alert('Setup failed', error instanceof Error ? error.message : 'Unable to complete setup.');
    } finally {
      setLoading(false);
    }
  }, [confirmPin, loading, navigation, pin, secretCode]);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Welcome</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          Set up your app unlock PIN and vault secret before entering the protected launcher.
        </Text>

        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="App unlock PIN"
          placeholderTextColor={palette.textSecondary}
          secureTextEntry
          keyboardType="number-pad"
          returnKeyType="next"
          autoFocus
          style={[styles.input, {color: palette.textPrimary, backgroundColor: palette.surface, borderColor: palette.border}]}
        />
        <TextInput
          value={confirmPin}
          onChangeText={setConfirmPin}
          placeholder="Confirm PIN"
          placeholderTextColor={palette.textSecondary}
          secureTextEntry
          keyboardType="number-pad"
          returnKeyType="next"
          style={[styles.input, {color: palette.textPrimary, backgroundColor: palette.surface, borderColor: palette.border}]}
        />
        <TextInput
          value={secretCode}
          onChangeText={setSecretCode}
          placeholder="Vault secret code"
          placeholderTextColor={palette.textSecondary}
          secureTextEntry
          returnKeyType="done"
          style={[styles.input, {color: palette.textPrimary, backgroundColor: palette.surface, borderColor: palette.border}]}
        />

        <PrimaryButton label={loading ? 'Saving setup...' : 'Start setup'} onPress={() => void completeSetup()} />
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
  input: {
    minHeight: 48,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.md,
    fontSize: themeTokens.typography.body,
  },
});
