import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {useTimedTapTrigger} from '../../hooks/useTimedTapTrigger';
import type {RootStackParamList} from '../../navigation/routes';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {secretAccessRouter} from '../../services/secret/SecretAccessRouter';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {SecretAccessType} from '../../types/domain';

async function handleSecretSuccess(navigation: NativeStackNavigationProp<RootStackParamList>) {
  const launchOutcome = await launchCoordinator.completeSecretEntry();
  if (launchOutcome === 'app_launched') {
    navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
    return;
  }
  if (launchOutcome === 'auth_required') {
    navigation.reset({index: 0, routes: [{name: 'AuthGate'}]});
    return;
  }

  const next = await secretAccessRouter.handleSecretAccess();
  if (next === 'auth_required') {
    navigation.reset({index: 0, routes: [{name: 'AuthGate'}]});
    return;
  }
  if (next === 'vault') {
    navigation.reset({index: 0, routes: [{name: 'Vault'}]});
    return;
  }
  Alert.alert('Nothing hidden yet', 'No hidden apps are configured right now.');
}

function useSecretSettings() {
  const [settings, setSettings] = React.useState<{
    secretAccessType: SecretAccessType;
    clockSecretValue: string;
    calendarSecretDate: string;
  }>({
    secretAccessType: 'triple_tap',
    clockSecretValue: '5',
    calendarSecretDate: '18',
  });

  React.useEffect(() => {
    void localDataRepository.getSettings().then(next => {
      setSettings({
        secretAccessType: next.secretAccessType,
        clockSecretValue: next.clockSecretValue ?? '5',
        calendarSecretDate: next.calendarSecretDate ?? '18',
      });
    });
  }, []);

  return settings;
}

export function ClockDisguiseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const settings = useSecretSettings();
  const clockValues = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const triggerClock = useTimedTapTrigger({
    key: 'clock-secret',
    onTrigger: () => handleSecretSuccess(navigation),
  });
  const triggerGeneric = useTimedTapTrigger({
    key: 'clock-generic',
    onTrigger: () => handleSecretSuccess(navigation),
  });

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Clock</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Time, alarms, and your saved schedule.</Text>

        <Pressable onPress={settings.secretAccessType === 'triple_tap' ? triggerGeneric : undefined} style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>World clock</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Tap the saved hour three times to open the private area.</Text>
        </Pressable>

        <View style={styles.grid}>
          {clockValues.map(value => {
            const isSecret = settings.secretAccessType === 'clock' && value === settings.clockSecretValue;
            return (
              <Pressable
                key={value}
                onPress={isSecret ? triggerClock : undefined}
                style={[styles.tile, {backgroundColor: palette.surface, borderColor: isSecret ? palette.accent : palette.border}]}>
                <Text style={[styles.tileValue, {color: palette.textPrimary}]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.spacer} />
        <FigmaActionButton variant="light" label="Settings" onPress={() => navigation.navigate('Settings')} />
      </ScrollView>
    </FigmaPage>
  );
}

export function CalendarDisguiseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const settings = useSecretSettings();
  const triggerDate = useTimedTapTrigger({
    key: 'calendar-secret',
    onTrigger: () => handleSecretSuccess(navigation),
  });
  const triggerGeneric = useTimedTapTrigger({
    key: 'calendar-generic',
    onTrigger: () => handleSecretSuccess(navigation),
  });
  const dates = Array.from({length: 30}, (_, index) => String(index + 1));

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Calendar</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Your monthly plan at a glance.</Text>

        <Pressable onPress={settings.secretAccessType === 'triple_tap' ? triggerGeneric : undefined} style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>August</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Tap the saved date three times to open the private area.</Text>
        </Pressable>

        <View style={styles.calendarGrid}>
          {dates.map(date => {
            const isSecret = settings.secretAccessType === 'calendar' && date === settings.calendarSecretDate;
            return (
              <Pressable
                key={date}
                onPress={isSecret ? triggerDate : undefined}
                style={[styles.dateTile, {backgroundColor: palette.surface, borderColor: isSecret ? palette.accent : palette.border}]}>
                <Text style={[styles.dateValue, {color: palette.textPrimary}]}>{date}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.spacer} />
        <FigmaActionButton variant="light" label="Settings" onPress={() => navigation.navigate('Settings')} />
      </ScrollView>
    </FigmaPage>
  );
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
  title: {
    marginTop: 28,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
  },
  heroCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  grid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '22%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  calendarGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateTile: {
    width: '14%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
});
