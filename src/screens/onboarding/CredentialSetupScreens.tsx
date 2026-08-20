import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {APP_UNLOCK_CREDENTIAL_REF} from '../../services/security/credentialTypes';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {OnboardingResumeRoute} from '../../types/domain';

type CredentialKind = 'PIN' | 'PASSWORD' | 'PATTERN';

function normalizeCredential(kind: CredentialKind, text: string): string {
  if (kind === 'PIN') {
    return text.replace(/[^0-9]/g, '').slice(0, 6);
  }

  if (kind === 'PATTERN') {
    return text.replace(/\s+/g, '');
  }

  return text.trim();
}

function PinKey(props: {label: string; sublabel?: string; onPress: () => void; accent?: boolean}) {
  return (
    <Pressable onPress={props.onPress} style={({pressed}) => [styles.pinKey, props.accent ? styles.pinKeyAccent : null, {opacity: pressed ? 0.95 : 1}]}>
      <Text style={styles.pinKeyLabel}>{props.label}</Text>
      {props.sublabel ? <Text style={styles.pinKeySublabel}>{props.sublabel}</Text> : null}
    </Pressable>
  );
}

function CredentialSetupBase(props: {
  kind: CredentialKind;
  title: string;
  subtitle: string;
  hint: string;
  icon: string;
  nextRoute: OnboardingResumeRoute;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const [value, setValue] = React.useState('');
  const [confirmValue, setConfirmValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const resumeRoute = props.kind === 'PIN' ? 'PinSetup' : props.kind === 'PASSWORD' ? 'PasswordSetup' : 'PatternSetup';
    void localDataRepository.setOnboardingResumeRoute(resumeRoute);
  }, [props.kind]);

  const saveCredential = React.useCallback(async () => {
    const normalized = normalizeCredential(props.kind, value);
    const confirmed = normalizeCredential(props.kind, confirmValue);

    if (!normalized) {
      setError('Enter a value to continue.');
      return;
    }

    if (props.kind === 'PIN' && !/^\d{4,6}$/.test(normalized)) {
      setError('Enter a 4 to 6 digit PIN.');
      return;
    }

    if (normalized !== confirmed) {
      setError('The entries do not match.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await nativeBridge.createCredential(APP_UNLOCK_CREDENTIAL_REF, props.kind, normalized);
      const settings = await localDataRepository.getSettings();
      await localDataRepository.saveSettings({...settings, primaryAuthMethod: props.kind, onboardingResumeRoute: props.nextRoute});
      navigation.navigate(props.nextRoute as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the credential.');
      Alert.alert('Setup failed', e instanceof Error ? e.message : 'Unable to save the credential.');
    } finally {
      setSaving(false);
    }
  }, [confirmValue, navigation, props.nextRoute, value]);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>{props.kind}</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>{props.subtitle}</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.heroIconText, {color: palette.accent}]}>{props.icon}</Text>
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Create the credential once, then keep it local on the device.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>{props.hint}</Text>
        </View>

        {error ? (
          <View style={[styles.errorCard, {backgroundColor: '#FEF3F2', borderColor: '#FEE4E2'}]}>
            <Text style={[styles.errorText, {color: '#B42318'}]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Enter {props.kind.toLowerCase()}</Text>
            <TextInput
              value={value}
              onChangeText={text => {
                setValue(normalizeCredential(props.kind, text));
                if (error) {
                  setError(null);
                }
              }}
              placeholder={props.kind === 'PATTERN' ? 'Example: 1-2-3-4' : ''}
              placeholderTextColor={palette.textSecondary}
              secureTextEntry={props.kind !== 'PATTERN'}
              keyboardType={props.kind === 'PIN' ? 'number-pad' : 'default'}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={props.kind === 'PIN' ? 6 : undefined}
              style={[styles.fieldInput, {color: palette.textPrimary}]}
            />
          </View>
          <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Confirm {props.kind.toLowerCase()}</Text>
            <TextInput
              value={confirmValue}
              onChangeText={text => {
                setConfirmValue(normalizeCredential(props.kind, text));
                if (error) {
                  setError(null);
                }
              }}
              secureTextEntry={props.kind !== 'PATTERN'}
              keyboardType={props.kind === 'PIN' ? 'number-pad' : 'default'}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={props.kind === 'PIN' ? 6 : undefined}
              style={[styles.fieldInput, {color: palette.textPrimary}]}
            />
          </View>
        </View>

        <Pressable onPress={() => navigation.navigate('PrimaryLock')} style={[styles.inlineLink, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.inlineLinkText, {color: palette.textSecondary}]}>Go back</Text>
        </Pressable>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label={saving ? 'Saving...' : 'Save and continue'} onPress={() => void saveCredential()} />
      </ScrollView>
    </FigmaPage>
  );
}

export function PinSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [value, setValue] = React.useState('');
  const [confirmValue, setConfirmValue] = React.useState('');
  const [phase, setPhase] = React.useState<'create' | 'confirm'>('create');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('PinSetup');
  }, []);

  const activeValue = phase === 'create' ? value : confirmValue;

  const appendDigit = React.useCallback((digit: string) => {
    if (phase === 'create') {
      setValue(current => (current.length >= 6 ? current : `${current}${digit}`));
    } else {
      setConfirmValue(current => (current.length >= 6 ? current : `${current}${digit}`));
    }
    if (error) {
      setError(null);
    }
  }, [error, phase]);

  const removeDigit = React.useCallback(() => {
    if (phase === 'create') {
      setValue(current => current.slice(0, -1));
    } else {
      setConfirmValue(current => current.slice(0, -1));
    }
  }, [phase]);

  const continueNext = React.useCallback(async () => {
    if (phase === 'create') {
      if (!/^\d{4,6}$/.test(value)) {
        setError('Enter a 4 to 6 digit PIN.');
        return;
      }
      setPhase('confirm');
      return;
    }

    if (confirmValue !== value) {
      setError('PIN confirmation did not match.');
      setConfirmValue('');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await nativeBridge.createCredential(APP_UNLOCK_CREDENTIAL_REF, 'PIN', value);
      const settings = await localDataRepository.getSettings();
      await localDataRepository.saveSettings({...settings, primaryAuthMethod: 'PIN', onboardingResumeRoute: 'BiometricSetup'});
      navigation.navigate('BiometricSetup');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the PIN.');
      Alert.alert('Setup failed', e instanceof Error ? e.message : 'Unable to save the PIN.');
    } finally {
      setSaving(false);
    }
  }, [confirmValue, navigation, phase, value]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <FigmaPage variant="dark" style={styles.pinPage}>
      <ScrollView contentContainerStyle={styles.pinScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pinProgressRow}>
          <Pressable onPress={() => (phase === 'confirm' ? setPhase('create') : navigation.goBack())} style={styles.pinBackButton}>
            <Text style={styles.pinBackButtonText}>←</Text>
          </Pressable>
          <View style={styles.pinProgressTrack}>
            <View style={[styles.pinProgressFill, {width: phase === 'create' ? '52%' : '74%'}]} />
          </View>
          <Text style={styles.pinProgressLabel}>Step 3 of 5</Text>
        </View>

        <View style={styles.pinHero}>
          <View style={styles.pinHeroShell}>
            <Text style={styles.pinHeroIcon}>🔢</Text>
          </View>
          <Text style={styles.pinHeroTitle}>{phase === 'create' ? 'Set PIN' : 'Confirm PIN'}</Text>
          <Text style={styles.pinHeroSubtitle}>
            {phase === 'create' ? 'Create a 4-6 digit PIN to unlock your hidden app' : 'Enter the same PIN again to continue'}
          </Text>
        </View>

        <View style={styles.pinDotsRow}>
          {Array.from({length: 6}).map((_, index) => (
            <View key={index} style={[styles.pinDot, index < activeValue.length ? styles.pinDotFilled : null, index >= 4 ? styles.pinDotOptional : null]} />
          ))}
        </View>

        {error ? (
          <View style={styles.pinErrorCard}>
            <Text style={styles.pinErrorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.pinGrid}>
          {digits.map(digit => (
            <PinKey key={digit} label={digit} onPress={() => appendDigit(digit)} accent={digit === '8'} />
          ))}
          <View style={styles.pinGridSpacer} />
          <PinKey label="0" onPress={() => appendDigit('0')} />
          <PinKey label="⌫" onPress={removeDigit} />
        </View>

        <Pressable onPress={() => void continueNext()} style={({pressed}) => [styles.pinContinueButton, {opacity: pressed ? 0.95 : 1}]}>
          <Text style={styles.pinContinueText}>{saving ? 'Saving...' : phase === 'create' ? 'Continue' : 'Save and Continue'}</Text>
          <Text style={styles.pinContinueArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </FigmaPage>
  );
}

export function PasswordSetupScreen() {
  return (
    <CredentialSetupBase
      kind="PASSWORD"
      title="Create your password"
      subtitle="Use a text password for a more classic credential."
      hint="Password remains local and is used as a fallback when biometrics are not available."
      icon="Aa"
      nextRoute="BiometricSetup"
    />
  );
}

export function PatternSetupScreen() {
  return (
    <CredentialSetupBase
      kind="PATTERN"
      title="Create your pattern"
      subtitle="Use an Android-style pattern as your primary credential."
      hint="The pattern is stored locally and can be used for protected app launches."
      icon="PAT"
      nextRoute="BiometricSetup"
    />
  );
}

export function BiometricSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('BiometricSetup');
    void nativeBridge.getDeviceCapabilities().then(capabilities => {
      setAvailable(capabilities.biometricsAvailable);
    });
  }, []);

  const continueNext = React.useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (available) {
        const result = await nativeBridge.authenticateBiometric();
        if (result === 'unavailable') {
          setAvailable(false);
          setError('Biometric authentication is unavailable on this device.');
          return;
        }
        if (result === 'fail') {
          setError('Biometric changed or verification failed.');
          return;
        }
      }

      await localDataRepository.setOnboardingResumeRoute('ProtectionSaved');
      navigation.navigate('ProtectionSaved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to continue.');
    } finally {
      setSaving(false);
    }
  }, [available, navigation]);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>BIOMETRIC</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Biometric setup</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Enable fingerprint or face unlock as a quick fallback for protected apps.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.heroIconText, {color: palette.accent}]}>B</Text>
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>
            {available === false ? 'Biometric unavailable on this device.' : 'Biometric access can speed up protected launches.'}
          </Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>
            {available === false
              ? 'Use a PIN or password instead, then continue to the private apps flow.'
              : 'The app will use the platform biometric prompt and keep the fallback credential local.'}
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorCard, {backgroundColor: '#FEF3F2', borderColor: '#FEE4E2'}]}>
            <Text style={[styles.errorText, {color: '#B42318'}]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={[styles.infoCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Current status</Text>
            <Text style={[styles.infoValue, {color: palette.textPrimary}]}>
              {available === null ? 'Checking device...' : available ? 'Biometric ready' : 'Biometric unavailable'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            void localDataRepository.setOnboardingResumeRoute('ProtectionSaved');
            navigation.navigate('ProtectionSaved');
          }}
          style={[styles.inlineLink, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.inlineLinkText, {color: palette.textSecondary}]}>Skip biometric for now</Text>
        </Pressable>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label={saving ? 'Checking...' : available === false ? 'Continue without biometric' : 'Enable biometric'} onPress={() => void continueNext()} />
      </ScrollView>
    </FigmaPage>
  );
}

