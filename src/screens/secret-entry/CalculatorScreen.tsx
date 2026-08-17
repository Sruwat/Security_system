import React from 'react';
import {Alert, Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {nativeBridge} from '../../native';
import {VAULT_SECRET_CREDENTIAL_REF} from '../../services/security/credentialTypes';
import {secretAccessRouter} from '../../services/secret/SecretAccessRouter';
import type {RootStackParamList} from '../../navigation/routes';

const keypadRows = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', 'x'],
  ['1', '2', '3', '-'],
  ['C', '0', '=', '+'],
] as const;

function evaluateExpression(expression: string): string {
  const sanitized = expression.replace(/x/g, '*').replace(/[^0-9+\-*/.]/g, '');
  if (!sanitized) {
    return '0';
  }

  try {
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return 'Error';
    }
    return Number.isInteger(result) ? String(result) : result.toFixed(2).replace(/\.00$/, '');
  } catch {
    return 'Error';
  }
}

export function CalculatorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const {width, height} = useWindowDimensions();
  const [expression, setExpression] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('Use the calculator normally, or enter your secret code and press =.');

  const compactLayout = height < 760;
  const keypadGap = compactLayout ? 10 : 14;
  const horizontalPadding = 36;
  const keySize = Math.max(64, Math.min(84, (width - horizontalPadding * 2 - keypadGap * 3) / 4));

  const appendDigit = React.useCallback((digit: string) => {
    setExpression(current => `${current}${digit}`.slice(0, 24));
  }, []);

  const appendOperator = React.useCallback((operator: string) => {
    setExpression(current => {
      if (!current) {
        return current;
      }

      if (/[+\-x/]$/.test(current)) {
        return `${current.slice(0, -1)}${operator}`;
      }

      return `${current}${operator}`;
    });
  }, []);

  const clearValue = React.useCallback(() => {
    setExpression('');
    setMessage('Use the calculator normally, or enter your secret code and press =.');
  }, []);

  const submit = React.useCallback(async () => {
    if (!expression) {
      setMessage('Enter a calculation or secret code first.');
      return;
    }

    setBusy(true);
    try {
      const normalized = expression.trim();
      if (/^\d{4,6}$/.test(normalized)) {
        const verified = await nativeBridge.verifyCredential(VAULT_SECRET_CREDENTIAL_REF, normalized);
        if (verified) {
          const launchOutcome = await launchCoordinator.completeSecretEntry();
          if (launchOutcome === 'app_launched') {
            navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
            return;
          }
          if (launchOutcome === 'auth_required') {
            navigation.reset({index: 0, routes: [{name: 'AuthGate'}]});
            return;
          }

          const route = await secretAccessRouter.handleSecretAccess();
          if (route === 'auth_required') {
            navigation.reset({index: 0, routes: [{name: 'AuthGate'}]});
            return;
          }
          navigation.reset({index: 0, routes: [{name: 'Vault'}]});
          return;
        }

        setExpression(evaluateExpression(normalized));
        setMessage('Calculation complete.');
        return;
      }

      const result = evaluateExpression(normalized);
      setExpression(result === 'Error' ? '' : result);
      setMessage(result === 'Error' ? 'That calculation could not be completed.' : 'Calculation complete.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open the vault.');
      Alert.alert('Calculator failed', error instanceof Error ? error.message : 'Unable to open the vault.');
    } finally {
      setBusy(false);
    }
  }, [expression, navigation]);

  return (
    <FigmaPage variant="light">
      <View style={styles.screen}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>SECRET</Text>
          </View>
        </View>

        <Text style={[styles.title, compactLayout && styles.titleCompact, {color: palette.textPrimary}]}>Calculator</Text>
        <Text style={[styles.subtitle, compactLayout && styles.subtitleCompact, {color: palette.textSecondary}]}>
          Use the calculator code to open the hidden vault.
        </Text>

        <View style={[styles.displayCard, compactLayout && styles.displayCardCompact, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.displayLabel, {color: palette.textSecondary}]}>Code</Text>
          <Text style={[styles.displayValue, compactLayout && styles.displayValueCompact, {color: palette.textPrimary}]} numberOfLines={2}>
            {expression || '0'}
          </Text>
          <Text style={[styles.displayMessage, compactLayout && styles.displayMessageCompact, {color: palette.textSecondary}]}>{message}</Text>
        </View>

        <View style={styles.keypadWrap}>
          <View style={[styles.keypad, {gap: keypadGap}]}>
            {keypadRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={[styles.keyRow, {gap: keypadGap}]}>
                {row.map(key => {
                  const isOperator = ['+', '-', 'x', '/'].includes(key);
                  const isClear = key === 'C';
                  const isEquals = key === '=';
                  const onPress = () => {
                    if (isClear) {
                      clearValue();
                      return;
                    }
                    if (isEquals) {
                      void submit();
                      return;
                    }
                    if (isOperator) {
                      appendOperator(key);
                      return;
                    }
                    appendDigit(key);
                  };

                  return (
                    <Pressable
                      key={key}
                      onPress={onPress}
                      style={({pressed}) => [
                        styles.key,
                        {
                          width: keySize,
                          height: keySize,
                          backgroundColor: isOperator || isEquals ? palette.accentSoft : palette.surface,
                          borderColor: isOperator || isEquals ? palette.accent : palette.border,
                          opacity: pressed ? 0.94 : 1,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.keyText,
                          compactLayout && styles.keyTextCompact,
                          {color: isOperator || isEquals ? palette.accent : isClear ? palette.textSecondary : palette.textPrimary},
                        ]}>
                        {key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.statusBar, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.statusText, {color: palette.textSecondary}]}>
            {busy ? 'Checking secret code...' : 'Enter code, then press ='}
          </Text>
        </View>

        <View style={styles.footer}>
          <FigmaActionButton variant="light" label="Back to secret entry" onPress={() => navigation.navigate('SecretEntry')} />
        </View>
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    marginTop: 18,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  titleCompact: {
    marginTop: 14,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 17,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  displayCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  displayCardCompact: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  displayLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  displayValue: {
    marginTop: 8,
    minHeight: 44,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  displayValueCompact: {
    minHeight: 38,
    fontSize: 22,
  },
  displayMessage: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  displayMessageCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  keypadWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  keypad: {
    width: '100%',
    alignItems: 'center',
  },
  keyRow: {
    flexDirection: 'row',
  },
  key: {
    borderWidth: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  keyTextCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  statusBar: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 18,
    paddingBottom: 24,
  },
});
