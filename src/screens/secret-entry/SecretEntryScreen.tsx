import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {nativeBridge} from '../../native';
import {mapSecretAccessTypeToEntryMethod} from '../../services/protection/protectionState';
import {VAULT_SECRET_CREDENTIAL_REF} from '../../services/security/credentialTypes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {DisguiseType, SecretAccessType} from '../../types/domain';

const secretAccessOptions: Array<{
  title: string;
  value: SecretAccessType;
  subtitle: string;
}> = [
  {title: 'Triple Tap', value: 'triple_tap', subtitle: 'Recommended: open Hidden Apps from a discreet triple tap'},
  {title: 'Shake', value: 'shake', subtitle: 'Recommended: open Hidden Apps from a quick shake gesture'},
  {title: 'Calculator', value: 'calculator', subtitle: 'Optional: use a 4-6 digit calculator secret code'},
  {title: 'Clock', value: 'clock', subtitle: 'Optional: tap the configured clock value three times'},
  {title: 'Calendar', value: 'calendar', subtitle: 'Optional: use your configured secret date interaction'},
  {title: 'Gallery', value: 'gallery', subtitle: 'Optional: use your gallery secret interaction'},
];

const disguiseOptions: Array<{title: string; value: DisguiseType}> = [
  {title: 'Default', value: 'default'},
  {title: 'Calculator', value: 'calculator'},
  {title: 'Clock', value: 'clock'},
  {title: 'Calendar', value: 'calendar'},
  {title: 'Gallery', value: 'gallery'},
];

function OptionCard(props: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  palette: typeof figmaPalette.dark;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.optionCard,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.selected ? '#4F8CFF' : props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.optionBody}>
        <Text style={[styles.optionTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.optionSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <View style={[styles.radioOuter, {borderColor: props.selected ? '#4F8CFF' : '#475467'}]}>
        {props.selected ? <View style={styles.radioInner} /> : null}
      </View>
      </Pressable>
  );
}

