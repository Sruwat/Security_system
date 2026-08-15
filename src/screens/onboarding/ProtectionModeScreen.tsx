import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import type {RouteProp} from '@react-navigation/native';
import {protectionManager} from '../../services/protection/ProtectionManager';
import type {AppProtection, AuthMethod, ProtectionMode} from '../../types/domain';
import {buildProtectionPolicy} from '../app-picker/buildProtectionPolicy';

function ModeCard(props: {
  title: string;
  subtitle: string;
  selected?: boolean;
  palette: typeof figmaPalette.dark;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.modeCard,
        {
          backgroundColor: props.selected ? props.palette.accentSoft : props.palette.surface,
          borderColor: props.selected ? props.palette.accent : props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={[styles.modeBadge, {backgroundColor: props.selected ? props.palette.accent : props.palette.accentSoft}]}>
        <Text style={[styles.modeBadgeText, {color: props.selected ? '#FFFFFF' : props.palette.accent}]}>
          {props.selected ? 'Selected' : 'Mode'}
        </Text>
      </View>
      <View style={styles.modeBody}>
        <Text style={[styles.modeTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.modeSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
    </Pressable>
  );
}

export function ProtectionModeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProtectionMode'>>();
  const palette = figmaPalette.dark;
  const [draft, setDraft] = React.useState<AppProtection>(() => buildProtectionPolicy(route.params.draft));
  const selectedApps = route.params.draft.apps ?? [route.params.draft.app];
  const [saving, setSaving] = React.useState(false);
  const authOptions: AuthMethod[] = ['PIN', 'PASSWORD', 'PATTERN', 'BIOMETRIC_FALLBACK'];
  const autoLockOptions = [30, 60, 300, 900];

  const updateDraft = React.useCallback((patch: Partial<AppProtection>) => {
    setDraft(current => ({...current, ...patch}));
  }, []);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>4 of 4</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Set protection mode</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Pick the exact protection, authentication, and timeout you want for this app.</Text>

        <View style={[styles.appCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.appIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.appIconText, {color: palette.accent}]}>{draft.label.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.appBody}>
          <Text style={[styles.appTitle, {color: palette.textPrimary}]}>{selectedApps.length === 1 ? draft.label : `${selectedApps.length} selected apps`}</Text>
          <Text style={[styles.appSubtitle, {color: palette.textSecondary}]}>{selectedApps.length === 1 ? 'Protected app profile' : 'Shared protection profile'}</Text>
          </View>
        </View>

        <View style={styles.cards}>
          <ModeCard palette={palette} title="None" subtitle="Open normally" selected={draft.mode === 'NONE'} onPress={() => updateDraft({mode: 'NONE'})} />
          <ModeCard palette={palette} title="Lock" subtitle="Authenticate to open" selected={draft.mode === 'LOCK'} onPress={() => updateDraft({mode: 'LOCK'})} />
          <ModeCard palette={palette} title="Hide" subtitle="Remove from launcher" selected={draft.mode === 'HIDE'} onPress={() => updateDraft({mode: 'HIDE'})} />
          <ModeCard palette={palette} title="Lock + Hide" subtitle="Hide + authenticate" selected={draft.mode === 'LOCK_HIDE'} onPress={() => updateDraft({mode: 'LOCK_HIDE'})} />
        </View>

        <View style={[styles.notice, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noticeText, {color: palette.accent}]}>
            {draft.mode === 'NONE'
              ? 'None keeps the app visible and launches it normally through the central policy check.'
              : draft.mode === 'LOCK'
                ? 'Lock keeps the app visible and requires authentication before it opens.'
                : draft.mode === 'HIDE'
                  ? 'Hide removes the app from normal launcher surfaces but keeps it available in the vault.'
                  : 'Lock + Hide keeps the app out of the launcher while still requiring authentication to open.'}
          </Text>
        </View>

        <View style={styles.infoStack}>
          <View style={[styles.infoSection, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.infoTitle, {color: palette.textPrimary}]}>Authentication</Text>
            <View style={styles.optionWrap}>
              {authOptions.map(option => {
                const selected = draft.authMethod === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => updateDraft({authMethod: option})}
                    style={[styles.optionPill, {backgroundColor: selected ? palette.accent : palette.accentSoft}]}>
                    <Text style={[styles.optionText, {color: selected ? '#FFFFFF' : palette.accent}]}>
                      {option === 'BIOMETRIC_FALLBACK' ? 'Biometric + fallback' : option}
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
                const selected = draft.autoLockSeconds === seconds;
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

        <View style={styles.spacer} />

        <FigmaActionButton
          variant="dark"
          label={saving ? 'Saving...' : 'Save protection'}
          onPress={() => {
            void (async () => {
              setSaving(true);
              try {
                await Promise.all(
                  selectedApps.map(app =>
                    protectionManager.upsertProtection({
                      ...draft,
                      packageName: app.packageName,
                      label: app.label,
                      updatedAt: Date.now(),
                    }),
                  ),
                );
                if (route.params.onboarding) {
                  navigation.navigate('SecretEntry');
                } else {
                  navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
                }
              } finally {
                setSaving(false);
              }
            })();
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
  appCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  appBody: {
    flex: 1,
  },
  appTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  appSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  cards: {
    marginTop: 16,
    gap: 12,
  },
  modeCard: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeBadge: {
    minWidth: 70,
    minHeight: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  modeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
  },
  modeBody: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  modeSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  notice: {
    marginTop: 16,
    minHeight: 68,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  noticeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  infoStack: {
    marginTop: 14,
    gap: 10,
  },
  infoSection: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  optionWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  spacer: {
    flex: 1,
  },
});
