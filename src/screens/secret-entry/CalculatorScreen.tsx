import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {nativeBridge} from '../../native';
import {APP_UNLOCK_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';
import type {RootStackParamList} from '../../navigation/routes';

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export function CalculatorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const [value, setValue] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('Enter the calculator code to reveal the vault.');

  const appendDigit = React.useCallback((digit: string) => {
    setValue(current => (current.length < 6 ? `${current}${digit}` : current));
  }, []);

  const clearValue = React.useCallback(() => {
    setValue('');
    setMessage('Enter the calculator code to reveal the vault.');
  }, []);

  const submit = React.useCallback(async () => {
    if (!value) {
      setMessage('Enter a code first.');
      return;
    }

    setBusy(true);
    try {
      const verified = await nativeBridge.verifyCredential(APP_UNLOCK_CREDENTIAL_TYPE, value.trim());
      if (!verified) {
        setMessage('Code did not match. Try again.');
        setValue('');
        return;
      }

      await launchCoordinator.completeSecretEntry();
      navigation.reset({index: 0, routes: [{name: 'Vault'}]});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open the vault.');
      Alert.alert('Calculator failed', error instanceof Error ? error.message : 'Unable to open the vault.');
    } finally {
      setBusy(false);
    }
  }, [navigation, value]);

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>SECRET</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Calculator</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Use the calculator code to open the hidden vault.</Text>

        <View style={[styles.displayCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.displayLabel, {color: palette.textSecondary}]}>Code</Text>
          <Text style={[styles.displayValue, {color: palette.textPrimary}]}>{value || ' '}</Text>
          <Text style={[styles.displayMessage, {color: palette.textSecondary}]}>{message}</Text>
        </View>

        <View style={styles.keypad}>
          {keypad.map(digit => (
            <Pressable
              key={digit}
              onPress={() => appendDigit(digit)}
              style={({pressed}) => [styles.key, {backgroundColor: palette.surface, borderColor: palette.border, opacity: pressed ? 0.94 : 1}]}>
              <Text style={[styles.keyText, {color: palette.textPrimary}]}>{digit}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={clearValue} style={[styles.secondaryPill, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.secondaryText, {color: palette.textSecondary}]}>Clear</Text>
          </Pressable>
          <Pressable onPress={() => void submit()} style={[styles.secondaryPill, {backgroundColor: palette.accentSoft, borderColor: palette.accent}]}>
            <Text style={[styles.secondaryText, {color: palette.accent}]}>{busy ? 'Checking...' : 'Enter'}</Text>
          </Pressable>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="light" label="Back to secret entry" onPress={() => navigation.navigate('SecretEntry')} />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  stepPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
    letterSpacing: -0.1,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
  },
  displayCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  displayLabel: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  displayValue: {
    marginTop: 10,
    minHeight: 44,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  displayMessage: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 13,
  },
  keypad: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  key: {
    width: '31%',
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
