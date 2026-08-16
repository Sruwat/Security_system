import React from 'react';
import {Alert, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {nativeBridge} from '../../native';
import {sessionManager} from '../../services/session/SessionManager';
import type {RootStackParamList} from '../../navigation/routes';
import {APP_UNLOCK_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {PrimaryAuthMethod} from '../../types/domain';

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

function UnlockGlyph() {
  return (
    <View style={styles.unlockShell}>
      <View style={styles.unlockOrb} />
      <View style={styles.unlockCard}>
        <View style={styles.unlockShackle} />
        <View style={styles.unlockBody}>
          <View style={styles.unlockKeyhole} />
        </View>
      </View>
    </View>
  );
}

export function AuthGateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {width, height} = useWindowDimensions();
  const [pin, setPin] = React.useState('');
  const [manualValue, setManualValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const [cooldownUntil, setCooldownUntil] = React.useState<number | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [primaryAuthMethod, setPrimaryAuthMethod] = React.useState<PrimaryAuthMethod>('PIN');
  const promptAttemptedRef = React.useRef(false);
  const pendingLaunchPackageName = launchCoordinator.getPendingLaunchPackageName();
  const pendingLaunchMode = launchCoordinator.getPendingLaunchMode();
  const pendingLaunchLabel = pendingLaunchMode === 'LOCK_HIDE' ? 'Protected app' : pendingLaunchPackageName ?? 'Private space';
  const activeSession = sessionManager.getState();
  const sessionExpired = Boolean(activeSession && activeSession.expiresAt <= Date.now());
  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;
  const credentialLabel = primaryAuthMethod === 'PASSWORD' ? 'password' : primaryAuthMethod === 'PATTERN' ? 'pattern' : '4-digit PIN';
  const compactLayout = height < 800;
  const keypadGap = compactLayout ? 10 : 14;
  const keypadHorizontalInset = compactLayout ? 48 : 42;
  const keySize = Math.max(62, Math.min(78, (width - keypadHorizontalInset * 2 - keypadGap * 2) / 3));

  const verifyPin = React.useCallback(async (pinValue: string) => {
    const verified = await nativeBridge.verifyCredential(APP_UNLOCK_CREDENTIAL_TYPE, pinValue.trim());
    if (!verified) {
      throw new Error(primaryAuthMethod === 'PASSWORD' ? 'The password did not match the stored credential.' : primaryAuthMethod === 'PATTERN' ? 'The pattern did not match the stored credential.' : 'The PIN did not match the stored credential.');
    }
  }, [primaryAuthMethod]);

  const finishAuthentication = React.useCallback(
    async (pinValue?: string) => {
      if (pinValue) {
        await verifyPin(pinValue);
      }

      const outcome = await launchCoordinator.completeAuthentication();
      if (outcome === 'app_launched' || outcome === 'vault_unlocked') {
        setPin('');
        setStatusMessage(null);
        navigation.navigate('UnlockSuccess');
      }
    },
    [navigation, verifyPin],
  );

  const authenticate = React.useCallback(async () => {
    if (loading) {
      return;
    }

    if (cooldownUntil && cooldownUntil > Date.now()) {
      setStatusMessage(`Cooldown active for ${Math.ceil((cooldownUntil - Date.now()) / 1000)} seconds.`);
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await nativeBridge.authenticateBiometric();
      if (result === 'unavailable') {
        setStatusMessage('Biometric unavailable. Use the PIN fallback.');
        return;
      }
      if (result !== 'success') {
        setStatusMessage('Biometric changed or verification failed.');
        return;
      }

      await finishAuthentication();
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  }, [cooldownUntil, finishAuthentication, loading]);

  const submitDigit = React.useCallback(
    (digit: string) => {
      const next = `${pin}${digit}`.slice(0, 4);
      setPin(next);
      if (next.length === 4) {
        void finishAuthentication(next).catch(error => {
          const nextAttempts = attempts + 1;
          setAttempts(nextAttempts);
          setStatusMessage('Wrong PIN. Try again.');
          if (nextAttempts >= 3) {
            setCooldownUntil(Date.now() + 30000);
            setStatusMessage('Recovery required. Cooldown started for 30 seconds.');
          }
          Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to verify the PIN.');
          setPin('');
        });
      }
    },
    [attempts, finishAuthentication, pin],
  );

  React.useEffect(() => {
    if (!promptAttemptedRef.current) {
      promptAttemptedRef.current = true;
      void authenticate();
    }
  }, [authenticate]);

  React.useEffect(() => {
    void localDataRepository.getSettings().then(settings => {
      setPrimaryAuthMethod(settings.primaryAuthMethod);
    });
  }, []);

  const submitManualCredential = React.useCallback(() => {
    if (cooldownRemaining > 0) {
      return;
    }

    void finishAuthentication(manualValue).catch(error => {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setStatusMessage(primaryAuthMethod === 'PASSWORD' ? 'Wrong password. Try again.' : primaryAuthMethod === 'PATTERN' ? 'Wrong pattern. Try again.' : 'Wrong PIN. Try again.');
      if (nextAttempts >= 3) {
        setCooldownUntil(Date.now() + 30000);
        setStatusMessage('Recovery required. Cooldown started for 30 seconds.');
      }
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to verify the credential.');
      setManualValue('');
      setPin('');
    });
  }, [attempts, cooldownRemaining, finishAuthentication, manualValue, primaryAuthMethod]);

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <View style={styles.headerRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.statePill, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Secure session</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Unlock access</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          {pendingLaunchPackageName ? `Continue to ${pendingLaunchLabel}` : 'Authenticate to continue.'}
        </Text>

        {sessionExpired ? (
          <View style={[styles.contextCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <View style={styles.contextBody}>
              <Text style={[styles.contextLabel, {color: palette.textPrimary}]}>Session expired</Text>
              <Text style={[styles.contextHint, {color: palette.textSecondary}]}>The previous temporary access is no longer valid. Authenticate again.</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.contextCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.contextIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.contextIconText, {color: palette.accent}]}>AP</Text>
          </View>
          <View style={styles.contextBody}>
            <Text style={[styles.contextLabel, {color: palette.textPrimary}]}>
              {pendingLaunchLabel}
            </Text>
            <Text style={[styles.contextHint, {color: palette.textSecondary}]}>Biometric or PIN required</Text>
          </View>
        </View>

        <View style={styles.centerArea}>
          <UnlockGlyph />
          <Text style={[styles.instruction, {color: palette.textSecondary}]}>Use Face ID, fingerprint, or your {credentialLabel}.</Text>
          {statusMessage ? <Text style={[styles.errorLine, {color: '#FECACA'}]}>{statusMessage}</Text> : null}
          {cooldownRemaining > 0 ? <Text style={[styles.errorLine, {color: '#FECACA'}]}>Cooldown {cooldownRemaining}s remaining</Text> : null}
        </View>

        {primaryAuthMethod === 'PIN' ? (
          <>
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3].map(index => (
                <View key={index} style={[styles.dot, {backgroundColor: pin.length > index ? palette.accent : palette.accentSoft}]} />
              ))}
            </View>

            <View style={styles.keypadWrap}>
              <View style={[styles.keypad, {gap: keypadGap}]}>
                {keypadRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={[styles.keyRow, {gap: keypadGap}]}>
                    {row.map(value => (
                      <Pressable
                        key={value}
                        onPress={() => {
                          if (cooldownRemaining > 0) {
                            return;
                          }
                          submitDigit(value);
                        }}
                        style={[
                          styles.key,
                          {
                            width: keySize,
                            height: compactLayout ? 58 : 64,
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                            opacity: cooldownRemaining > 0 ? 0.5 : 1,
                          },
                        ]}>
                        <Text style={[styles.keyText, compactLayout && styles.keyTextCompact, {color: palette.textPrimary}]}>{value}</Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.manualCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.manualLabel, {color: palette.textSecondary}]}>
              {primaryAuthMethod === 'PASSWORD' ? 'Password' : 'Pattern'}
            </Text>
            <TextInput
              value={manualValue}
              onChangeText={setManualValue}
              editable={cooldownRemaining === 0}
              secureTextEntry={primaryAuthMethod === 'PASSWORD'}
              placeholder={primaryAuthMethod === 'PASSWORD' ? 'Enter password' : 'Example: 1-2-3-4'}
              placeholderTextColor={palette.textSecondary}
              style={[styles.manualInput, {color: palette.textPrimary}]}
            />
            <Pressable onPress={submitManualCredential} style={[styles.manualSubmit, {backgroundColor: palette.accent}]}>
              <Text style={styles.manualSubmitText}>{loading ? 'Checking...' : 'Submit'}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.footerRow}>
          <Pressable
            onPress={() => {
              setPin('');
              setManualValue('');
            }}
            style={[styles.footerPill, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.footerText, {color: palette.textSecondary}]}>Clear</Text>
          </Pressable>
          <Pressable onPress={() => void authenticate()} style={[styles.footerPill, styles.primaryPill, {backgroundColor: palette.accent}]}>
            <Text style={[styles.footerText, {color: '#FFFFFF'}]}>{loading ? 'Checking...' : 'Use biometrics'}</Text>
          </Pressable>
        </View>
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  statePill: {
    minHeight: 30,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  stateText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  title: {
    marginTop: 28,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  contextCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contextIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextIconText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  contextBody: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  contextHint: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 11,
  },
  centerArea: {
    marginTop: 30,
    alignItems: 'center',
  },
  unlockShell: {
    width: 202,
    height: 202,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockOrb: {
    position: 'absolute',
    width: 202,
    height: 202,
    borderRadius: 101,
    backgroundColor: '#171F2F',
  },
  unlockCard: {
    width: 80,
    alignItems: 'center',
  },
  unlockShackle: {
    width: 34,
    height: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#A78BFA',
    marginBottom: -1,
  },
  unlockBody: {
    width: 72,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockKeyhole: {
    width: 13,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  instruction: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  errorLine: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  dotsRow: {
    marginTop: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  keypad: {
    width: '100%',
    alignItems: 'center',
  },
  keypadWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  keyRow: {
    flexDirection: 'row',
  },
  key: {
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  keyTextCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
  footerRow: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 12,
  },
  manualCard: {
    marginTop: 22,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  manualLabel: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  manualInput: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#111827',
    fontSize: 14,
    lineHeight: 18,
  },
  manualSubmit: {
    minHeight: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualSubmitText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  footerPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPill: {
    borderColor: 'transparent',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
