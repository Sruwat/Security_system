import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {adsManager} from '../../services/ads/AdsManager';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {sessionManager} from '../../services/session/SessionManager';
import type {RootStackParamList} from '../../navigation/routes';

function TransitionGlyph(props: {palette: typeof figmaPalette.dark; accentLabel: string}) {
  return (
    <View style={styles.glyphShell}>
      <View style={[styles.glyphHalo, {backgroundColor: props.palette.accentSoft}]} />
      <View style={[styles.glyphBadge, {backgroundColor: props.palette.accent}]}>
        <Text style={styles.glyphText}>{props.accentLabel}</Text>
      </View>
    </View>
  );
}

export function UnlockSuccessScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const pendingPackageName = launchCoordinator.getPendingLaunchPackageName();
  const activeSession = sessionManager.getState();

  React.useEffect(() => {
    adsManager.showInterstitialIfReady('unlock-success');
    const timer = setTimeout(() => {
      if (pendingPackageName) {
        navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
        void launchCoordinator.launchPendingAfterAuthentication();
        return;
      }

      if (activeSession?.vaultUnlocked) {
        navigation.reset({index: 0, routes: [{name: 'Vault'}]});
        return;
      }

      navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
    }, 700);

    return () => clearTimeout(timer);
  }, [activeSession?.vaultUnlocked, navigation, pendingPackageName]);

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <View style={styles.headerRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.statePill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stateText, {color: palette.accent}]}>Access granted</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Unlock success</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Your secure session is ready to continue.</Text>

        <View style={[styles.contextCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.contextIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.contextIconText, {color: palette.accent}]}>OK</Text>
          </View>
          <View style={styles.contextBody}>
            <Text style={[styles.contextLabel, {color: palette.textPrimary}]}>
              Private space
            </Text>
            <Text style={[styles.contextHint, {color: palette.textSecondary}]}>
              {activeSession?.vaultUnlocked ? 'Returning to Hidden Apps' : 'Returning to the private launcher'}
            </Text>
          </View>
        </View>

        <View style={styles.centerArea}>
          <TransitionGlyph palette={palette} accentLabel="UNLOCK" />
          <Text style={[styles.message, {color: palette.textSecondary}]}>
            We are restoring your secure session.
          </Text>
        </View>

        <View style={[styles.statusCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.statusTitle, {color: palette.textPrimary}]}>What happens next</Text>
          <Text style={[styles.statusBody, {color: palette.textSecondary}]}>
            {activeSession?.vaultUnlocked
              ? 'The app returns to Hidden Apps after the secure handoff is complete.'
              : 'The app returns to the private screen after the secure handoff is complete.'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Pressable
            onPress={() =>
              navigation.reset({index: 0, routes: [{name: activeSession?.vaultUnlocked ? 'Vault' : 'PrivateHome'}]})
            }
            style={[styles.footerPill, styles.primaryPill, {backgroundColor: palette.accent}]}>
            <Text style={[styles.footerText, {color: '#FFFFFF'}]}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </FigmaPage>
  );
}

export function RebootRestoredScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const pendingPackageName = launchCoordinator.getPendingLaunchPackageName();
  const pendingMode = launchCoordinator.getPendingLaunchMode();
  const activeSession = sessionManager.getState();
  const hasPendingApp = Boolean(pendingPackageName);

  const continueNext = React.useCallback(() => {
    if (hasPendingApp) {
      if (pendingMode === 'HIDE' && activeSession?.vaultUnlocked) {
        navigation.reset({index: 0, routes: [{name: 'Vault'}]});
        return;
      }

      if (!activeSession?.vaultUnlocked && (pendingMode === 'HIDE' || pendingMode === 'LOCK_HIDE')) {
        navigation.reset({index: 0, routes: [{name: 'Calculator'}]});
        return;
      }

      navigation.reset({index: 0, routes: [{name: 'AuthGate'}]});
      return;
    }

    if (activeSession?.vaultUnlocked) {
      navigation.reset({index: 0, routes: [{name: 'Vault'}]});
      return;
    }

    navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
  }, [activeSession?.vaultUnlocked, hasPendingApp, navigation, pendingMode]);

  React.useEffect(() => {
    adsManager.showInterstitialIfReady('reboot-restored');
    const timer = setTimeout(() => {
      continueNext();
    }, 900);

    return () => clearTimeout(timer);
  }, [continueNext]);

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <View style={styles.headerRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.statePill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stateText, {color: palette.accent}]}>Restored</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>Reboot restored</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          {hasPendingApp
            ? `We found a protected app session for ${pendingPackageName}.`
            : activeSession?.vaultUnlocked
              ? 'Your private space came back after the restart.'
              : 'Temporary access is ready to continue.'}
        </Text>

        <View style={[styles.contextCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.contextIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.contextIconText, {color: palette.accent}]}>RB</Text>
          </View>
          <View style={styles.contextBody}>
            <Text style={[styles.contextLabel, {color: palette.textPrimary}]}>
              {hasPendingApp ? pendingPackageName : 'Private space'}
            </Text>
            <Text style={[styles.contextHint, {color: palette.textSecondary}]}>
              {hasPendingApp ? 'Return to authentication to resume the app' : 'Return to the private launcher'}
            </Text>
          </View>
        </View>

        <View style={styles.centerArea}>
          <TransitionGlyph palette={palette} accentLabel="SYNC" />
          <Text style={[styles.message, {color: palette.textSecondary}]}>
            The secure session was restored from the device state.
          </Text>
        </View>

        <View style={[styles.statusCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.statusTitle, {color: palette.textPrimary}]}>Next step</Text>
          <Text style={[styles.statusBody, {color: palette.textSecondary}]}>
            {hasPendingApp ? 'Authenticate again to finish the protected app handoff.' : 'Open the private launcher and continue inside the vault.'}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Pressable onPress={continueNext} style={[styles.footerPill, styles.primaryPill, {backgroundColor: palette.accent}]}>
            <Text style={[styles.footerText, {color: '#FFFFFF'}]}>{hasPendingApp ? 'Authenticate' : 'Continue'}</Text>
          </Pressable>
        </View>
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  statePill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  title: {
    marginTop: 28,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  contextCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contextIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextIconText: {
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  contextBody: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  contextHint: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 11,
  },
  centerArea: {
    marginTop: 30,
    alignItems: 'center',
  },
  glyphShell: {
    width: 202,
    height: 202,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphHalo: {
    position: 'absolute',
    width: 202,
    height: 202,
    borderRadius: 101,
  },
  glyphBadge: {
    minWidth: 94,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  message: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  statusCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  statusBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },
  footerRow: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 12,
  },
  footerPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPill: {
    borderColor: 'transparent',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
