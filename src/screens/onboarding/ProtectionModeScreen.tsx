import React from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import type {AppProtection, AuthMethod} from '../../types/domain';
import {protectionManager} from '../../services/protection/ProtectionManager';
import {buildProtectionPolicy} from '../app-picker/buildProtectionPolicy';
import {describeProtection, lockTypeLabel, normalizeProtection, protectionModeFromFlags} from '../../services/protection/protectionState';
import {localDataRepository} from '../../storage/LocalDataRepository';

function ToggleCard(props: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onPress: () => void;
  palette: typeof figmaPalette.dark;
  accent?: string;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.toggleCard,
        {
          backgroundColor: props.enabled ? props.palette.accentSoft : props.palette.surface,
          borderColor: props.enabled ? props.accent ?? props.palette.accent : props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.toggleBody}>
        <Text style={[styles.toggleTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.toggleSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <View style={[styles.togglePill, {backgroundColor: props.enabled ? props.palette.accent : props.palette.accentSoft}]}>
        <Text style={[styles.togglePillText, {color: props.enabled ? '#FFFFFF' : props.palette.accent}]}>
          {props.enabled ? 'On' : 'Off'}
        </Text>
      </View>
    </Pressable>
  );
}

export function ProtectionModeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProtectionMode'>>();
  const palette = figmaPalette.dark;
  const [draft, setDraft] = React.useState<AppProtection>(() => normalizeProtection(buildProtectionPolicy(route.params.draft)));
  const [saving, setSaving] = React.useState(false);
  const selectedApps = route.params.draft.apps ?? [route.params.draft.app];
  const authOptions: AuthMethod[] = ['PIN', 'PASSWORD', 'PATTERN', 'BIOMETRIC_FALLBACK'];
  const autoLockOptions = [30, 60, 300, 900];

  React.useEffect(() => {
    if (route.params.onboarding) {
      void localDataRepository.setOnboardingResumeRoute('ProtectionMode');
    }
  }, [route.params.onboarding]);

  const updateDraft = React.useCallback((patch: Partial<AppProtection>) => {
    setDraft(current => normalizeProtection({...current, ...patch}));
  }, []);

  const saveProtection = React.useCallback(async () => {
    setSaving(true);
    try {
      const protection = normalizeProtection(draft);
      const settings = await localDataRepository.getSettings();
      await Promise.all(
        selectedApps.map(app =>
          protectionManager.upsertProtection({
            ...protection,
            packageName: app.packageName,
            label: app.label,
            appName: app.label,
            iconUri: app.iconUri,
            icon: app.iconUri,
            triggerType: settings.secretAccessType,
            updatedAt: Date.now(),
          }),
        ),
      );

      if (route.params.onboarding) {
        await localDataRepository.setOnboardingResumeRoute('SecretEntry');
        navigation.navigate('SecretEntry');
      } else {
        navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
      }
    } finally {
      setSaving(false);
    }
  }, [draft, navigation, route.params.onboarding, selectedApps]);

  const selectionTitle = selectedApps.length === 1 ? draft.label : `${selectedApps.length} selected apps`;
  const summary = describeProtection(draft);

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, draft.isHidden && draft.isLocked ? styles.progressFillCombined : draft.isHidden ? styles.progressFillHide : styles.progressFillLock]} />
          </View>
          <Text style={styles.progressLabel}>{route.params.onboarding ? 'Step 4 of 5' : 'Edit Flow'}</Text>
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIconShell, draft.isHidden && draft.isLocked ? styles.heroCombined : draft.isHidden ? styles.heroHide : styles.heroLock]}>
            <Text style={styles.heroIcon}>{draft.isHidden && draft.isLocked ? '🛡️' : draft.isHidden ? '🙈' : '🔒'}</Text>
          </View>
          <Text style={[styles.title, {color: palette.textPrimary}]}>
            {draft.isHidden && draft.isLocked ? 'Lock + Hide' : draft.isHidden ? 'App Hide' : 'App Lock'}
          </Text>
          <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
            {draft.isHidden && draft.isLocked
              ? 'Enable both layers of protection for the selected apps.'
              : draft.isHidden
                ? 'Choose whether this app should stay hidden in your private launcher.'
                : 'Choose how this app should stay locked before opening.'}
          </Text>
        </View>

        <View style={[styles.appCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          {draft.iconUri ? (
            <Image source={{uri: draft.iconUri}} style={styles.appArtwork} resizeMode="contain" />
          ) : (
            <View style={[styles.appIcon, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.appIconText, {color: palette.accent}]}>{draft.label.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.appBody}>
            <Text style={[styles.appTitle, {color: palette.textPrimary}]}>{selectionTitle}</Text>
            <Text style={[styles.appSubtitle, {color: palette.textSecondary}]}>{summary}</Text>
          </View>
        </View>

        <View style={styles.cards}>
          <ToggleCard
            title="Hide"
            subtitle="Keep the app out of the managed launcher and show it only in Hidden Apps."
            enabled={draft.isHidden}
            onPress={() => updateDraft({isHidden: !draft.isHidden, enabled: !draft.isHidden || draft.isLocked})}
            palette={palette}
            accent="#2563EB"
          />
          <ToggleCard
            title="Lock"
            subtitle="Require authentication before opening the app."
            enabled={draft.isLocked}
            onPress={() => updateDraft({isLocked: !draft.isLocked, enabled: draft.isHidden || !draft.isLocked})}
            palette={palette}
            accent="#EF4444"
          />
        </View>

        <View style={[styles.notice, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noticeText, {color: palette.accent}]}>
            {draft.isHidden && draft.isLocked
              ? 'Hide + Lock: Secret Trigger opens the lock screen first, then Hidden Apps.'
              : draft.isHidden
                ? 'Hide only: Secret Trigger opens Hidden Apps directly.'
                : draft.isLocked
                  ? 'Lock only: the app stays visible and opens through the lock screen.'
                  : 'This app is currently visible and unlocked.'}
          </Text>
        </View>

        <View style={styles.infoStack}>
          <View style={[styles.infoSection, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.infoTitle, {color: palette.textPrimary}]}>Lock type</Text>
            <View style={styles.optionWrap}>
              {authOptions.map(option => {
                const selected = (draft.lockType ?? draft.authMethod ?? 'PIN') === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => updateDraft({lockType: option, authMethod: option})}
                    style={[styles.optionPill, {backgroundColor: selected ? palette.accent : palette.accentSoft}]}>
                    <Text style={[styles.optionText, {color: selected ? '#FFFFFF' : palette.accent}]}>
                      {option === 'BIOMETRIC_FALLBACK' ? 'Biometric + PIN' : lockTypeLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.infoSection, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.infoTitle, {color: palette.textPrimary}]}>Auto-lock</Text>
            <View style={styles.optionWrap}>
              {autoLockOptions.map(seconds => {
                const selected = (draft.autoLockSeconds ?? 30) === seconds;
                return (
                  <Pressable
                    key={seconds}
                    onPress={() => updateDraft({autoLockSeconds: seconds})}
                    style={[styles.optionPill, {backgroundColor: selected ? palette.accent : palette.accentSoft}]}>
                    <Text style={[styles.optionText, {color: selected ? '#FFFFFF' : palette.accent}]}>
                      {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.summaryCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.summaryTitle, {color: palette.textPrimary}]}>Resulting flow</Text>
          <Text style={[styles.summaryBody, {color: palette.textSecondary}]}>
            {protectionModeFromFlags(draft) === 'HIDE'
              ? 'Secret Trigger → Hidden Apps'
              : protectionModeFromFlags(draft) === 'LOCK'
                ? 'Open App → Lock Screen → App'
                : protectionModeFromFlags(draft) === 'LOCK_HIDE'
                  ? 'Secret Trigger → Lock Screen → Hidden Apps'
                  : 'Open App normally'}
          </Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton
          variant="dark"
          label={saving ? 'Saving...' : route.params.onboarding ? 'Save and continue' : 'Save protection'}
          onPress={() => void saveProtection()}
        />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#090617',
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
    borderColor: '#233876',
    backgroundColor: '#101C35',
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
    backgroundColor: '#1E2B4B',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillHide: {
    width: '24%',
    backgroundColor: '#2563EB',
  },
  progressFillLock: {
    width: '24%',
    backgroundColor: '#EF4444',
  },
  progressFillCombined: {
    width: '48%',
    backgroundColor: '#8B5CF6',
  },
  progressLabel: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    marginTop: 28,
  },
  heroIconShell: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHide: {
    borderColor: '#2563EB',
    backgroundColor: '#0F1E3C',
  },
  heroLock: {
    borderColor: '#7F1D1D',
    backgroundColor: '#2A0E0E',
  },
  heroCombined: {
    borderColor: '#7C3AED',
    backgroundColor: '#1C1634',
  },
  heroIcon: {
    fontSize: 30,
  },
  title: {
    marginTop: 18,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  appCard: {
    marginTop: 24,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appArtwork: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  appIconText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  appBody: {
    flex: 1,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  appSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
  },
  cards: {
    marginTop: 18,
    gap: 14,
  },
  toggleCard: {
    minHeight: 96,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toggleBody: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  toggleSubtitle: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
  },
  togglePill: {
    minWidth: 60,
    minHeight: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  togglePillText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  notice: {
    marginTop: 16,
    minHeight: 86,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  infoStack: {
    marginTop: 16,
    gap: 12,
  },
  infoSection: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  optionWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionPill: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  summaryCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  summaryBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  spacer: {
    flex: 1,
  },
});