export function ProtectionSavedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('ProtectionSaved');
  }, []);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>SAVED</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Protection saved</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Your primary lock is ready. Continue into app selection to finish the private setup.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.heroIconText, {color: palette.accent}]}>OK</Text>
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Setup details are stored locally on this device.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>You can still adjust the mode, secret entry, and auto-lock once the apps are selected.</Text>
        </View>

        <View style={[styles.infoCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Next step</Text>
          <Text style={[styles.infoValue, {color: palette.textPrimary}]}>Select apps</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton
          variant="dark"
          label="Continue to app selection"
          onPress={() => {
            void localDataRepository.setOnboardingResumeRoute('AddApps');
            navigation.navigate('AddApps');
          }}
        />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    marginTop: 28,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
  },
  heroCard: {
    marginTop: 24,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  form: {
    marginTop: 18,
    gap: 14,
  },
  field: {
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  fieldInput: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    paddingVertical: 0,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  infoValue: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  errorCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  inlineLink: {
    marginTop: 12,
    minHeight: 54,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLinkText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  spacer: {
    flex: 1,
    minHeight: 22,
  },
  pinPage: {
    backgroundColor: '#091124',
  },
  pinScroll: {
    paddingBottom: 24,
  },
  pinProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pinBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#233876',
    backgroundColor: '#101C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBackButtonText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  pinProgressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#1E2B4B',
    overflow: 'hidden',
  },
  pinProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },
  pinProgressLabel: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '700',
  },
  pinHero: {
    alignItems: 'center',
    marginTop: 28,
  },
  pinHeroShell: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#0F1E3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHeroIcon: {
    fontSize: 32,
  },
  pinHeroTitle: {
    marginTop: 22,
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  pinHeroSubtitle: {
    marginTop: 12,
    color: '#A5B4FC',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  pinDotsRow: {
    marginTop: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#2563EB',
  },
  pinDotOptional: {
    opacity: 0.45,
  },
  pinErrorCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#2A1320',
    borderWidth: 1,
    borderColor: '#F04438',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pinErrorText: {
    color: '#FDA29B',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  pinGrid: {
    marginTop: 26,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  pinKey: {
    width: '30.5%',
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2F3B56',
    backgroundColor: '#151636',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyAccent: {
    borderColor: '#2563EB',
    backgroundColor: '#19264A',
  },
  pinKeyLabel: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  pinKeySublabel: {
    marginTop: 4,
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  pinGridSpacer: {
    width: '30.5%',
  },
  pinContinueButton: {
    minHeight: 56,
    borderRadius: 28,
    marginTop: 22,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinContinueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pinContinueArrow: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
