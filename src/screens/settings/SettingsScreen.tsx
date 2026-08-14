import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';

const rows = [
  ['Appearance', 'System / Light / Dark'],
  ['Primary lock', 'Fingerprint + PIN'],
  ['Secret access', 'Calculator code'],
  ['Auto-lock', '30 seconds'],
  ['Manage apps', '3 protected'],
  ['Privacy info', 'On-device only'],
];

export function SettingsScreen() {
  const palette = figmaPalette.light;

  return (
    <FigmaPage variant="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Settings</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Privacy & appearance.</Text>

        <FigmaBanner variant="light" title="Banner ad" tone="surfaceElevated" />

        <View style={styles.list}>
          {rows.map(([title, subtitle]) => (
            <Pressable key={title} style={[styles.row, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{title}</Text>
                <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>{subtitle}</Text>
              </View>
              <Text style={[styles.chevron, {color: palette.textSecondary}]}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
        <FigmaBottomNav variant="light" active="settings" />
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
  list: {
    marginTop: 18,
    gap: 12,
  },
  row: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  rowSubtitle: {
    marginTop: 6,
    fontSize: 8,
    lineHeight: 10,
  },
  chevron: {
    width: 14,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 16,
  },
});
