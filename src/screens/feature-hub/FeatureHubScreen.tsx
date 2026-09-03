import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

type FeatureCard = {
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  index: string;
  accent: string;
  border: string;
  surface: string;
  action: () => void;
};

export function FeatureHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const palette = figmaPalette.dark;
  const [protectedCount, setProtectedCount] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      void localDataRepository.getProtectedApps().then(apps => {
        if (active) {
          setProtectedCount(apps.filter(app => app.enabled).length);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const cards: FeatureCard[] = [
    {
      title: 'App Hide',
      subtitle: 'Disguise with a fake icon + secret entry',
      badge: 'Clock · Calendar · Calc',
      icon: '◉̸',
      index: '01',
      accent: '#60A5FA',
      border: '#31598F',
      surface: '#111C34',
      action: () => navigation.navigate('SecretEntry', {flow: 'APP_HIDE'}),
    },
    {
      title: 'Smart Hide',
      subtitle: 'Gesture-triggered instant disappear',
      badge: 'Triple Tap · Shake · More',
      icon: '✦',
      index: '02',
      accent: '#34D399',
      border: '#2A7868',
      surface: '#0F211F',
      action: () => navigation.navigate('SecretEntry', {flow: 'SMART_HIDE'}),
    },
    {
      title: 'App Lock',
      subtitle: 'Lock apps with PIN, password or pattern',
      badge: 'PIN · Pattern · Bio',
      icon: '▣',
      index: '03',
      accent: '#FB7185',
      border: '#85344A',
      surface: '#25131D',
      action: () => navigation.navigate('PrimaryLock', {flow: 'APP_LOCK'}),
    },
    {
      title: 'Lock + Hide',
      subtitle: 'Ultimate protection - lock and hide combined',
      badge: 'Step 1->2 Combined',
      icon: '⬡',
      index: '04',
      accent: '#C084FC',
      border: '#62428D',
      surface: '#1C1532',
      action: () => navigation.navigate('SecretEntry', {flow: 'LOCK_HIDE'}),
    },
  ];

  return (
    <FigmaPage variant="dark" style={styles.page}>
      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: 104 + insets.bottom}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandBlock}>
            <View style={styles.brandDot} />
            <Text style={[styles.brand, {color: palette.textPrimary}]}>VaultX</Text>
          </View>
          <Pressable
            accessibilityLabel="Open settings"
            onPress={() => navigation.navigate('Settings')}
            style={({pressed}) => [styles.settingsButton, {opacity: pressed ? 0.72 : 1}]}
            hitSlop={10}>
            <Text style={styles.settingsGlyph}>⚙</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Vault')}
          style={({pressed}) => [styles.vaultQuickCard, {opacity: pressed ? 0.94 : 1}]}>
          <View style={styles.vaultIcon}>
            <Text style={styles.vaultIconText}>▣</Text>
          </View>
          <View style={styles.vaultCopy}>
            <Text style={[styles.vaultTitle, {color: palette.textPrimary}]}>My Vault</Text>
            <Text style={[styles.vaultMeta, {color: palette.textSecondary}]}>
              {protectedCount === 0 ? 'No apps protected yet' : `${protectedCount} app${protectedCount === 1 ? '' : 's'} protected`}
            </Text>
          </View>
          <View style={styles.openPill}>
            <Text style={styles.openText}>Open {'>'}</Text>
          </View>
        </Pressable>

        <View style={styles.intro}>
          <Text style={[styles.title, {color: palette.textPrimary}]}>Add Protection</Text>
          <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Choose a method to protect your apps</Text>
        </View>

        <View style={styles.cards}>
          {cards.map(card => (
            <Pressable
              key={card.title}
              onPress={card.action}
              style={({pressed}) => [
                styles.card,
                {backgroundColor: card.surface, borderColor: card.border, opacity: pressed ? 0.92 : 1},
              ]}>
              <Text style={[styles.cardIndex, {color: `${card.accent}80`}]}>{card.index}</Text>
              <View style={[styles.iconShell, {backgroundColor: `${card.accent}22`, borderColor: `${card.accent}4D`}]}>
                <Text style={[styles.cardIcon, {color: card.accent}]}>{card.icon}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>{card.title}</Text>
                <Text style={[styles.cardSubtitle, {color: palette.textSecondary}]}>{card.subtitle}</Text>
              </View>
              <View style={[styles.cardBadge, {borderColor: `${card.accent}4D`, backgroundColor: `${card.accent}12`}]}>
                <Text style={[styles.cardBadgeText, {color: card.accent}]} numberOfLines={1}>{card.badge}</Text>
              </View>
              <View style={[styles.cardArrow, {backgroundColor: `${card.accent}22`}]}>
                <Text style={[styles.cardArrowText, {color: card.accent}]}>{'>'}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomDock, {bottom: insets.bottom + 10}]}>
        <FigmaBottomNav
          variant="dark"
          active="launcher"
          onLauncherPress={() => navigation.navigate('FeatureHub')}
          onDashboardPress={() => navigation.navigate('Vault')}
          onAccessPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  page: {position: 'relative'},
  content: {flexGrow: 1, paddingHorizontal: 20, paddingTop: 12},
  topRow: {height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  brandBlock: {flexDirection: 'row', alignItems: 'center', gap: 9},
  brandDot: {width: 9, height: 9, borderRadius: 99, backgroundColor: '#818CF8', shadowColor: '#818CF8', shadowOpacity: 0.8, shadowRadius: 8, elevation: 4},
  brand: {fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.3},
  settingsButton: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)'},
  settingsGlyph: {color: '#CBD5E1', fontSize: 20, lineHeight: 22},
  vaultQuickCard: {marginTop: 20, minHeight: 74, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(129,140,248,0.30)', backgroundColor: '#11192E', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11},
  vaultIcon: {width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#24234A'},
  vaultIconText: {fontSize: 22, lineHeight: 24, color: '#A5B4FC'},
  vaultCopy: {flex: 1},
  vaultTitle: {fontSize: 15, lineHeight: 19, fontWeight: '800'},
  vaultMeta: {marginTop: 3, fontSize: 11, lineHeight: 15},
  openPill: {height: 30, borderRadius: 15, paddingHorizontal: 11, justifyContent: 'center', backgroundColor: 'rgba(129,140,248,0.14)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.34)'},
  openText: {fontSize: 10, lineHeight: 13, fontWeight: '800', color: '#A5B4FC'},
  intro: {marginTop: 26},
  title: {fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6},
  subtitle: {marginTop: 5, fontSize: 12, lineHeight: 17},
  cards: {marginTop: 20, gap: 12},
  card: {minHeight: 86, borderRadius: 17, borderWidth: 1, paddingLeft: 14, paddingRight: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden'},
  cardIndex: {position: 'absolute', top: 8, right: 13, fontSize: 9, lineHeight: 11, fontWeight: '800'},
  iconShell: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  cardIcon: {fontSize: 23, lineHeight: 27, fontWeight: '700'},
  cardCopy: {flex: 1, paddingRight: 4},
  cardTitle: {fontSize: 14, lineHeight: 18, fontWeight: '800'},
  cardSubtitle: {marginTop: 2, fontSize: 10, lineHeight: 14},
  cardBadge: {position: 'absolute', left: 67, bottom: 9, maxWidth: 188, height: 19, borderRadius: 10, borderWidth: 1, paddingHorizontal: 7, justifyContent: 'center'},
  cardBadgeText: {fontSize: 8, lineHeight: 10, fontWeight: '700'},
  cardArrow: {width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 17},
  cardArrowText: {fontSize: 18, lineHeight: 20, fontWeight: '700'},
  bottomDock: {position: 'absolute', left: 18, right: 18},
});
