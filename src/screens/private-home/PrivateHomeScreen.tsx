import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';
import {useAppVariant} from '../../hooks/useAppVariant';

type Palette = (typeof figmaPalette)[keyof typeof figmaPalette];

function modeLabel(mode: AppProtection['mode']): string {
  if (mode === 'LOCK_HIDE') {
    return 'BOTH';
  }
  if (mode === 'HIDE') {
    return 'HIDDEN';
  }
  if (mode === 'LOCK') {
    return 'LOCKED';
  }
  return 'OPEN';
}

function PrivateCard(props: {
  app: AppProtection;
  palette: Palette;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.appCard,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={[styles.appIcon, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.appIconText, {color: props.palette.accent}]}>{props.app.label.slice(0, 2).toUpperCase()}</Text>
      </View>
      <Text style={[styles.appLabel, {color: props.palette.textPrimary}]}>{props.app.label}</Text>
      <View style={[styles.badgePill, {backgroundColor: props.palette.accentSoft}]}>
        <Text style={[styles.badgeText, {color: props.palette.accent}]}>{modeLabel(props.app.mode)}</Text>
      </View>
    </Pressable>
  );
}

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const variant = useAppVariant();
  const palette = figmaPalette[variant];
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);

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

  const prioritizedApps = React.useMemo(() => {
    const priority: Record<AppProtection['mode'], number> = {
      LOCK_HIDE: 0,
      HIDE: 1,
      LOCK: 2,
      NONE: 3,
    };

    return [...apps]
      .sort((a, b) => priority[a.mode] - priority[b.mode] || a.label.localeCompare(b.label))
      .slice(0, 3);
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

  return (
    <FigmaPage variant={variant} style={variant === 'dark' ? styles.darkPage : styles.lightPage}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Private Apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          {variant === 'dark' ? 'Your selected private apps.' : 'Light theme.'}
        </Text>

        <FigmaBanner screen="private-home" variant={variant} title="Banner ad" tone="surface" />

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>My Private Apps</Text>

        <View style={styles.grid}>
          {prioritizedApps.map(app => (
            <PrivateCard key={app.packageName} app={app} palette={palette} onPress={() => void openApp(app)} />
          ))}

          {loading ? (
            <View style={[styles.appCard, {backgroundColor: propsBg(variant), borderColor: palette.border, alignItems: 'center', justifyContent: 'center'}]}>
              <Text style={[styles.loadingText, {color: palette.textSecondary}]}>Loading...</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => navigation.navigate('AddApps')}
              style={({pressed}) => [
                styles.addCard,
                {
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.accent,
                  opacity: pressed ? 0.94 : 1,
                },
              ]}>
              <Text style={[styles.addGlyph, {color: palette.accent}]}>+</Text>
              <Text style={[styles.addLabel, {color: palette.accent}]}>Add Apps</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => navigation.navigate('ManageApps')} style={[styles.manageRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.manageText, {color: palette.textPrimary}]}>Manage Apps</Text>
        </Pressable>

        <FigmaBanner screen="private-home" variant={variant} placement="native" title="Native advertisement" subtitle="Placed after functional content" tone="surfaceElevated" />

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav
          variant={variant}
          active="home"
          onHomePress={() => navigation.navigate('PrivateHome')}
          onGalleryPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      </ScrollView>
    </FigmaPage>
  );
}

function propsBg(variant: 'light' | 'dark') {
  return variant === 'dark' ? '#1B2232' : '#FFFFFF';
}

const styles = StyleSheet.create({
  darkPage: {
    backgroundColor: '#090D16',
  },
  lightPage: {
    backgroundColor: '#F7F8FC',
  },
  scrollContent: {
    paddingBottom: 18,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  title: {
    marginTop: 28,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 18,
  },
  sectionTitle: {
    marginTop: 40,
    marginBottom: 24,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  appCard: {
    width: '47.5%',
    minHeight: 232,
    borderWidth: 1,
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingVertical: 26,
  },
  appIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  appLabel: {
    marginTop: 28,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  badgePill: {
    marginTop: 20,
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  addCard: {
    width: '47.5%',
    minHeight: 232,
    borderWidth: 2,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGlyph: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '300',
  },
  addLabel: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  manageRow: {
    marginTop: 30,
    minHeight: 98,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  manageText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
  },
  loadingText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 8,
  },
});
