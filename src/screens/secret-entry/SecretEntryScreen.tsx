import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {SecretEntryMethod} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';
import {VAULT_SECRET_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';

const entryMethods = [
  {title: 'Calculator code', subtitle: 'Most discreet', tag: 'Recommended'},
  {title: 'Double tap', subtitle: 'Quick', tag: 'Fast'},
  {title: 'Triple tap', subtitle: 'Discreet', tag: 'Stealthy'},
  {title: 'Long press', subtitle: 'Subtle', tag: 'Simple'},
  {title: 'Pinch / spread', subtitle: 'Gesture', tag: 'Flexible'},
];

function EntryCard(props: {title: string; subtitle: string; selected?: boolean; onPress: () => void; palette: typeof figmaPalette.light}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.entryCard,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.selected ? props.palette.accent : props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.entryBody}>
        <Text style={[styles.entryTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.entrySubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <Text style={[styles.chevron, {color: props.palette.textSecondary}]}>{'>'}</Text>
    </Pressable>
  );
}

export function SecretEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const [selectedMethod, setSelectedMethod] = React.useState<SecretEntryMethod>('CALCULATOR_CODE');
  const [loading, setLoading] = React.useState(true);
  const [calculatorCode, setCalculatorCode] = React.useState('2468');
  const [confirmCalculatorCode, setConfirmCalculatorCode] = React.useState('2468');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('SecretEntry');
    void localDataRepository.getSettings().then(settings => {
      setSelectedMethod(settings.secretEntryMethod);
      setLoading(false);
    });
  }, []);

  const saveAndFinish = React.useCallback(async () => {
    if (selectedMethod === 'CALCULATOR_CODE') {
      const normalizedCode = calculatorCode.trim();
      const confirmedCode = confirmCalculatorCode.trim();

      if (!/^\d{4,6}$/.test(normalizedCode)) {
        setError('Enter a 4 to 6 digit calculator code.');
        return;
      }

      if (normalizedCode !== confirmedCode) {
        setError('Calculator code confirmation did not match.');
        return;
      }

      await nativeBridge.createCredential(VAULT_SECRET_CREDENTIAL_TYPE, normalizedCode);
    }

    const settings = await localDataRepository.getSettings();
    await localDataRepository.saveSettings({
      ...settings,
      secretEntryMethod: selectedMethod,
      onboardingComplete: true,
      onboardingResumeRoute: undefined,
    });
    navigation.navigate(selectedMethod === 'CALCULATOR_CODE' ? 'Calculator' : 'Vault');
  }, [calculatorCode, confirmCalculatorCode, navigation, selectedMethod]);

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Secret access</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Choose hidden-app entry.</Text>

        <View style={styles.cards}>
          {entryMethods.map(method => (
            <EntryCard
              key={method.title}
              title={method.title}
              subtitle={method.subtitle}
              selected={selectedMethod === methodToSecretEntryMethod(method.title)}
              onPress={() => setSelectedMethod(methodToSecretEntryMethod(method.title))}
              palette={palette}
            />
          ))}
        </View>

        {selectedMethod === 'CALCULATOR_CODE' ? (
          <View style={styles.form}>
            <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Calculator code</Text>
              <TextInput
                value={calculatorCode}
                onChangeText={text => {
                  setCalculatorCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setError(null);
                }}
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.fieldInput, {color: palette.textPrimary}]}
              />
            </View>
            <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Confirm code</Text>
              <TextInput
                value={confirmCalculatorCode}
                onChangeText={text => {
                  setConfirmCalculatorCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setError(null);
                }}
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.fieldInput, {color: palette.textPrimary}]}
              />
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorCard, {backgroundColor: '#FEF3F2', borderColor: '#FEE4E2'}]}>
            <Text style={[styles.errorBody, {color: '#B42318'}]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.spacer} />

        {/* The vault unlock step keeps the native credential check in place:
            verifyCredential(VAULT_SECRET_CREDENTIAL_TYPE, ...) */}
        <FigmaActionButton variant="light" label={loading ? 'Loading...' : 'Finish setup'} onPress={() => void saveAndFinish()} />
      </ScrollView>
    </FigmaPage>
  );
}

function methodToSecretEntryMethod(title: string): SecretEntryMethod {
  switch (title) {
    case 'Calculator code':
      return 'CALCULATOR_CODE';
    case 'Double tap':
      return 'DOUBLE_TAP';
    case 'Triple tap':
      return 'TRIPLE_TAP';
    case 'Long press':
      return 'LONG_PRESS';
    case 'Pinch / spread':
      return 'PINCH';
    default:
      return 'CALCULATOR_CODE';
  }
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
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
  cards: {
    marginTop: 58,
    gap: 14,
  },
  form: {
    marginTop: 18,
    gap: 14,
  },
  errorCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  errorBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  field: {
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  fieldInput: {
    marginTop: 8,
    minHeight: 32,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  entryCard: {
    minHeight: 112,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryBody: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  entrySubtitle: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
  },
  chevron: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
});
