import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {usePrimaryDrawer} from '../../navigation/usePrimaryDrawer';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {secretAccessRouter} from '../../services/secret/SecretAccessRouter';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, SecretAccessType} from '../../types/domain';

type AccessShortcut = {
  key: string;
  title: string;
  subtitle: string;
  glyph: string;
  accent: string;
  onPress: () => void;
};

export function GalleryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const [settingsType, setSettingsType] = React.useState<SecretAccessType>('triple_tap');
  const [hiddenCount, setHiddenCount] = React.useState(0);
  const [lockedCount, setLockedCount] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const [settings, apps] = await Promise.all([
        localDataRepository.getSettings(),
        localDataRepository.getProtectedApps(),
      ]);
      if (!active) {
        return;
      }
      setSettingsType(settings.secretAccessType);
      setHiddenCount(apps.filter(app => app.enabled && app.isHidden).length);
      setLockedCount(apps.filter(app => app.enabled && app.isLocked).length);
    };

    void load();
    const unsubscribeSettings = localDataRepository.subscribeToSettings(next => {
      setSettingsType(next.secretAccessType);
    });
    const unsubscribeApps = localDataRepository.subscribeToProtectedApps(nextApps => {
      setHiddenCount(nextApps.filter(app => app.enabled && app.isHidden).length);
      setLockedCount(nextApps.filter(app => app.enabled && app.isLocked).length);
    });

    return () => {
      active = false;
      unsubscribeSettings();
      unsubscribeApps();
    };
  }, []);

  const openHiddenApps = React.useCallback(async () => {
    const outcome = await launchCoordinator.completeSecretEntry();
    if (outcome === 'app_launched') {
      navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
      return;
    }
    if (outcome === 'auth_required') {
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

    Alert.alert('Nothing hidden yet', 'Hidden Apps abhi configure nahi hui hain.');
  }, [navigation]);

  const accessShortcuts = React.useMemo<AccessShortcut[]>(
    () => [
      {
        key: 'calculator',
        title: 'Calculator',
        subtitle: settingsType === 'calculator' ? 'Your secret code opens Hidden Apps' : 'Open calculator disguise',
        glyph: '⌗',
        accent: '#4F8CFF',
        onPress: () => navigation.navigate('Calculator'),
      },
      {
        key: 'clock',
        title: 'Clock',
        subtitle: settingsType === 'clock' ? 'Saved hour unlocks private area' : 'Open clock disguise',
        glyph: '◔',
        accent: '#A78BFA',
        onPress: () => navigation.navigate('Clock'),
      },
      {
        key: 'calendar',
        title: 'Calendar',
        subtitle: settingsType === 'calendar' ? 'Saved date opens private area' : 'Open calendar disguise',
        glyph: '31',
        accent: '#22C55E',
        onPress: () => navigation.navigate('Calendar'),
      },
      {
        key: 'gallery',
        title: 'Gallery',
        subtitle: settingsType === 'gallery' ? 'Open Hidden Apps with your saved trigger' : 'Set Gallery as your secret access method',
        glyph: '▣',
        accent: '#F59E0B',
        onPress: () => {
          if (settingsType === 'gallery') {
            void openHiddenApps();
            return;
          }
          navigation.navigate('SecretEntry', {flow: 'SMART_HIDE'});
        },
      },
      {
        key: 'hidden',
        title: 'Hidden Apps',
        subtitle: hiddenCount > 0 ? `${hiddenCount} hidden app ready in Vault` : 'Open your private area',
        glyph: '◇',
        accent: '#8B5CF6',
        onPress: () => {
          void openHiddenApps();
        },
      },
      {
        key: 'dashboard',
        title: 'Protected Dashboard',
        subtitle: lockedCount > 0 ? `${lockedCount} locked app under protection` : 'Manage hide, lock, and pattern',
        glyph: '▤',
        accent: '#EC4899',
        onPress: () => navigation.navigate('ManageApps'),
      },
    ],
    [hiddenCount, lockedCount, navigation, openHiddenApps, settingsType],
  );

  return (
    <FigmaRootLayout
      variant="dark"
      title="VaultX"
      drawerTitle="VaultX"
      drawerOpen={drawerOpen}
      onDrawerOpen={openDrawer}
      onDrawerClose={closeDrawer}
      drawerDestinations={drawerDestinations}
      bottomNav={
        <FigmaBottomNav
          variant="dark"
          active="access"
          onLauncherPress={() => navigation.navigate('FeatureHub')}
          onDashboardPress={() => navigation.navigate('Vault')}
          onAccessPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Secret Access</Text>
        <Text style={[styles.heroSubtitle, {color: palette.textSecondary}]}>
          Yahin se calculator, clock, calendar, dashboard, aur Hidden Apps access hongi.
        </Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroGlyphShell, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.heroGlyph, {color: palette.accent}]}>◇</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroCardTitle, {color: palette.textPrimary}]}>Private area shortcuts</Text>
            <Text style={[styles.heroCardBody, {color: palette.textSecondary}]}>
              Disguise access, hidden apps, aur protected dashboard sab ek hi screen par connected hain.
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {accessShortcuts.map(shortcut => (
            <Pressable
              key={shortcut.key}
              onPress={shortcut.onPress}
              style={({pressed}) => [
                styles.shortcutCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.94 : 1,
                },
              ]}>
              <View style={[styles.shortcutIcon, {backgroundColor: `${shortcut.accent}22`, borderColor: `${shortcut.accent}55`}]}>
                <Text style={[styles.shortcutGlyph, {color: shortcut.accent}]}>{shortcut.glyph}</Text>
              </View>
              <Text style={[styles.shortcutTitle, {color: palette.textPrimary}]}>{shortcut.title}</Text>
              <Text style={[styles.shortcutSubtitle, {color: palette.textSecondary}]}>{shortcut.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => {
            void openHiddenApps();
          }}
          style={({pressed}) => [
            styles.primaryButton,
            {backgroundColor: '#A78BFA', opacity: pressed ? 0.94 : 1},
          ]}>
          <Text style={styles.primaryButtonText}>Open Hidden Apps</Text>
        </Pressable>
      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 12,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  heroCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 16,
  },
  heroGlyphShell: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyph: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroCopy: {
    flex: 1,
  },
  heroCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  heroCardBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  grid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  shortcutCard: {
    width: '48%',
    minHeight: 166,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  shortcutIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutGlyph: {
    fontSize: 20,
    fontWeight: '800',
  },
  shortcutTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  shortcutSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
});
