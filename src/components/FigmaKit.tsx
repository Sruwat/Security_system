import React from 'react';
import {Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';

export type FigmaVariant = 'light' | 'dark';

export const figmaPalette = {
  light: {
    background: '#F7F8FC',
    surface: '#FFFFFF',
    surfaceElevated: '#F2F4F7',
    textPrimary: '#101828',
    textSecondary: '#667085',
    accent: '#6D5BD0',
    accentSoft: '#F1EEFF',
    border: '#E4E7EC',
  },
  dark: {
    background: '#090D16',
    surface: '#151C2B',
    surfaceElevated: '#171F2F',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    accent: '#A78BFA',
    accentSoft: '#211A3A',
    border: '#273247',
  },
} as const;

export function useFigmaPalette(variant: FigmaVariant) {
  return figmaPalette[variant];
}

export function FigmaPage(props: {variant: FigmaVariant; children: React.ReactNode; style?: object}) {
  const palette = useFigmaPalette(props.variant);
  return (
    <SafeAreaView style={[styles.page, {backgroundColor: palette.background}, props.style]}>
      <StatusBar barStyle={props.variant === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={palette.background} />
      <View style={styles.content}>{props.children}</View>
    </SafeAreaView>
  );
}

export function FigmaHeader(props: {variant: FigmaVariant; title: string; subtitle: string}) {
  const palette = useFigmaPalette(props.variant);
  return (
    <View style={styles.header}>
      <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
      <Text style={[styles.title, {color: palette.textPrimary}]}>{props.title}</Text>
      <Text style={[styles.subtitle, {color: palette.textSecondary}]}>{props.subtitle}</Text>
    </View>
  );
}

export function FigmaCard(props: {
  variant: FigmaVariant;
  children: React.ReactNode;
  selected?: boolean;
  tone?: 'surface' | 'elevated' | 'accent' | 'accentSoft';
  style?: object;
}) {
  const palette = useFigmaPalette(props.variant);
  const backgroundColor =
    props.tone === 'accent'
      ? palette.accent
      : props.tone === 'accentSoft'
        ? palette.accentSoft
        : props.tone === 'elevated'
          ? palette.surfaceElevated
          : palette.surface;
  const borderColor = props.selected ? palette.accent : palette.border;
  return <View style={[styles.card, {backgroundColor, borderColor}, props.style]}>{props.children}</View>;
}

export function FigmaRowCard(props: {
  variant: FigmaVariant;
  title: string;
  subtitle: string;
  selected?: boolean;
  tone?: 'surface' | 'accentSoft' | 'elevated';
  rightLabel?: string;
  icon?: string;
  onPress?: () => void;
  compact?: boolean;
}) {
  const palette = useFigmaPalette(props.variant);
  const backgroundColor =
    props.tone === 'accentSoft'
      ? palette.accentSoft
      : props.tone === 'elevated'
        ? palette.surfaceElevated
        : palette.surface;
  const borderColor = props.selected ? palette.accent : palette.border;

  return (
    <Pressable onPress={props.onPress} style={({pressed}) => [styles.rowCard, {backgroundColor, borderColor, opacity: pressed ? 0.92 : 1}]}>
      {props.icon ? (
        <View style={[styles.iconBox, {backgroundColor: palette.accentSoft}]}>
          <Text style={[styles.iconLabel, {color: palette.accent}]}>{props.icon}</Text>
        </View>
      ) : null}
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, {color: palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.rowSubtitle, {color: palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      {props.rightLabel ? (
        <View style={[styles.badge, {backgroundColor: props.selected ? palette.accentSoft : palette.accentSoft}]}>
          <Text style={[styles.badgeText, {color: palette.accent}]}>{props.rightLabel}</Text>
        </View>
      ) : (
        <Text style={[styles.chevron, {color: palette.textSecondary}]}>›</Text>
      )}
    </Pressable>
  );
}

export function FigmaActionButton(props: {variant: FigmaVariant; label: string; onPress?: () => void; tone?: 'primary' | 'secondary'}) {
  const palette = useFigmaPalette(props.variant);
  const isSecondary = props.tone === 'secondary';
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.actionButton,
        {
          backgroundColor: isSecondary ? palette.surface : palette.accent,
          borderColor: isSecondary ? palette.border : 'transparent',
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <Text style={[styles.actionText, {color: isSecondary ? palette.accent : '#FFFFFF'}]}>{props.label}</Text>
    </Pressable>
  );
}

export function FigmaBottomNav(props: {variant: FigmaVariant; active: 'home' | 'gallery' | 'settings'}) {
  const palette = useFigmaPalette(props.variant);
  return (
    <View style={[styles.bottomNav, {backgroundColor: props.variant === 'dark' ? palette.surface : palette.surface}]}>
      <View style={[styles.navPill, {backgroundColor: palette.accentSoft, left: props.active === 'home' ? 8 : props.active === 'gallery' ? 113 : 218}]} />
      <Text style={[styles.navIcon, {left: 48, color: props.active === 'home' ? palette.accent : palette.textSecondary}]}>▦</Text>
      <Text style={[styles.navIcon, {left: 154, color: props.active === 'gallery' ? palette.accent : palette.textSecondary}]}>◇</Text>
      <Text style={[styles.navIcon, {left: 260, color: props.active === 'settings' ? palette.accent : palette.textSecondary}]}>⚙</Text>
    </View>
  );
}

export function FigmaBanner(props: {variant: FigmaVariant; title: string; subtitle?: string; tone?: 'surfaceElevated' | 'surface'}) {
  const palette = useFigmaPalette(props.variant);
  const backgroundColor = props.tone === 'surface' ? palette.surface : palette.surfaceElevated;
  return (
    <View style={[styles.banner, {backgroundColor, borderColor: palette.border}]}>
      <Text style={[styles.bannerKicker, {color: palette.textSecondary}]}>Sponsored</Text>
      <Text style={[styles.bannerTitle, {color: palette.textPrimary}]}>{props.title}</Text>
      {props.subtitle ? <Text style={[styles.bannerSubtitle, {color: palette.textSecondary}]}>{props.subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 17,
    paddingTop: 13,
  },
  header: {
    marginBottom: 15,
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
    lineHeight: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
  },
  rowCard: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
  badge: {
    minWidth: 54,
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  chevron: {
    width: 14,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
  },
  bottomNav: {
    height: 54,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    overflow: 'hidden',
  },
  navPill: {
    position: 'absolute',
    width: 86,
    height: 34,
    top: 10,
    borderRadius: 17,
  },
  navIcon: {
    position: 'absolute',
    top: 18,
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  banner: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerKicker: {
    fontSize: 7,
    lineHeight: 9,
  },
  bannerTitle: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },
  bannerSubtitle: {
    marginTop: 6,
    fontSize: 8,
    lineHeight: 10,
  },
});
