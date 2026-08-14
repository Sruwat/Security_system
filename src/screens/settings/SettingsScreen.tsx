import React from 'react';
import {Alert, StyleSheet, Text, TextInput, View, useColorScheme} from 'react-native';
import {themeTokens} from '../../theme';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppSettings, SecretEntryMethod, ThemeMode} from '../../types/domain';
import {PrimaryButton} from '../../components/PrimaryButton';
import {Screen} from '../../components/Screen';

const themeModes: ThemeMode[] = ['SYSTEM', 'LIGHT', 'DARK'];
const secretEntryModes: SecretEntryMethod[] = ['DOUBLE_TAP', 'TRIPLE_TAP', 'LONG_PRESS', 'PINCH', 'CALCULATOR_CODE'];

export function SettingsScreen() {
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    localDataRepository.getSettings().then(next => {
      if (mounted) {
        setSettings(next);
      }
    }).finally(() => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = React.useCallback(async (next: AppSettings) => {
    setSaving(true);
    try {
      await localDataRepository.saveSettings(next);
      setSettings(next);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }, []);

  const patchSettings = React.useCallback(
    (patch: Partial<AppSettings>) => {
      if (!settings) {
        return;
      }

      const next = {...settings, ...patch};
      setSettings(next);
      void updateSettings(next);
    },
    [settings, updateSettings],
  );

  if (loading || !settings) {
    return (
      <Screen>
        <View style={[styles.heroCard, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
          <Text style={[styles.kicker, {color: palette.accent}]}>Preferences</Text>
          <Text style={[styles.title, {color: palette.textPrimary}]}>Settings</Text>
          <Text style={[styles.description, {color: palette.textSecondary}]}>Loading launcher preferences...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.heroCard, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
        <Text style={[styles.kicker, {color: palette.accent}]}>Preferences</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Settings</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          Control theme, secret access, ad preference, and default auto-lock behavior.
        </Text>
      </View>

      <View style={[styles.card, {backgroundColor: palette.surface, borderColor: palette.border}]}>
        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Theme</Text>
        <View style={styles.buttonRow}>
          {themeModes.map(mode => (
            <PrimaryButton
              key={mode}
              label={mode}
              onPress={() => patchSettings({theme: mode})}
              variant={settings.theme === mode ? 'primary' : 'secondary'}
              style={styles.button}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Secret entry method</Text>
        <View style={styles.buttonRow}>
          {secretEntryModes.map(mode => (
            <PrimaryButton
              key={mode}
              label={mode}
              onPress={() => patchSettings({secretEntryMethod: mode})}
              variant={settings.secretEntryMethod === mode ? 'primary' : 'secondary'}
              style={styles.button}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Ad surfaces</Text>
        <View style={styles.buttonRow}>
          <PrimaryButton
            label={settings.bannerEnabled ? 'Banner on' : 'Banner off'}
            onPress={() => patchSettings({bannerEnabled: !settings.bannerEnabled})}
            variant={settings.bannerEnabled ? 'primary' : 'secondary'}
            style={styles.button}
          />
          <PrimaryButton
            label={settings.nativeAdEnabled ? 'Native on' : 'Native off'}
            onPress={() => patchSettings({nativeAdEnabled: !settings.nativeAdEnabled})}
            variant={settings.nativeAdEnabled ? 'primary' : 'secondary'}
            style={styles.button}
          />
        </View>

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Default auto-lock seconds</Text>
        <Text style={[styles.helperText, {color: palette.textSecondary}]}>
          This timer becomes the default temporary access window for protected apps and vault sessions.
        </Text>
        <TextInput
          value={String(settings.autoLockSecondsDefault)}
          keyboardType="number-pad"
          onChangeText={text => {
            const parsed = Number.parseInt(text, 10);
            if (Number.isFinite(parsed) && parsed >= 0) {
              patchSettings({autoLockSecondsDefault: parsed});
            }
          }}
          placeholder="300"
          placeholderTextColor={palette.textSecondary}
          style={[
            styles.input,
            {
              color: palette.textPrimary,
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        />

        <PrimaryButton
          label={saving ? 'Saving...' : 'Save settings'}
          onPress={() => void updateSettings(settings)}
          style={styles.saveButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
  },
  kicker: {
    fontSize: themeTokens.typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: themeTokens.typography.title,
    fontWeight: '800',
  },
  description: {
    fontSize: themeTokens.typography.body,
    lineHeight: 24,
  },
  card: {
    gap: themeTokens.spacing.md,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
  },
  sectionTitle: {
    marginTop: themeTokens.spacing.xs,
    fontSize: themeTokens.typography.caption,
    fontWeight: '700',
  },
  helperText: {
    fontSize: themeTokens.typography.caption,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
  },
  button: {
    minWidth: 108,
  },
  input: {
    minHeight: 48,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.md,
    fontSize: themeTokens.typography.body,
  },
  saveButton: {
    marginTop: themeTokens.spacing.sm,
  },
});
