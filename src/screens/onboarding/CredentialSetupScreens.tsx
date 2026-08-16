import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {APP_UNLOCK_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';
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

function CredentialSetupBase(props: {
  kind: CredentialKind;
  title: string;
  subtitle: string;
  hint: string;
  icon: string;
  nextRoute: OnboardingResumeRoute;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
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
      await nativeBridge.createCredential(APP_UNLOCK_CREDENTIAL_TYPE, normalized);
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
    <FigmaPage variant="light">
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

        <FigmaActionButton variant="light" label={saving ? 'Saving...' : 'Save and continue'} onPress={() => void saveCredential()} />
      </ScrollView>
    </FigmaPage>
  );
}

export function PinSetupScreen() {
  return (
    <CredentialSetupBase
      kind="PIN"
      title="Create your PIN"
      subtitle="Set a 4-digit PIN for quick fallback access."
      hint="PIN is the default option for protected launches and vault recovery."
      icon="1234"
      nextRoute="BiometricSetup"
    />
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
  const palette = figmaPalette.light;
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
    <FigmaPage variant="light">
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

        <FigmaActionButton variant="light" label={saving ? 'Checking...' : available === false ? 'Continue without biometric' : 'Enable biometric'} onPress={() => void continueNext()} />
      </ScrollView>
    </FigmaPage>
  );
}

export function ProtectionSavedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('ProtectionSaved');
  }, []);

  return (
    <FigmaPage variant="light">
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
          variant="light"
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
});