export function SecretEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const [secretAccessType, setSecretAccessType] = React.useState<SecretAccessType>('triple_tap');
  const [disguiseType, setDisguiseType] = React.useState<DisguiseType>('default');
  const [calculatorCode, setCalculatorCode] = React.useState('2468');
  const [confirmCalculatorCode, setConfirmCalculatorCode] = React.useState('2468');
  const [clockSecretValue, setClockSecretValue] = React.useState('5');
  const [calendarSecretDate, setCalendarSecretDate] = React.useState('18');
  const [gallerySecretConfig, setGallerySecretConfig] = React.useState('cover_tile');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [onboardingComplete, setOnboardingComplete] = React.useState(false);

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('SecretEntry');
    void localDataRepository.getSettings().then(settings => {
      setOnboardingComplete(settings.onboardingComplete);
      setSecretAccessType(settings.secretAccessType);
      setDisguiseType(settings.disguiseType);
      setCalculatorCode(settings.calculatorSecret ?? '2468');
      setConfirmCalculatorCode(settings.calculatorSecret ?? '2468');
      setClockSecretValue(settings.clockSecretValue ?? '5');
      setCalendarSecretDate(settings.calendarSecretDate ?? '18');
      setGallerySecretConfig(settings.gallerySecretConfig ?? 'cover_tile');
      setLoading(false);
    });
  }, []);

  const saveAndFinish = React.useCallback(async () => {
    const normalizedCode = calculatorCode.trim();
    const confirmedCode = confirmCalculatorCode.trim();

    if (secretAccessType === 'calculator') {
      if (!/^\d{4,6}$/.test(normalizedCode)) {
        setError('Enter a 4 to 6 digit calculator secret.');
        return;
      }

      if (normalizedCode !== confirmedCode) {
        setError('Calculator secret confirmation did not match.');
        return;
      }

      await nativeBridge.createCredential(VAULT_SECRET_CREDENTIAL_REF, 'PIN', normalizedCode);
    }

    if (secretAccessType === 'clock' && !/^(1[0-2]|[1-9])$/.test(clockSecretValue.trim())) {
      setError('Choose a clock value from 1 to 12.');
      return;
    }

    if (secretAccessType === 'calendar' && !/^(3[01]|[12][0-9]|[1-9])$/.test(calendarSecretDate.trim())) {
      setError('Choose a calendar date from 1 to 31.');
      return;
    }

    const settings = await localDataRepository.getSettings();
    await localDataRepository.saveSettings({
      ...settings,
      onboardingComplete: true,
      onboardingResumeRoute: undefined,
      secretAccessType,
      secretEntryMethod: mapSecretAccessTypeToEntryMethod(secretAccessType),
      disguiseType,
      calculatorSecret: normalizedCode,
      clockSecretValue: clockSecretValue.trim(),
      calendarSecretDate: calendarSecretDate.trim(),
      gallerySecretConfig,
    });

    await nativeBridge.setLauncherDisguise(disguiseType);
    setStatusMessage(`App disguise changed to ${disguiseOptions.find(option => option.value === disguiseType)?.title ?? 'Default'}`);

    navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
  }, [calculatorCode, calendarSecretDate, clockSecretValue, confirmCalculatorCode, disguiseType, gallerySecretConfig, navigation, secretAccessType]);

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressLabel}>{onboardingComplete ? 'Smart Hide' : 'Step 1 of 4'}</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIconShell}>
          <Text style={styles.heroIcon}>👻</Text>
          </View>
          <Text style={styles.heroTitleMain}>Smart Hide</Text>
          <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
            {onboardingComplete ? 'Update your secret trigger and disguise style.' : 'Choose your trigger gesture'}
          </Text>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          {onboardingComplete
            ? 'Secret access remains local and opens Hidden Apps using your saved protection rules.'
            : 'Pick how Hidden Apps should open, then optionally configure a disguise style.'}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: '#93C5FD'}]}>Trigger options</Text>
          <View style={styles.cards}>
            {secretAccessOptions.map(option => (
              <OptionCard
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
                selected={secretAccessType === option.value}
                onPress={() => {
                  setSecretAccessType(option.value);
                  setError(null);
                }}
                palette={palette}
              />
            ))}
          </View>
        </View>

        {secretAccessType === 'calculator' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Calculator secret</Text>
            <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>4-6 digit secret code</Text>
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
              <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Confirm secret code</Text>
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

        {secretAccessType === 'clock' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Clock secret</Text>
            <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Tap this clock value 3 times</Text>
              <TextInput
                value={clockSecretValue}
                onChangeText={text => {
                  setClockSecretValue(text.replace(/[^0-9]/g, '').slice(0, 2));
                  setError(null);
                }}
                keyboardType="number-pad"
                style={[styles.fieldInput, {color: palette.textPrimary}]}
              />
            </View>
          </View>
        ) : null}

        {secretAccessType === 'calendar' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Calendar secret</Text>
            <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Tap this date 3 times</Text>
              <TextInput
                value={calendarSecretDate}
                onChangeText={text => {
                  setCalendarSecretDate(text.replace(/[^0-9]/g, '').slice(0, 2));
                  setError(null);
                }}
                keyboardType="number-pad"
                style={[styles.fieldInput, {color: palette.textPrimary}]}
              />
            </View>
          </View>
        ) : null}

        {secretAccessType === 'gallery' ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Gallery secret</Text>
            <View style={[styles.field, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.fieldLabel, {color: palette.textSecondary}]}>Current trigger</Text>
              <TextInput
                value={gallerySecretConfig}
                onChangeText={text => {
                  setGallerySecretConfig(text.trim().slice(0, 24) || 'cover_tile');
                  setError(null);
                }}
                placeholder="cover_tile"
                placeholderTextColor={palette.textSecondary}
                style={[styles.fieldInput, {color: palette.textPrimary}]}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: '#93C5FD'}]}>Select Disguise</Text>
          <Text style={[styles.disguiseSubtitle, {color: palette.textSecondary}]}>Choose a fake icon to replace your app</Text>
          <View style={styles.disguiseGrid}>
            {disguiseOptions.map(option => {
              const selected = disguiseType === option.value;
              const icon =
                option.value === 'calculator'
                  ? '🧮'
                  : option.value === 'clock'
                    ? '🕘'
                    : option.value === 'calendar'
                      ? '🗓️'
                      : option.value === 'gallery'
                        ? '🖼️'
                        : '✨';
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setDisguiseType(option.value);
                    setStatusMessage(`App disguise changed to ${option.title}`);
                  }}
                  style={[
                    styles.disguiseTile,
                    {
                      borderColor: selected ? '#2563EB' : palette.border,
                      backgroundColor: palette.surface,
                    },
                  ]}>
                  <Text style={styles.disguiseTileIcon}>{icon}</Text>
                  <Text style={[styles.disguiseTileText, {color: palette.textPrimary}]}>{option.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {statusMessage ? (
          <View style={[styles.statusCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
            <Text style={[styles.statusText, {color: palette.accent}]}>{statusMessage}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorCard, {backgroundColor: '#FEF3F2', borderColor: '#FEE4E2'}]}>
            <Text style={[styles.errorBody, {color: '#B42318'}]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label={loading ? 'Loading...' : onboardingComplete ? 'Save Smart Hide' : 'Continue to Confirm'} onPress={() => void saveAndFinish()} />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#08111F',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#223A63',
    backgroundColor: '#111D33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#223A63',
    overflow: 'hidden',
  },
  progressFill: {
    width: '48%',
    height: '100%',
    backgroundColor: '#4F8CFF',
  },
  progressLabel: {
    color: '#9FB4D2',
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  heroIconShell: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#10203B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 32,
  },
  heroTitleMain: {
    marginTop: 22,
    color: '#F8FBFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  cards: {
    marginTop: 12,
    gap: 12,
  },
  optionCard: {
    minHeight: 96,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  optionSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },
  radioOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4F8CFF',
  },
  field: {
    marginTop: 12,
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
  disguiseSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 19,
  },
  disguiseGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  disguiseTile: {
    width: '30.5%',
    minHeight: 124,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disguiseTileIcon: {
    fontSize: 28,
  },
  disguiseTileText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  statusCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
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
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
