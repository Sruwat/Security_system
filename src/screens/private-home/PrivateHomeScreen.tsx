import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';
import {useAppVariant} from '../../hooks/useAppVariant';

type Palette = (typeof figmaPalette)[keyof typeof figmaPalette];

function MetricCard(props: {label: string; value: string; tone: 'accent' | 'muted' | 'surface'; palette: Palette}) {
  const backgroundColor = props.tone === 'accent' ? props.palette.accent : props.tone === 'muted' ? props.palette.accentSoft : props.palette.surface;
  const textColor = props.tone === 'accent' ? '#FFFFFF' : props.tone === 'muted' ? props.palette.accent : props.palette.textPrimary;
  const subColor = props.tone === 'accent' ? 'rgba(255,255,255,0.82)' : props.palette.textSecondary;

  return (
    <View style={[styles.metricCard, {backgroundColor, borderColor: props.palette.border}]}>
      <Text style={[styles.metricLabel, {color: subColor}]}>{props.label}</Text>
      <Text style={[styles.metricValue, {color: textColor}]}>{props.value}</Text>
    </View>
  );
}

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const variant = useAppVariant();
  const palette = figmaPalette[variant];

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      setApps(await localDataRepository.getProtectedApps());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadApps();
    }, [loadApps]),
  );

  const visibleApps = apps.filter(app => app.mode === 'NONE' || app.mode === 'LOCK').slice(0, 4);
  const hiddenCount = apps.filter(app => app.mode === 'HIDE' || app.mode === 'LOCK_HIDE').length;

  return (
    <FigmaPage variant={variant}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Private space</Text>
          </View>
          <View style={[styles.profileChip, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.profileChipText, {color: palette.textSecondary}]}>Locked</Text>
          </View>
        </View>

        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Apps and vaults you selected are protected locally on this device.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroBadge, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.heroBadgeText, {color: palette.accent}]}>Protection active</Text>
          </View>
          <Text style={[styles.heroHeadline, {color: palette.textPrimary}]}>Your private apps are ready when you are.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Tap an app to launch it through a biometric or PIN checkpoint.</Text>

          <View style={styles.metricGrid}>
            <MetricCard label="Protected" value={`${apps.length}`} tone="accent" palette={palette} />
            <MetricCard label="Quick unlock" value="Biometric" tone="muted" palette={palette} />
            <MetricCard label="Session" value="Secure" tone="surface" palette={palette} />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <FigmaActionButton variant={variant} label="Add apps" onPress={() => navigation.navigate('AddApps')} />
          <FigmaActionButton variant={variant} label="Manage" tone="secondary" onPress={() => navigation.navigate('ManageApps')} />
        </View>

        {hiddenCount > 0 ? (
          <Pressable onPress={() => navigation.navigate('Vault')} style={[styles.vaultCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.vaultTitle, {color: palette.textPrimary}]}>Vault access</Text>
            <Text style={[styles.vaultBody, {color: palette.textSecondary}]}>
              {hiddenCount} hidden app{hiddenCount === 1 ? '' : 's'} are available through secret entry.
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Protected apps</Text>
          <Pressable onPress={() => navigation.navigate('ManageApps')}>
            <Text style={[styles.sectionLink, {color: palette.accent}]}>See all</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Loading protected apps...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {visibleApps.map((app, index) => (
              <Pressable
                key={app.packageName}
                onPress={() => {
                  void (async () => {
                    try {
                      const outcome = await launchCoordinator.launch(app.packageName);
                      if (outcome === 'auth_required') {
                        navigation.navigate('AuthGate');
                      } else if (outcome === 'secret_required') {
                        navigation.navigate('Vault');
                      }
                    } catch (error) {
                      Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch app.');
                    }
                  })();
                }}
                style={({pressed}) => [
                  styles.appCard,
                  {
                    backgroundColor: index % 2 === 0 ? palette.surface : palette.surfaceElevated,
                    borderColor: palette.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                <View style={[styles.appIcon, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.appIconText, {color: palette.accent}]}>{app.label.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.appBody}>
                  <Text style={[styles.appLabel, {color: palette.textPrimary}]}>{app.label}</Text>
                  <Text style={[styles.appMeta, {color: palette.textSecondary}]}>{app.mode === 'LOCK_HIDE' ? 'Lock + Hide' : app.mode}</Text>
                </View>
                <View style={[styles.modePill, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.modeText, {color: palette.accent}]}>Open</Text>
                </View>
              </Pressable>
            ))}

            <Pressable onPress={() => navigation.navigate('AddApps')} style={({pressed}) => [styles.addCard, {borderColor: palette.accent, backgroundColor: palette.accentSoft, opacity: pressed ? 0.92 : 1}]}>
              <Text style={[styles.addGlyph, {color: palette.accent}]}>+</Text>
              <Text style={[styles.addLabel, {color: palette.accent}]}>Add app</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.callout, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.calloutTitle, {color: palette.textPrimary}]}>Quick note</Text>
          <Text style={[styles.calloutBody, {color: palette.textSecondary}]}>Protected apps stay local to this device. No cloud unlock history is required.</Text>
        </View>

        <FigmaBanner screen="private-home" variant={variant} placement="native" title="Native advertisement" subtitle="Placed after functional content" tone="surfaceElevated" />

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav variant={variant} active="home" />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 17,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  profileChip: {
    minHeight: 30,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileChipText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  heroCard: {
    marginTop: 18,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  heroHeadline: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  metricGrid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  sectionLink: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  appCard: {
    width: '48%',
    minHeight: 126,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  addCard: {
    width: '48%',
    minHeight: 126,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  appBody: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 10,
  },
  appLabel: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  appMeta: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  modePill: {
    alignSelf: 'flex-start',
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  addGlyph: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
  addLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  callout: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  calloutTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  calloutBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },
  vaultCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  vaultTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  vaultBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },
  emptyCard: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 17,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  emptyText: {
    fontSize: 10,
    lineHeight: 13,
  },
  bottomSpacer: {
    height: 4,
  },
});
