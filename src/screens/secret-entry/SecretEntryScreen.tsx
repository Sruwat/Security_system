import React from 'react';
import {Alert, StyleSheet, Text, TextInput, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {themeTokens} from '../../theme';
import type {RootStackParamList} from '../../navigation/routes';
import {Screen} from '../../components/Screen';
import {PrimaryButton} from '../../components/PrimaryButton';

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
      <View style={styles.hero}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Secret Entry</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          Enter the secret code or use the configured gesture path to reveal the vault.
        </Text>

        <TextInput
          value={secret}
          onChangeText={setSecret}
          placeholder="Secret code"
          placeholderTextColor={palette.textSecondary}
          secureTextEntry
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
