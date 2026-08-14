import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaCard, FigmaHeader, FigmaPage} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import type {RootStackParamList} from '../../navigation/routes';
import {APP_UNLOCK_CREDENTIAL_TYPE, VAULT_SECRET_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const persistSetupCredentials = React.useCallback(async (appUnlockPin: string, vaultSecret: string) => {
    await nativeBridge.createCredential(APP_UNLOCK_CREDENTIAL_TYPE, appUnlockPin);
    await nativeBridge.createCredential(VAULT_SECRET_CREDENTIAL_TYPE, vaultSecret);
  }, []);

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <FigmaHeader variant="dark" title="Welcome" subtitle="Private apps stay on this device." />

        <View style={styles.heroCard}>
          <View style={styles.heroInner}>
            <Text style={styles.heroGlyph}>◈</Text>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.copyTitle}>Lock. Hide. Keep private.</Text>
          <Text style={styles.copyBody}>No account • No cloud • Local protection</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Start setup" onPress={() => navigation.navigate('LauncherSetup')} />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  heroCard: {
    height: 210,
    borderRadius: 30,
    backgroundColor: '#A78BFA',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInner: {
    width: 144,
    height: 128,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyph: {
    color: '#6D5BD0',
    fontSize: 46,
    fontWeight: '700',
    lineHeight: 50,
  },
  copy: {
    marginTop: 40,
  },
  copyTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  copyBody: {
    marginTop: 11,
    color: '#94A3B8',
    fontSize: 9,
    lineHeight: 11,
  },
  spacer: {
    flex: 1,
  },
});
