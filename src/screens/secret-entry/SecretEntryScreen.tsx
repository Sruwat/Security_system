import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {SecretEntryMethod} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

const entryMethods = [
  {title: 'Calculator code', subtitle: 'Most discreet', tag: 'Recommended'},
  {title: 'Double tap', subtitle: 'Quick', tag: 'Fast'},
  {title: 'Triple tap', subtitle: 'Discreet', tag: 'Stealthy'},
  {title: 'Long press', subtitle: 'Subtle', tag: 'Simple'},
  {title: 'Pinch / spread', subtitle: 'Gesture', tag: 'Flexible'},
];

function EntryCard(props: {title: string; subtitle: string; tag: string; selected?: boolean; onPress: () => void; palette: typeof figmaPalette.light}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.entryCard,
        {
          backgroundColor: props.selected ? props.palette.accentSoft : props.palette.surface,
          borderColor: props.selected ? props.palette.accent : props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.entryBody}>
        <Text style={[styles.entryTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.entrySubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <View style={[styles.entryPill, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.entryPillText, {color: props.palette.accent}]}>{props.tag}</Text>
      </View>
    </Pressable>
  );
}

export function SecretEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const [selectedMethod, setSelectedMethod] = React.useState<SecretEntryMethod>('CALCULATOR_CODE');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void localDataRepository.getSettings().then(settings => {
      setSelectedMethod(settings.secretEntryMethod);
      setLoading(false);
    });
  }, []);

  const saveAndFinish = React.useCallback(async () => {
    const settings = await localDataRepository.getSettings();
    await localDataRepository.saveSettings({...settings, secretEntryMethod: selectedMethod, onboardingComplete: true});
    navigation.navigate(selectedMethod === 'CALCULATOR_CODE' ? 'Calculator' : 'Vault');
  }, [navigation, selectedMethod]);

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textSecondary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>4 of 4</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Choose secret entry</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Pick the gesture or code you will use to reveal the vault when the launcher is hidden.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <View style={[styles.heroDot, {backgroundColor: palette.accent}]} />
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>A discreet entry point keeps the vault accessible without showing it up front.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Choose something quick to remember but hard for others to notice.</Text>
        </View>

        <View style={[styles.noteCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noteTitle, {color: palette.accent}]}>Best choice</Text>
          <Text style={[styles.noteBody, {color: palette.textSecondary}]}>Calculator code is the most discreet because it looks like a normal utility app.</Text>
        </View>

        <View style={styles.cards}>
          {entryMethods.map(method => (
            <EntryCard
              key={method.title}
              title={method.title}
              subtitle={method.subtitle}
              tag={method.tag}
              selected={selectedMethod === methodToSecretEntryMethod(method.title)}
              onPress={() => setSelectedMethod(methodToSecretEntryMethod(method.title))}
              palette={palette}
            />
          ))}
        </View>

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
  heroCard: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDot: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 23,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
  noteCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  noteBody: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 14,
  },
  cards: {
    marginTop: 16,
    gap: 12,
  },
  entryCard: {
    minHeight: 66,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryBody: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  entrySubtitle: {
    marginTop: 3,
    fontSize: 8,
    lineHeight: 10,
  },
  entryPill: {
    minWidth: 72,
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryPillText: {
    fontSize: 7,
    fontWeight: '800',
    lineHeight: 9,
  },
  spacer: {
    flex: 1,
  },
});
