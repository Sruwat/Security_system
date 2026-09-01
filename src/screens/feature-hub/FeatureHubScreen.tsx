import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';

type FeatureCard = {
  title: string;
  subtitle: string;
  detail: string;
  index: string;
  accent: string;
  surface: string;
  action: () => void;
};

export function FeatureHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  const cards = React.useMemo<FeatureCard[]>(
    () => [
      {
        title: 'App Hide',
        subtitle: 'Keep selected apps in Vault',
        detail: 'Private launcher',
        index: '01',
        accent: '#38BDF8',
        surface: '#10213B',
        action: () => navigation.navigate('SecretEntry', {flow: 'APP_HIDE'}),
      },
      {
        title: 'Smart Hide',
        subtitle: 'Set up discreet private access',
        detail: 'Trigger and disguise',
        index: '02',
        accent: '#34D399',
        surface: '#102B2A',
        action: () => navigation.navigate('SecretEntry', {flow: 'SMART_HIDE'}),
      },
      {
        title: 'App Lock',
        subtitle: 'Lock apps with your credential',
        detail: 'PIN, password, pattern, biometric',
        index: '03',
        accent: '#FB7185',
        surface: '#351626',
        action: () => navigation.navigate('PrimaryLock', {flow: 'APP_LOCK'}),
      },
      {
        title: 'Lock + Hide',
        subtitle: 'Hide apps and require authentication',
        detail: 'Combined protection',
        index: '04',
        accent: '#C084FC',
        surface: '#271A42',
        action: () => navigation.navigate('SecretEntry', {flow: 'LOCK_HIDE'}),
      },
    ],
    [navigation],
  );

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandBlock}>
            <View style={[styles.brandDot, {backgroundColor: palette.accent}]} />
            <Text style={[styles.brand, {color: palette.textPrimary}]}>VaultX</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Settings')} style={[styles.settingsButton, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.settingsText, {color: palette.textSecondary}]}>Settings</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Vault')} style={[styles.vaultQuickCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.vaultIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.vaultIconText, {color: palette.accent}]}>V</Text>
          </View>
          <View style={styles.vaultCopy}>
            <Text style={[styles.vaultTitle, {color: palette.textPrimary}]}>My Vault</Text>
            <Text style={[styles.vaultMeta, {color: palette.textSecondary}]}>
              {protectedCount === 0 ? 'No apps protected yet' : `${protectedCount} app${protectedCount === 1 ? '' : 's'} protected`}
            </Text>
          </View>
          <Text style={[styles.openText, {color: palette.accent}]}>Open</Text>
        </Pressable>

        <View style={styles.intro}>
          <Text style={[styles.title, {color: palette.textPrimary}]}>Add Protection</Text>
          <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Choose a method to protect your apps.</Text>
        </View>

        <View style={styles.cards}>
          {cards.map(card => (
            <Pressable
              key={card.title}
              onPress={card.action}
              style={({pressed}) => [
                styles.card,
                {backgroundColor: card.surface, borderColor: card.accent, opacity: pressed ? 0.92 : 1},
              ]}>
              <View style={[styles.iconShell, {backgroundColor: `${card.accent}26`}]}>
                <View style={[styles.iconDot, {backgroundColor: card.accent}]} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>{card.title}</Text>
                <Text style={[styles.cardSubtitle, {color: palette.textSecondary}]}>{card.subtitle}</Text>
                <Text style={[styles.cardDetail, {color: card.accent}]}>{card.detail}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardIndex, {color: `${palette.textSecondary}99`}]}>{card.index}</Text>
                <Text style={[styles.cardArrow, {color: palette.textPrimary}]}>{'>'}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  content: {flexGrow: 1, paddingTop: 10, paddingBottom: 28},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBlock: {flexDirection: 'row', alignItems: 'center', gap: 8},
  brandDot: {width: 11, height: 11, borderRadius: 6},
  brand: {fontSize: 17, fontWeight: '800', letterSpacing: -0.2},
  settingsButton: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },
  settingsText: {fontSize: 11, fontWeight: '700'},
  vaultQuickCard: {marginTop: 24, minHeight: 88, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12},
  vaultIcon: {width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  vaultIconText: {fontSize: 20, fontWeight: '900'},
  vaultCopy: {flex: 1},
  vaultTitle: {fontSize: 16, lineHeight: 20, fontWeight: '800'},
  vaultMeta: {marginTop: 4, fontSize: 12, lineHeight: 16},
  openText: {fontSize: 12, fontWeight: '800'},
  intro: {marginTop: 26},
  title: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
  },
  cards: {
    marginTop: 22,
    gap: 14,
  },
  card: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconShell: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
  },
  cardDetail: {
    marginTop: 4,
    alignSelf: 'flex-start',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  cardRight: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  cardIndex: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardArrow: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
});
