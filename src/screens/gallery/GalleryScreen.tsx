import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBanner, FigmaBottomNav, FigmaRootLayout, figmaPalette} from '../../components/FigmaKit';
import {useTimedTapTrigger} from '../../hooks/useTimedTapTrigger';
import type {RootStackParamList} from '../../navigation/routes';
import {usePrimaryDrawer} from '../../navigation/usePrimaryDrawer';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {secretAccessRouter} from '../../services/secret/SecretAccessRouter';
import {localDataRepository} from '../../storage/LocalDataRepository';

export function GalleryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const {drawerOpen, openDrawer, closeDrawer, drawerDestinations} = usePrimaryDrawer();
  const recentTiles = Array.from({length: 6}, (_, index) => index);
  const [secretAccessType, setSecretAccessType] = React.useState<'gallery' | 'triple_tap' | 'other'>('other');

  React.useEffect(() => {
    void localDataRepository.getSettings().then(settings => {
      if (settings.secretAccessType === 'gallery') {
        setSecretAccessType('gallery');
        return;
      }
      if (settings.secretAccessType === 'triple_tap') {
        setSecretAccessType('triple_tap');
        return;
      }
      setSecretAccessType('other');
    });
  }, []);

  const triggerSecret = useTimedTapTrigger({
    key: 'gallery-secret',
    onTrigger: async () => {
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
      }
    },
  });

  return (
    <FigmaRootLayout
      variant="dark"
      title="Gallery"
      drawerTitle="Smart App Lock"
      drawerOpen={drawerOpen}
      onDrawerOpen={openDrawer}
      onDrawerClose={closeDrawer}
      drawerDestinations={drawerDestinations}
      bottomNav={
        <FigmaBottomNav
          variant="dark"
          active="gallery"
          onHomePress={() => navigation.navigate('PrivateHome')}
          onGalleryPress={() => navigation.navigate('Gallery')}
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Private Gallery / protected media.</Text>

        <FigmaBanner screen="gallery" variant="dark" title="Banner ad" tone="surfaceElevated" />

        <Pressable onPress={secretAccessType === 'triple_tap' ? triggerSecret : undefined} style={styles.heroCard}>
          <View style={[styles.heroGlyphWrap, {borderColor: palette.accent}]}>
            <View style={[styles.heroGlyphInner, {backgroundColor: palette.accent}]} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Private Gallery</Text>
            <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Protected media on this device</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={secretAccessType === 'gallery' ? triggerSecret : undefined}
          style={({pressed}) => [styles.openButton, {backgroundColor: '#A78BFA', opacity: pressed ? 0.92 : 1}]}>
          <Text style={styles.openButtonText}>Open Gallery</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Recent</Text>

        <View style={styles.grid}>
          {recentTiles.map(index => (
            <View key={index} style={[styles.tile, {backgroundColor: index % 2 === 0 ? palette.surfaceElevated : palette.accentSoft}]} />
          ))}
        </View>

        <FigmaBanner
          screen="gallery"
          variant="dark"
          placement="native"
          title="Native advertisement"
          subtitle="Placed after functional content"
          tone="surfaceElevated"
        />
      </ScrollView>
    </FigmaRootLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 17,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 18,
  },
  heroCard: {
    marginTop: 18,
    minHeight: 194,
    borderRadius: 40,
    backgroundColor: '#2B2146',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 42,
    gap: 26,
  },
  heroGlyphWrap: {
    width: 34,
    height: 34,
    borderWidth: 5,
    transform: [{rotate: '45deg'}],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyphInner: {
    width: 14,
    height: 14,
  },
  heroCopy: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  heroBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  openButton: {
    marginTop: 20,
    minHeight: 100,
    borderRadius: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 42,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
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
    justifyContent: 'space-between',
    rowGap: 24,
  },
  tile: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 28,
  },
});
