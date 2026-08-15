import React from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';
import {protectionManager} from '../../services/protection/ProtectionManager';

type RemoveAppProps = NativeStackScreenProps<RootStackParamList, 'RemoveApp'>;

export function RemoveAppScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RemoveAppProps['route']>();
  const palette = figmaPalette.dark;
  const {app} = route.params;
  const [removing, setRemoving] = React.useState(false);

  const confirmRemove = React.useCallback(async () => {
    setRemoving(true);
    try {
      await protectionManager.removeProtection(app.packageName);
      navigation.replace('AppRemoved', {label: app.label});
    } catch (error) {
      Alert.alert('Remove failed', error instanceof Error ? error.message : 'Unable to remove protection.');
      setRemoving(false);
    }
  }, [app.label, app.packageName, navigation]);

  return (
    <FigmaPage variant="dark">
      <View style={styles.fill}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Remove App</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Remove {app.label} from private list?</Text>

        <View style={[styles.card, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Remove protection?</Text>
          <Text style={[styles.cardBody, {color: palette.textSecondary}]}>
            {app.label} returns to normal launcher visibility according to the selected removal behavior.
          </Text>
        </View>

        <View style={styles.actions}>
          <FigmaActionButton variant="dark" label={removing ? 'Removing...' : 'Remove'} onPress={() => void confirmRemove()} />
          <FigmaActionButton variant="dark" label="Cancel" tone="secondary" onPress={() => navigation.goBack()} />
        </View>

        <Text style={styles.warning}>No ad inside destructive confirmation.</Text>
      </View>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
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
  card: {
    marginTop: 160,
    borderWidth: 1,
    borderRadius: 34,
    paddingHorizontal: 36,
    paddingVertical: 56,
    gap: 28,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 24,
  },
  actions: {
    marginTop: 96,
    gap: 28,
  },
  warning: {
    marginTop: 104,
    textAlign: 'center',
    color: '#FFB4A7',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
