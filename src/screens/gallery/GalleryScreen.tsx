import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

export function GalleryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const recentTiles = Array.from({length: 6}, (_, index) => index);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Gallery</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Private Gallery / protected media.</Text>

        <FigmaBanner variant="dark" title="Banner ad" tone="surfaceElevated" />

        <View style={styles.heroCard}>
          <Text style={[styles.heroGlyph, {color: palette.accent}]}>◇</Text>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Private Gallery</Text>
            <Text style={[styles.heroBody, {color: palette.textSecondary}]}>Protected media on this device</Text>
          </View>
        </View>

        <Pressable style={({pressed}) => [styles.openButton, {backgroundColor: '#A78BFA', opacity: pressed ? 0.92 : 1}]}>
          <Text style={styles.openButtonText}>Open Gallery</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Recent</Text>

        <View style={styles.grid}>
          {recentTiles.map(index => (
            <View key={index} style={[styles.tile, {backgroundColor: index % 2 === 0 ? palette.surfaceElevated : palette.accentSoft}]} />
          ))}
        </View>

        <FigmaBanner
          variant="dark"
          title="Native advertisement"
          subtitle="Placed after functional content"
          tone="surfaceElevated"
        />

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav variant="dark" active="gallery" />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 17,
  },
  time: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
  },
  title: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 11,
  },
  heroCard: {
    marginTop: 18,
    minHeight: 94,
    borderRadius: 21,
    backgroundColor: '#211A3A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  heroGlyph: {
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 30,
  },
  heroCopy: {
    gap: 6,
  },
  heroTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  heroBody: {
    fontSize: 8,
    lineHeight: 10,
  },
  openButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 17,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 16,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: 96,
    height: 78,
    borderRadius: 15,
  },
  bottomSpacer: {
    height: 16,
  },
});
