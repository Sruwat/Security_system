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
import {VAULT_SECRET_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';

export function SecretEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [secret, setSecret] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submitSecret = React.useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      if (!secret.trim()) {
        Alert.alert('Secret required', 'Enter the secret code or gesture label before continuing.');
        return;
      }

      const verified = await nativeBridge.verifyCredential(VAULT_SECRET_CREDENTIAL_TYPE, secret.trim());
      if (!verified) {
        Alert.alert('Secret mismatch', 'The vault secret did not match the stored value.');
        return;
      }

      await launchCoordinator.completeSecretEntry();
      navigation.replace('Vault');
    } catch (error) {
      Alert.alert('Secret entry failed', error instanceof Error ? error.message : 'Unable to open the vault.');
    } finally {
      setLoading(false);
    }
  }, [loading, navigation, secret]);

  return (
    <Screen>
      <View style={[styles.heroCard, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
        <Text style={[styles.kicker, {color: palette.accent}]}>Hidden access</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Secret Entry</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          Enter the secret code to unlock the vault and continue through the protected-launch path.
        </Text>

        <View style={[styles.hintCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.hintTitle, {color: palette.textPrimary}]}>Accepted paths</Text>
          <Text style={[styles.hintBody, {color: palette.textSecondary}]}>
            Vault access stays local. Secret entry, biometric verification, and session reuse all resolve on-device.
          </Text>
        </View>

        <TextInput
          value={secret}
          onChangeText={setSecret}
          placeholder="Secret code"
          placeholderTextColor={palette.textSecondary}
          secureTextEntry
          returnKeyType="done"
          blurOnSubmit
          autoFocus
          onSubmitEditing={() => void submitSecret()}
          style={[
            styles.input,
            {
              color: palette.textPrimary,
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        />

        <PrimaryButton label={loading ? 'Opening...' : 'Open Vault'} onPress={() => void submitSecret()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 'auto',
    marginBottom: 'auto',
    gap: themeTokens.spacing.md,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
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
  description: {
    fontSize: themeTokens.typography.body,
    lineHeight: 24,
  },
  hintCard: {
    gap: themeTokens.spacing.xs,
    padding: themeTokens.spacing.md,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
  },
  hintTitle: {
    fontSize: themeTokens.typography.body,
    fontWeight: '800',
  },
  hintBody: {
    fontSize: themeTokens.typography.caption,
    lineHeight: 18,
  },
  input: {
    minHeight: 48,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.md,
    fontSize: themeTokens.typography.body,
  },
});
