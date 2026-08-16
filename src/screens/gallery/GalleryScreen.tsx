import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';

export function GalleryScreen() {
  const palette = figmaPalette.dark;
  const recentTiles = Array.from({length: 6}, (_, index) => index);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Gallery</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Private Gallery / protected media.</Text>

        <FigmaBanner screen="gallery" variant="dark" title="Banner ad" tone="surfaceElevated" />

        <View style={styles.heroCard}>
          <View style={[styles.heroGlyphWrap, {borderColor: palette.accent}]}>
            <View style={[styles.heroGlyphInner, {backgroundColor: palette.accent}]} />
          </View>
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
          screen="gallery"
          variant="dark"
          placement="native"
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
  bottomSpacer: {
    height: 10,
  },
});
