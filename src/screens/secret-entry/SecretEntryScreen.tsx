import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaHeader, FigmaPage, FigmaRowCard, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {RootStackParamList} from '../../navigation/routes';
import {VAULT_SECRET_CREDENTIAL_TYPE} from '../../services/security/credentialTypes';

const entryMethods = [
  {title: 'Calculator code', subtitle: 'Most discreet'},
  {title: 'Double tap', subtitle: 'Quick'},
  {title: 'Triple tap', subtitle: 'Discreet'},
  {title: 'Long press', subtitle: 'Subtle'},
  {title: 'Pinch / spread', subtitle: 'Gesture'},
];

export function SecretEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;

  const verifyVaultSecret = React.useCallback(async (secretCode: string) => {
    return nativeBridge.verifyCredential(VAULT_SECRET_CREDENTIAL_TYPE, secretCode);
  }, []);

  return (
    <FigmaPage variant="light">
      <View style={styles.fill}>
        <FigmaHeader variant="light" title="Secret access" subtitle="Choose hidden-app entry." />

        <View style={styles.cards}>
          {entryMethods.map(method => (
            <FigmaRowCard variant="light" key={method.title} title={method.title} subtitle={method.subtitle} />
          ))}
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton
          variant="light"
          label="Finish setup"
          onPress={() => {
            void localDataRepository.setOnboardingComplete(true).finally(() => navigation.navigate('Vault'));
          }}
        />
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  cards: {
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
});
