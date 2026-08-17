import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {usePrimaryDrawer} from '../../navigation/usePrimaryDrawer';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {describeProtection, lockTypeLabel, normalizeProtection, protectionModeFromFlags} from '../../services/protection/protectionState';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection} from '../../types/domain';

function countLabel(value: number, singular: string, plural = singular) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function StatCard(props: {
  label: string;
  value: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  textPrimary: string;
  textSecondary: string;
}) {
  return (
    <View style={[styles.statCard, {backgroundColor: props.accentSoft}]}>
      <Text style={[styles.statValue, {color: props.accent}]}>{props.value}</Text>
      <Text style={[styles.statLabel, {color: props.textPrimary}]}>{props.label}</Text>
      <Text style={[styles.statSubtitle, {color: props.textSecondary}]}>{props.subtitle}</Text>
    </View>
  );
}

function QuickAction(props: {
  title: string;
  subtitle: string;
  onPress: () => void;
  palette: typeof figmaPalette.light;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.quickAction,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <Text style={[styles.quickActionTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
      <Text style={[styles.quickActionSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
    </Pressable>
  );
}

function AppRow(props: {
  app: AppProtection;
  palette: typeof figmaPalette.light;
  onPress: () => void;
  onLaunch: () => void;
}) {
  const status = describeProtection(props.app);
  const accent = props.app.isHidden && props.app.isLocked ? '#D92D20' : props.app.isHidden ? props.palette.accent : '#1D4ED8';

  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.appRow,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.95 : 1,
        },
      ]}>
      <View style={[styles.appAvatar, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.appAvatarText, {color: props.palette.accent}]}>
          {props.app.label.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.appBody}>
        <Text style={[styles.appName, {color: props.palette.textPrimary}]} numberOfLines={1}>
          {props.app.label}
        </Text>
        <Text style={[styles.appStatus, {color: accent}]}>{status}</Text>
        <Text style={[styles.appMeta, {color: props.palette.textSecondary}]}>
          {props.app.isLocked ? `${lockTypeLabel(props.app.lockType)} lock` : 'No lock'} {'|'} Auto-lock {props.app.autoLockSeconds ?? 30}s
        </Text>
      </View>
      <Pressable onPress={props.onLaunch} style={[styles.launchPill, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.launchPillText, {color: props.palette.accent}]}>Open</Text>
      </Pressable>
    </Pressable>
  );
}

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      const stored = await localDataRepository.getProtectedApps();
      setApps(stored.map(normalizeProtection));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadApps();
    }, [loadApps]),
  );

  const counts = React.useMemo(() => {
    const protectedApps = apps.filter(app => app.enabled);
    const hiddenApps = protectedApps.filter(app => app.isHidden);
    const lockedApps = protectedApps.filter(app => app.isLocked);

    return {
      protectedApps,
      hiddenApps,
      lockedApps,
    };
  }, [apps]);

  const openApp = React.useCallback(
    async (app: AppProtection) => {
      try {
        const outcome = await launchCoordinator.launch(app.packageName);
        if (outcome === 'auth_required') {
          navigation.navigate('AuthGate');
          return;
        }
        if (outcome === 'secret_required') {
          navigation.navigate('Calculator');
        }
      } catch (error) {
        Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch app.');
      }
    },
    [navigation],
  );

  const editApp = React.useCallback(
    (app: AppProtection) => {
      navigation.navigate('ProtectionMode', {
        draft: {
          app: {
            packageName: app.packageName,
            label: app.label,
            iconUri: app.iconUri,
            systemApp: false,
          },
          mode: protectionModeFromFlags(app),
          authMethod: app.lockType ?? app.authMethod ?? 'PIN',
          autoLockSeconds: app.autoLockSeconds ?? 30,
        },
        onboarding: false,
      });
    },
    [navigation],
  );

  return (
    <FigmaRootLayout
      variant="light"
      title="Protection Dashboard"
      drawerTitle="Smart App Lock"
      drawerOpen={drawerOpen}
      onDrawerOpen={openDrawer}
      onDrawerClose={closeDrawer}
      drawerDestinations={drawerDestinations}
      bottomNav={
        <FigmaBottomNav
          variant="light"
          active="home"
          onHomePress={() => navigation.navigate('PrivateHome')}
          onGalleryPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          Hide apps, lock apps, or combine both protections from one simple control center.
        </Text>

        <View style={styles.statsRow}>
          <StatCard
            label="Protected Apps"
            value={String(counts.protectedApps.length)}
            subtitle={countLabel(counts.protectedApps.length, 'app')}
            accent={palette.accent}
            accentSoft={palette.accentSoft}
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
          />
          <StatCard
            label="Hidden Apps"
            value={String(counts.hiddenApps.length)}
            subtitle={countLabel(counts.hiddenApps.length, 'hidden app', 'hidden apps')}
            accent="#1D4ED8"
            accentSoft="#DBEAFE"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
          />
          <StatCard
            label="Locked Apps"
            value={String(counts.lockedApps.length)}
            subtitle={countLabel(counts.lockedApps.length, 'locked app', 'locked apps')}
            accent="#D92D20"
            accentSoft="#FEE4E2"
            textPrimary={palette.textPrimary}
            textSecondary={palette.textSecondary}
          />
        </View>

        <View style={styles.quickActions}>
          <QuickAction
            title="Hide Apps"
            subtitle="Select apps that should live only in the hidden area."
            onPress={() => navigation.navigate('AddApps', {preset: 'HIDE'})}
            palette={palette}
          />
          <QuickAction
            title="Lock Apps"
            subtitle="Add a PIN, password, pattern, or biometric gate."
            onPress={() => navigation.navigate('AddApps', {preset: 'LOCK'})}
            palette={palette}
          />
          <QuickAction
            title="Hide + Lock"
            subtitle="Keep apps private and require authentication before access."
            onPress={() => navigation.navigate('AddApps', {preset: 'LOCK_HIDE'})}
            palette={palette}
          />
          <QuickAction
            title="Secret Access"
            subtitle="Open the hidden area through your configured secret method."
            onPress={() => navigation.navigate('Calculator')}
            palette={palette}
          />
        </View>

        <View style={[styles.sectionCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Protected Apps</Text>
            <Pressable onPress={() => navigation.navigate('ManageApps')}>
              <Text style={[styles.sectionLink, {color: palette.accent}]}>Manage all</Text>
            </Pressable>
          </View>

          {loading ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>Loading protected apps...</Text>
          ) : counts.protectedApps.length === 0 ? (
            <Text style={[styles.stateText, {color: palette.textSecondary}]}>
              No protected apps yet. Start with Hide Apps, Lock Apps, or Hide + Lock.
            </Text>
          ) : (
            <View style={styles.appList}>
              {counts.protectedApps.map(app => (
                <AppRow
                  key={app.packageName}
                  app={app}
                  palette={palette}
                  onPress={() => editApp(app)}
                  onLaunch={() => void openApp(app)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Current user flow</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Hide only: Secret Access {'>'} Hidden Apps</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Lock only: Open App {'>'} Lock Screen {'>'} App</Text>
          <Text style={[styles.flowLine, {color: palette.textSecondary}]}>Hide + Lock: Secret Access {'>'} Lock Screen {'>'} Hidden Apps</Text>
        </View>
      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 18,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  statSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },
  quickActions: {
    marginTop: 20,
    gap: 12,
  },
  quickAction: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  quickActionSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionCard: {
    marginTop: 20,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  stateText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  appList: {
    marginTop: 14,
    gap: 12,
  },
  appRow: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  appBody: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  appStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  appMeta: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
  },
  launchPill: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchPillText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  flowLine: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
  },
});
