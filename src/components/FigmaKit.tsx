import React from 'react';
import {Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {adsManager} from '../services/ads/AdsManager';

export type FigmaVariant = 'light' | 'dark';

export const figmaPalette = {
  light: {
    background: '#EEF4FF',
    surface: '#FFFFFF',
    surfaceElevated: '#E3EEFF',
    textPrimary: '#0F172A',
    textSecondary: '#526581',
    accent: '#2563EB',
    accentSoft: '#DCEBFF',
    border: '#C6D8F7',
  },
  dark: {
    background: '#08111F',
    surface: '#111D33',
    surfaceElevated: '#152540',
    textPrimary: '#F8FBFF',
    textSecondary: '#9FB4D2',
    accent: '#4F8CFF',
    accentSoft: '#13294A',
    border: '#223A63',
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

type DrawerDestination = {
  label: string;
  description: string;
  onPress: () => void;
};

export function FigmaTopBar(props: {
  variant: FigmaVariant;
  title: string;
  mode: 'root' | 'inner';
  onMenuPress?: () => void;
  onBackPress?: () => void;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
}) {
  const palette = useFigmaPalette(props.variant);
  return (
    <View style={[styles.topBar, {borderColor: palette.border, backgroundColor: palette.surface}]}>
      <Pressable
        onPress={props.mode === 'root' ? props.onMenuPress : props.onBackPress}
        hitSlop={10}
        style={({pressed}) => [styles.leadingAction, {backgroundColor: palette.accentSoft, opacity: pressed ? 0.92 : 1}]}>
        <Text style={[styles.leadingActionText, {color: palette.accent}]}>
          {props.mode === 'root' ? '=' : '<'}
        </Text>
      </Pressable>
      <Text style={[styles.topBarTitle, {color: palette.textPrimary}]} numberOfLines={1}>
        {props.title}
      </Text>
      {props.rightActionLabel ? (
        <Pressable
          onPress={props.onRightActionPress}
          hitSlop={10}
          style={({pressed}) => [styles.trailingAction, {backgroundColor: palette.accentSoft, opacity: pressed ? 0.92 : 1}]}>
          <Text style={[styles.trailingActionText, {color: palette.accent}]}>{props.rightActionLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.trailingPlaceholder} />
      )}
    </View>
  );
}

export function FigmaDrawer(props: {
  open: boolean;
  variant: FigmaVariant;
  title: string;
  destinations: DrawerDestination[];
  onClose: () => void;
}) {
  const palette = useFigmaPalette(props.variant);

  return (
    <Modal visible={props.open} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={styles.drawerOverlay}>
        <Pressable style={styles.drawerScrim} onPress={props.onClose} />
        <View style={[styles.drawerSheet, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={styles.drawerHeader}>
            <View>
              <Text style={[styles.drawerKicker, {color: palette.textSecondary}]}>Quick Access</Text>
              <Text style={[styles.drawerTitle, {color: palette.textPrimary}]}>{props.title}</Text>
            </View>
            <Pressable onPress={props.onClose} style={[styles.drawerClose, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.drawerCloseText, {color: palette.accent}]}>x</Text>
            </Pressable>
          </View>

          <View style={styles.drawerList}>
            {props.destinations.map(item => (
              <FigmaRowCard
                key={item.label}
                variant={props.variant}
                title={item.label}
                subtitle={item.description}
                icon={item.label.slice(0, 2).toUpperCase()}
                onPress={() => {
                  props.onClose();
                  item.onPress();
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FigmaRootLayout(props: {
  variant: FigmaVariant;
  title: string;
  drawerTitle: string;
  drawerOpen: boolean;
  onDrawerOpen: () => void;
  onDrawerClose: () => void;
  drawerDestinations: DrawerDestination[];
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
}) {
  const palette = useFigmaPalette(props.variant);
  const insets = useSafeAreaInsets();
  return (
    <FigmaPage variant={props.variant}>
      <FigmaTopBar variant={props.variant} title={props.title} mode="root" onMenuPress={props.onDrawerOpen} />
      <View style={[styles.rootBody, props.bottomNav ? {paddingBottom: 126 + insets.bottom} : null]}>{props.children}</View>
      {props.bottomNav ? <View style={[styles.fixedBottomNav, {backgroundColor: palette.background, bottom: insets.bottom + 10}]}>{props.bottomNav}</View> : null}
      <FigmaDrawer
        open={props.drawerOpen}
        variant={props.variant}
        title={props.drawerTitle}
        destinations={props.drawerDestinations}
        onClose={props.onDrawerClose}
      />
    </FigmaPage>
  );
}

export function FigmaInnerLayout(props: {
  variant: FigmaVariant;
  title: string;
  onBackPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <FigmaPage variant={props.variant}>
      <FigmaTopBar variant={props.variant} title={props.title} mode="inner" onBackPress={props.onBackPress} />
      <View style={styles.innerBody}>{props.children}</View>
    </FigmaPage>
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
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.rowCard,
        {
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.94 : 1,
          transform: [{scale: pressed ? 0.985 : 1}, {translateY: pressed ? 1 : 0}],
        },
      ]}>
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
        <View style={styles.badge}>
          <Text style={[styles.badgeText, {color: palette.accent}]}>{props.rightLabel}</Text>
        </View>
      ) : (
        <Text style={[styles.chevron, {color: palette.textSecondary}]}>{'>'}</Text>
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
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <Text style={[styles.actionText, {color: isSecondary ? palette.textPrimary : '#FFFFFF'}]}>{props.label}</Text>
    </Pressable>
  );
}

export function FigmaBottomNav(props: {
  variant: FigmaVariant;
  active: 'home' | 'gallery' | 'settings';
  onHomePress?: () => void;
  onGalleryPress?: () => void;
  onSettingsPress?: () => void;
}) {
  const palette = useFigmaPalette(props.variant);
  return (
    <View style={[styles.bottomNav, {backgroundColor: palette.surface, borderColor: palette.border}]}>
      <View style={[styles.navPill, {backgroundColor: palette.accentSoft, left: props.active === 'home' ? 16 : props.active === 'gallery' ? 121 : 226}]} />

      <Pressable
        onPress={props.onHomePress}
        style={({pressed}) => [styles.navSlot, {left: 55, opacity: pressed ? 0.92 : 1}]}>
        <View style={styles.gridIcon}>
          {Array.from({length: 9}).map((_, index) => (
            <View key={index} style={[styles.gridDot, {backgroundColor: props.active === 'home' ? palette.accent : palette.textSecondary}]} />
          ))}
        </View>
      </Pressable>

      <Pressable
        onPress={props.onGalleryPress}
        style={({pressed}) => [styles.navSlot, {left: 160, opacity: pressed ? 0.92 : 1}]}>
        <View style={[styles.diamondIcon, {borderColor: props.active === 'gallery' ? palette.accent : palette.textSecondary}]}>
          <View style={[styles.diamondIconInner, {backgroundColor: props.active === 'gallery' ? palette.accent : palette.textSecondary}]} />
        </View>
      </Pressable>

      <Pressable
        onPress={props.onSettingsPress}
        style={({pressed}) => [styles.navSlot, {left: 266, opacity: pressed ? 0.92 : 1}]}>
        <View style={[styles.settingsIcon, {borderColor: props.active === 'settings' ? palette.accent : palette.textSecondary}]}>
          <View style={[styles.settingsIconInner, {backgroundColor: props.active === 'settings' ? palette.accent : palette.textSecondary}]} />
        </View>
      </Pressable>
    </View>
  );
}

export function FigmaBanner(props: {
  variant: FigmaVariant;
  screen: 'private-home' | 'vault' | 'add-apps' | 'manage-apps' | 'gallery' | 'settings';
  title: string;
  subtitle?: string;
  tone?: 'surfaceElevated' | 'surface';
  placement?: 'banner' | 'native';
}) {
  const palette = useFigmaPalette(props.variant);
  const [ready, setReady] = React.useState(false);
  const placement = props.placement ?? 'banner';

  React.useEffect(() => {
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isReady = placement === 'native' ? adsManager.showNative(props.screen) : adsManager.showBanner(props.screen);
  if (!ready || !isReady) {
    return null;
  }

  return (
    <View style={[styles.banner, {backgroundColor: props.tone === 'surface' ? palette.surface : palette.surfaceElevated, borderColor: palette.border}]}>
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
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
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
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  rowSubtitle: {
    marginTop: 3,
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
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  bottomNav: {
    height: 60,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leadingAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingActionText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  trailingAction: {
    minWidth: 58,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  trailingActionText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  trailingPlaceholder: {
    width: 40,
    height: 40,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  drawerScrim: {
    flex: 1,
  },
  drawerSheet: {
    width: '82%',
    maxWidth: 340,
    borderLeftWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  drawerKicker: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  drawerTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  drawerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  drawerList: {
    marginTop: 20,
    gap: 10,
  },
  rootBody: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 94,
  },
  innerBody: {
    flex: 1,
    paddingTop: 14,
  },
  fixedBottomNav: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 10,
    paddingTop: 8,
  },
  navPill: {
    position: 'absolute',
    width: 90,
    height: 38,
    top: 11,
    borderRadius: 19,
  },
  navSlot: {
    position: 'absolute',
    top: 18,
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIcon: {
    width: 18,
    height: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridDot: {
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  diamondIcon: {
    width: 16,
    height: 16,
    borderWidth: 2,
    transform: [{rotate: '45deg'}],
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondIconInner: {
    width: 6,
    height: 6,
  },
  settingsIcon: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  banner: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  bannerKicker: {
    fontSize: 7,
    lineHeight: 9,
  },
  bannerTitle: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
  bannerSubtitle: {
    marginTop: 4,
    fontSize: 8,
    lineHeight: 10,
  },
});
