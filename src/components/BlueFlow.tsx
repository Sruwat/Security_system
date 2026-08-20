import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {FigmaPage} from './FigmaKit';

export const blueFlowPalette = {
  page: '#08111F',
  pageAlt: '#0D1729',
  panel: '#111D33',
  panelAlt: '#152540',
  border: '#223A63',
  borderStrong: '#3B82F6',
  textPrimary: '#F8FBFF',
  textSecondary: '#9FB4D2',
  textMuted: '#6F86A7',
  accent: '#4F8CFF',
  accentStrong: '#2F6BFF',
  accentSoft: '#13294A',
  accentTint: '#173764',
  success: '#60A5FA',
  danger: '#F87171',
} as const;

export function BlueFlowPage(props: {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: object;
  pageStyle?: object;
}) {
  const content = props.scrollable === false ? (
    <View style={[styles.body, props.contentContainerStyle]}>{props.children}</View>
  ) : (
    <ScrollView contentContainerStyle={[styles.body, props.contentContainerStyle]} showsVerticalScrollIndicator={false}>
      {props.children}
    </ScrollView>
  );

  return (
    <FigmaPage variant="dark" style={[styles.page, props.pageStyle]}>
      <View pointerEvents="none" style={styles.backgroundWrap}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />
      </View>
      {content}
    </FigmaPage>
  );
}

export function BlueProgressHeader(props: {stepLabel: string; progress: number; onBackPress: () => void}) {
  return (
    <View style={styles.progressRow}>
      <Pressable onPress={props.onBackPress} style={({pressed}) => [styles.backButton, {opacity: pressed ? 0.94 : 1}]}>
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.fill, {width: `${Math.max(0, Math.min(100, props.progress * 100))}%`}]} />
      </View>
      <Text style={styles.stepLabel}>{props.stepLabel}</Text>
    </View>
  );
}

export function BlueHero(props: {icon: string; title: string; subtitle: string}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroOrb}>
        <View style={styles.heroRing} />
        <View style={styles.heroInner}>
          <Text style={styles.heroIcon}>{props.icon}</Text>
        </View>
      </View>
      <Text style={styles.heroTitle}>{props.title}</Text>
      <Text style={styles.heroSubtitle}>{props.subtitle}</Text>
    </View>
  );
}

export function BluePanel(props: {children: React.ReactNode; tone?: 'base' | 'soft'; style?: object}) {
  return <View style={[styles.panel, props.tone === 'soft' ? styles.panelSoft : null, props.style]}>{props.children}</View>;
}

export function BlueSectionTitle(props: {title: string; subtitle?: string}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      {props.subtitle ? <Text style={styles.sectionSubtitle}>{props.subtitle}</Text> : null}
    </View>
  );
}

export function BlueChoiceCard(props: {
  title: string;
  subtitle: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  rightLabel?: string;
}) {
  const card = (
    <>
      <View style={styles.choiceBody}>
        {props.icon ? <Text style={styles.choiceIcon}>{props.icon}</Text> : null}
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>{props.title}</Text>
          <Text style={styles.choiceSubtitle}>{props.subtitle}</Text>
        </View>
      </View>
      <View style={[styles.choiceBadge, props.selected ? styles.choiceBadgeActive : null]}>
        <Text style={[styles.choiceBadgeText, props.selected ? styles.choiceBadgeTextActive : null]}>{props.rightLabel ?? (props.selected ? 'Selected' : 'Select')}</Text>
      </View>
    </>
  );

  if (!props.onPress) {
    return <View style={[styles.choiceCard, props.selected ? styles.choiceCardSelected : null]}>{card}</View>;
  }

  return (
    <Pressable onPress={props.onPress} style={({pressed}) => [styles.choiceCard, props.selected ? styles.choiceCardSelected : null, {opacity: pressed ? 0.94 : 1}]}>
      {card}
    </Pressable>
  );
}

export function BluePrimaryButton(props: {label: string; onPress?: () => void; secondary?: boolean}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [styles.button, props.secondary ? styles.buttonSecondary : null, {opacity: pressed ? 0.94 : 1}]}>
      <Text style={[styles.buttonText, props.secondary ? styles.buttonTextSecondary : null]}>{props.label}</Text>
      {!props.secondary ? <Text style={styles.buttonArrow}>→</Text> : null}
    </Pressable>
  );
}

export function BlueInfoLine(props: {label: string; value: string}) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{props.label}</Text>
      <Text style={styles.infoValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: blueFlowPalette.page,
  },
  backgroundWrap: {
    ...StyleSheet.absoluteFill,
  },
  topGlow: {
    position: 'absolute',
    top: -120,
    left: -50,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#173764',
    opacity: 0.34,
  },
  bottomGlow: {
    position: 'absolute',
    right: -120,
    bottom: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#10284D',
    opacity: 0.28,
  },
  body: {
    flexGrow: 1,
    paddingTop: 22,
    paddingBottom: 26,
    gap: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: blueFlowPalette.border,
    backgroundColor: blueFlowPalette.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: blueFlowPalette.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: blueFlowPalette.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: blueFlowPalette.accent,
  },
  stepLabel: {
    color: blueFlowPalette.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  heroOrb: {
    width: 118,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRing: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1,
    borderColor: '#214271',
  },
  heroInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: blueFlowPalette.borderStrong,
    backgroundColor: '#10203B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 30,
  },
  heroTitle: {
    color: blueFlowPalette.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    color: blueFlowPalette.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: blueFlowPalette.border,
    backgroundColor: blueFlowPalette.panel,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  panelSoft: {
    backgroundColor: blueFlowPalette.panelAlt,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    color: blueFlowPalette.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  sectionSubtitle: {
    color: blueFlowPalette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  choiceCard: {
    minHeight: 92,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: blueFlowPalette.border,
    backgroundColor: blueFlowPalette.panel,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceCardSelected: {
    borderColor: blueFlowPalette.borderStrong,
    backgroundColor: blueFlowPalette.panelAlt,
  },
  choiceBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceIcon: {
    fontSize: 24,
  },
  choiceCopy: {
    flex: 1,
  },
  choiceTitle: {
    color: blueFlowPalette.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  choiceSubtitle: {
    marginTop: 6,
    color: blueFlowPalette.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  choiceBadge: {
    minWidth: 72,
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: blueFlowPalette.accentSoft,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBadgeActive: {
    backgroundColor: blueFlowPalette.accent,
  },
  choiceBadgeText: {
    color: blueFlowPalette.accent,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  choiceBadgeTextActive: {
    color: '#FFFFFF',
  },
  button: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: blueFlowPalette.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonSecondary: {
    backgroundColor: blueFlowPalette.panel,
    borderWidth: 1,
    borderColor: blueFlowPalette.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  buttonTextSecondary: {
    color: blueFlowPalette.textPrimary,
  },
  buttonArrow: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    color: blueFlowPalette.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  infoValue: {
    color: blueFlowPalette.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'right',
    flexShrink: 1,
  },
});
