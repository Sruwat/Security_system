import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

function ProgressHeader(props: {onBackPress: () => void}) {
  return (
    <View style={styles.progressRow}>
      <Pressable onPress={props.onBackPress} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
      <Text style={styles.progressLabel}>Step 1 of 4</Text>
    </View>
  );
}

function LockTypeCard(props: {
  title: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.lockCard,
        props.selected ? styles.lockCardSelected : null,
        {opacity: pressed ? 0.95 : 1},
      ]}>
      <Text style={styles.lockCardIcon}>{props.icon}</Text>
      <Text style={styles.lockCardTitle}>{props.title}</Text>
      <Text style={styles.lockCardSubtitle}>{props.subtitle}</Text>
    </Pressable>
  );
}

export function PrimaryLockScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedRoute, setSelectedRoute] = React.useState<'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup'>('PinSetup');

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('PrimaryLock');
  }, []);

  const goTo = React.useCallback(
    (route: 'PinSetup' | 'PasswordSetup' | 'PatternSetup' | 'BiometricSetup') => {
      void localDataRepository.setOnboardingResumeRoute(route);
      navigation.navigate(route);
    },
    [navigation],
  );

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProgressHeader onBackPress={() => navigation.goBack()} />

        <View style={styles.hero}>
          <View style={styles.heroIconShell}>
            <Text style={styles.heroIcon}>🔒</Text>
          </View>
          <Text style={styles.title}>App Lock</Text>
          <Text style={styles.subtitle}>Select your lock type</Text>
        </View>

        <View style={styles.grid}>
          <LockTypeCard
            title="Password"
            subtitle="Letters & numbers"
            icon="🔑"
            selected={selectedRoute === 'PasswordSetup'}
            onPress={() => setSelectedRoute('PasswordSetup')}
          />
          <LockTypeCard
            title="PIN"
            subtitle="4-6 digits"
            icon="🔢"
            selected={selectedRoute === 'PinSetup'}
            onPress={() => setSelectedRoute('PinSetup')}
          />
          <LockTypeCard
            title="Pattern"
            subtitle="Draw to unlock"
            icon="⬛"
            selected={selectedRoute === 'PatternSetup'}
            onPress={() => setSelectedRoute('PatternSetup')}
          />
          <LockTypeCard
            title="Biometric"
            subtitle="Fingerprint / Face"
            icon="☝️"
            selected={selectedRoute === 'BiometricSetup'}
            onPress={() => setSelectedRoute('BiometricSetup')}
          />
        </View>

        <Pressable onPress={() => goTo(selectedRoute)} style={({pressed}) => [styles.continueButton, {opacity: pressed ? 0.95 : 1}]}>
          <Text style={styles.continueText}>Continue</Text>
          <Text style={styles.continueArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#1A0505',
  },
  scrollContent: {
    paddingBottom: 28,
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
    borderColor: '#3B1B1B',
    backgroundColor: '#281010',
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
    backgroundColor: '#3A1A1A',
    overflow: 'hidden',
  },
  progressFill: {
    width: '18%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#EF4444',
  },
  progressLabel: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    marginTop: 34,
  },
  heroIconShell: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#2A0E0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 34,
  },
  title: {
    marginTop: 22,
    color: '#FCA5A5',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 10,
    color: '#A78BFA',
    fontSize: 16,
    lineHeight: 20,
  },
  grid: {
    marginTop: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  lockCard: {
    width: '47%',
    minHeight: 152,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2F3B56',
    backgroundColor: '#151636',
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#201A41',
  },
  lockCardIcon: {
    fontSize: 28,
  },
  lockCardTitle: {
    marginTop: 16,
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  lockCardSubtitle: {
    marginTop: 8,
    color: '#A5B4FC',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  continueButton: {
    minHeight: 56,
    borderRadius: 28,
    marginTop: 26,
    backgroundColor: '#7F1D1D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  continueArrow: {
    marginLeft: 10,
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
});
