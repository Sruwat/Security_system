import React from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {nativeBridge} from '../../native';
import type {RootStackParamList} from '../../navigation/routes';
import {APP_UNLOCK_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function AuthGateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.dark;
  const [pin, setPin] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const promptAttemptedRef = React.useRef(false);
  const pendingLaunchPackageName = launchCoordinator.getPendingLaunchPackageName();

  const completeAuthentication = React.useCallback(
    async (pinValue?: string) => {
      if (pinValue) {
        const verified = await nativeBridge.verifyCredential(APP_UNLOCK_CREDENTIAL_TYPE, pinValue.trim());
        if (!verified) {
          throw new Error('The PIN did not match the stored credential.');
        }
      }

      const outcome = await launchCoordinator.completeAuthentication();
      if (outcome === 'app_launched' || outcome === 'vault_unlocked') {
        navigation.reset({index: 0, routes: [{name: 'PrivateHome'}]});
      }
    },
    [navigation],
  );

  const authenticate = React.useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const result = await nativeBridge.authenticateBiometric();
      if (result !== 'success') {
        return;
      }

      await completeAuthentication();
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  }, [completeAuthentication, loading]);

  const submitDigit = React.useCallback(
    (digit: string) => {
      const next = `${pin}${digit}`.slice(0, 4);
      setPin(next);
      if (next.length === 4) {
        void completeAuthentication(next).catch(error => {
          Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unable to verify the PIN.');
          setPin('');
        });
      }
    },
    [completeAuthentication, pin],
  );

  React.useEffect(() => {
    if (!promptAttemptedRef.current) {
      promptAttemptedRef.current = true;
      void authenticate();
    }
  }, [authenticate]);

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Unlock</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>
          {pendingLaunchPackageName ? 'Authenticate to continue.' : 'Authenticate to continue.'}
        </Text>

        <View style={styles.lockOrb}>
          <Text style={[styles.lockGlyph, {color: palette.accent}]}>◈</Text>
        </View>

        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map(index => (
            <View key={index} style={[styles.dot, {backgroundColor: pin.length > index ? palette.accent : palette.accent}]} />
          ))}
        </View>

        <View style={styles.keypad}>
          {keypad.map(value => (
            <Pressable key={value} onPress={() => submitDigit(value)} style={[styles.key, {backgroundColor: palette.surface, borderColor: palette.border}]}>
              <Text style={[styles.keyText, {color: palette.textPrimary}]}>{value}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => void authenticate()} style={styles.fingerprint}>
          <Text style={[styles.fingerprintText, {color: palette.accent}]}>Use fingerprint</Text>
        </Pressable>
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
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
  lockOrb: {
    marginTop: 52,
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: '#211A3A',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '700',
  },
  dotsRow: {
    marginTop: 38,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  keypad: {
    marginTop: 43,
    alignSelf: 'center',
    width: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'center',
  },
  key: {
    width: 66,
    height: 48,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  fingerprint: {
    marginTop: 39,
    alignSelf: 'center',
  },
  fingerprintText: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
  },
});
