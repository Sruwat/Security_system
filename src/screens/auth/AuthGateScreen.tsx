import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {PatternGrid, formatPatternValue} from '../../components/PatternGrid';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {nativeBridge} from '../../native';
import {sessionManager} from '../../services/session/SessionManager';
import type {RootStackParamList} from '../../navigation/routes';
import {APP_UNLOCK_CREDENTIAL_REF} from '../../services/security/credentialTypes';
import {protectionManager} from '../../services/protection/ProtectionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, AuthMethod, PrimaryAuthMethod} from '../../types/domain';

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['Clear', '0', 'Continue'],
] as const;

function resolveAuthMethod(lockType: AuthMethod | undefined, fallback: PrimaryAuthMethod): PrimaryAuthMethod {
  switch (lockType) {
    case 'PASSWORD':
      return 'PASSWORD';
    case 'PATTERN':
      return 'PATTERN';
    case 'BIOMETRIC':
    case 'BIOMETRIC_FALLBACK':
    case 'PIN':
    default:
      return 'PIN';
  }
}

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
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const [pin, setPin] = React.useState('');
  const [manualValue, setManualValue] = React.useState('');
  const [patternValues, setPatternValues] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const [cooldownUntil, setCooldownUntil] = React.useState<number | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [settingsAuthMethod, setSettingsAuthMethod] = React.useState<PrimaryAuthMethod>('PIN');
  const [pendingLabel, setPendingLabel] = React.useState<string>('Private space');
  const [pendingLaunchPackageName, setPendingLaunchPackageName] = React.useState<string | null>(() =>
    launchCoordinator.getPendingLaunchPackageName(),
  );
  const activeSession = sessionManager.getState();
  const sessionExpired = Boolean(activeSession && activeSession.expiresAt <= Date.now());
  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;
  const compactLayout = height < 1200;
  const ultraCompactLayout = height < 900;
  const keypadGap = ultraCompactLayout ? 8 : compactLayout ? 10 : 14;
  const keypadHorizontalInset = ultraCompactLayout ? 24 : compactLayout ? 30 : 42;
  const keySize = Math.max(54, Math.min(76, (width - keypadHorizontalInset * 2 - keypadGap * 2) / 3));
  const [pendingProtection, setPendingProtection] = React.useState<AppProtection | null>(null);
  const activeAuthMethod = resolveAuthMethod(
    pendingProtection?.lockType ?? pendingProtection?.authMethod,
    settingsAuthMethod,
  );
  const credentialLabel =
    activeAuthMethod === 'PASSWORD' ? 'password' : activeAuthMethod === 'PATTERN' ? 'pattern' : '4-6 digit PIN';

  const verifyPin = React.useCallback(async (pinValue: string) => {
    const credentialRef = pendingProtection?.credentialRef ?? APP_UNLOCK_CREDENTIAL_REF;
    const verified = await nativeBridge.verifyCredential(credentialRef, pinValue.trim());
    if (!verified) {
      throw new Error(activeAuthMethod === 'PASSWORD' ? 'The password did not match the stored credential.' : activeAuthMethod === 'PATTERN' ? 'The pattern did not match the stored credential.' : 'The PIN did not match the stored credential.');
    }
  }, [activeAuthMethod, pendingProtection?.credentialRef]);

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

  const submitPin = React.useCallback(
    async (pinValue: string) => {
      if (cooldownRemaining > 0 || pinValue.length < 4 || pinValue.length > 6) {
        return;
      }

      setLoading(true);
      try {
        await finishAuthentication(pinValue);
      } catch (error) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setStatusMessage('Wrong PIN. Try again.');
        if (nextAttempts >= 3) {
          setCooldownUntil(Date.now() + 30000);
          setStatusMessage('Recovery required. Cooldown started for 30 seconds.');
        }
        Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to verify the PIN.');
        setPin('');
      } finally {
        setLoading(false);
      }
    },
    [attempts, cooldownRemaining, finishAuthentication],
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
      const next = `${pin}${digit}`.slice(0, 6);
      setPin(next);
      setStatusMessage(null);
    },
    [pin],
  );

  const clearPin = React.useCallback(() => {
    setPin('');
    setStatusMessage(null);
  }, []);

  React.useEffect(() => {
    void localDataRepository.getSettings().then(settings => {
      setSettingsAuthMethod(settings.primaryAuthMethod);
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const hydratePendingLaunch = async () => {
      const currentPending = launchCoordinator.getPendingLaunchPackageName();
      if (currentPending) {
        if (!cancelled) {
          setPendingLaunchPackageName(currentPending);
        }
        return;
      }

      const pendingAuth = await nativeBridge.getPendingAuthRequest().catch(() => null);
      if (!pendingAuth?.packageName) {
        if (!cancelled) {
          setPendingLaunchPackageName(null);
        }
        return;
      }

      const protection = await protectionManager.getProtection(pendingAuth.packageName).catch(() => undefined);
      launchCoordinator.restorePendingLaunch(pendingAuth.packageName, protection?.mode ?? null);
      if (!cancelled) {
        setPendingLaunchPackageName(pendingAuth.packageName);
      }
    };

    void hydratePendingLaunch();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!pendingLaunchPackageName) {
      setPendingProtection(null);
      setPendingLabel('Private space');
      return;
    }

    void localDataRepository.getProtectedApps().then(apps => {
      const matchingApp = apps.find(app => app.packageName === pendingLaunchPackageName);
      setPendingProtection(matchingApp ?? null);
      setPendingLabel(matchingApp?.label ?? pendingLaunchPackageName);
    });
  }, [pendingLaunchPackageName]);

  const submitManualCredential = React.useCallback(() => {
    if (cooldownRemaining > 0) {
      return;
    }

    setLoading(true);
    void finishAuthentication(manualValue)
      .catch(error => {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setStatusMessage(activeAuthMethod === 'PASSWORD' ? 'Wrong password. Try again.' : activeAuthMethod === 'PATTERN' ? 'Wrong pattern. Try again.' : 'Wrong PIN. Try again.');
        if (nextAttempts >= 3) {
          setCooldownUntil(Date.now() + 30000);
          setStatusMessage('Recovery required. Cooldown started for 30 seconds.');
        }
        Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to verify the credential.');
        setManualValue('');
        setPatternValues([]);
        setPin('');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeAuthMethod, attempts, cooldownRemaining, finishAuthentication, manualValue]);

  return (
    <FigmaPage variant="dark">
      <ScrollView
        contentContainerStyle={[
          styles.fill,
          compactLayout ? styles.fillCompact : null,
          {paddingBottom: insets.bottom + (ultraCompactLayout ? 16 : 24)},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.statePill, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Secure session</Text>
          </View>
        </View>

        <Text style={[styles.title, compactLayout && styles.titleCompact, {color: palette.textPrimary}]}>Unlock access</Text>
        <Text style={[styles.subtitle, compactLayout && styles.subtitleCompact, {color: palette.textSecondary}]}>
          {pendingLaunchPackageName ? `Authenticate, then continue to ${pendingLabel}.` : 'Authenticate to continue.'}
        </Text>

        {sessionExpired ? (
          <View style={[styles.contextCard, compactLayout && styles.contextCardCompact, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <View style={styles.contextBody}>
              <Text style={[styles.contextLabel, {color: palette.textPrimary}]}>Session expired</Text>
            <Text style={[styles.contextHint, {color: palette.textSecondary}]}>The previous temporary access is no longer valid. Authenticate again.</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.contextCard, compactLayout && styles.contextCardCompact, {backgroundColor: palette.surface, borderColor: palette.border}]}>
        <View style={[styles.contextIcon, compactLayout && styles.contextIconCompact, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.contextIconText, {color: palette.accent}]}>GO</Text>
        </View>
        <View style={styles.contextBody}>
          <Text style={[styles.contextLabel, {color: palette.textPrimary}]}>
            {pendingLabel}
          </Text>
            <Text style={[styles.contextHint, {color: palette.textSecondary}]}>Auth screen follows the same private flow before the target app opens.</Text>
        </View>
      </View>

        <View style={[styles.centerArea, compactLayout && styles.centerAreaCompact]}>
          <UnlockGlyph />
          <Text style={[styles.instruction, {color: palette.textSecondary}]}>Use Face ID, fingerprint, or your {credentialLabel}.</Text>
          {statusMessage ? <Text style={[styles.errorLine, {color: '#FECACA'}]}>{statusMessage}</Text> : null}
          {cooldownRemaining > 0 ? <Text style={[styles.errorLine, {color: '#FECACA'}]}>Cooldown {cooldownRemaining}s remaining</Text> : null}
        </View>

        {activeAuthMethod === 'PIN' ? (
          <>
            <View style={[styles.dotsRow, compactLayout && styles.dotsRowCompact]}>
              {[0, 1, 2, 3, 4, 5].map(index => (
                <View key={index} style={[styles.dot, compactLayout && styles.dotCompact, {backgroundColor: pin.length > index ? palette.accent : palette.accentSoft}]} />
              ))}
            </View>

            <View style={[styles.keypadWrap, compactLayout && styles.keypadWrapCompact]}>
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
                          if (value === 'Clear') {
                            clearPin();
                            return;
                          }

                          if (value === 'Continue') {
                            submitPin(pin);
                            return;
                          }

                          submitDigit(value);
                        }}
                        disabled={(value === 'Continue' && pin.length < 4) || cooldownRemaining > 0}
                        style={[
                          styles.key,
                          {
                            width: keySize,
                            minHeight: ultraCompactLayout ? 48 : compactLayout ? 54 : 60,
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                            opacity:
                              cooldownRemaining > 0 || (value === 'Continue' && pin.length < 4)
                                ? 0.5
                                : 1,
                          },
                          value === 'Continue' ? styles.primaryKey : null,
                        ]}>
                        <Text
                          style={[
                            styles.keyText,
                            compactLayout && styles.keyTextCompact,
                            (value === 'Clear' || value === 'Continue') ? styles.keyTextAction : null,
                            {color: value === 'Continue' ? '#FFFFFF' : palette.textPrimary},
                          ]}>
                          {loading && value === 'Continue' ? 'Checking...' : value}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => void authenticate()}
              disabled={loading}
              style={({pressed}) => [
                styles.biometricButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed || loading ? 0.94 : 1,
                },
              ]}>
              <Text style={[styles.biometricButtonText, {color: palette.textSecondary}]}>
                {loading ? 'Checking...' : 'Use biometrics'}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={[styles.manualCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.manualLabel, {color: palette.textSecondary}]}>
              {activeAuthMethod === 'PASSWORD' ? 'Password' : 'Pattern'}
            </Text>
            {activeAuthMethod === 'PASSWORD' ? (
              <TextInput
                value={manualValue}
                onChangeText={setManualValue}
                editable={cooldownRemaining === 0}
                secureTextEntry
                placeholder="Enter password"
                placeholderTextColor={palette.textSecondary}
                style={[styles.manualInput, {color: palette.textPrimary}]}
              />
            ) : (
              <>
                <Text style={[styles.patternHelper, {color: palette.textSecondary}]}>
                  Dots tap karke saved pattern repeat karo.
                </Text>
                <PatternGrid
                  values={patternValues}
                  onChange={next => {
                    setPatternValues(next);
                    setManualValue(formatPatternValue(next));
                  }}
                  accentColor={palette.accent}
                  borderColor={palette.border}
                  textColor={palette.textPrimary}
                  mutedColor={palette.surfaceElevated}
                  compact={compactLayout}
                />
                <Pressable
                  onPress={() => {
                    setPatternValues([]);
                    setManualValue('');
                  }}
                  style={[styles.patternResetButton, {borderColor: palette.border, backgroundColor: palette.surfaceElevated}]}>
                  <Text style={[styles.patternResetText, {color: palette.textSecondary}]}>Clear pattern</Text>
                </Pressable>
              </>
            )}
            <Pressable
              onPress={submitManualCredential}
              style={[styles.manualSubmit, {backgroundColor: palette.accent, opacity: activeAuthMethod === 'PATTERN' && patternValues.length < 4 ? 0.5 : 1}]}
              disabled={activeAuthMethod === 'PATTERN' && patternValues.length < 4}>
              <Text style={styles.manualSubmitText}>{loading ? 'Checking...' : 'Submit'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
  },
  fillCompact: {
    paddingBottom: 12,
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
    marginTop: 18,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  titleCompact: {
    marginTop: 12,
    fontSize: 24,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  contextCard: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contextCardCompact: {
    marginTop: 10,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contextIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextIconCompact: {
    width: 34,
    height: 34,
    borderRadius: 12,
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
    marginTop: 18,
    alignItems: 'center',
  },
  centerAreaCompact: {
    marginTop: 10,
  },
  unlockShell: {
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockOrb: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#171F2F',
  },
  unlockCard: {
    width: 58,
    alignItems: 'center',
  },
  unlockShackle: {
    width: 28,
    height: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#4F8CFF',
    marginBottom: -1,
  },
  unlockBody: {
    width: 56,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#4F8CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockKeyhole: {
    width: 10,
    height: 16,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  instruction: {
    marginTop: 10,
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
    marginTop: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  dotsRowCompact: {
    marginTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotCompact: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  biometricButton: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButtonText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  keypad: {
    width: '100%',
    alignItems: 'center',
  },
  keypadWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  keypadWrapCompact: {
    marginTop: 8,
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
  keyTextAction: {
    fontSize: 12,
    lineHeight: 15,
  },
  primaryKey: {
    backgroundColor: figmaPalette.dark.accent,
    borderColor: 'transparent',
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
    backgroundColor: '#0F1A2D',
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
  patternHelper: {
    fontSize: 11,
    lineHeight: 15,
  },
  patternResetButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  patternResetText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
