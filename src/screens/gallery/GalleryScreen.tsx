import React from 'react';
import {StyleSheet, Text, View, useColorScheme} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {PrimaryButton} from '../../components/PrimaryButton';
import {Screen} from '../../components/Screen';
import {themeTokens} from '../../theme';
import type {RootStackParamList} from '../../navigation/routes';

export function GalleryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme();
  const palette = themeTokens.colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Screen>
      <View style={[styles.heroCard, {backgroundColor: palette.surfaceElevated, borderColor: palette.border}]}>
        <Text style={[styles.kicker, {color: palette.accent}]}>Private media</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Private Gallery</Text>
        <Text style={[styles.description, {color: palette.textSecondary}]}>
          This protected surface is reserved for local gallery media and future vault-backed content.
        </Text>
      </View>

      <View style={[styles.card, {backgroundColor: palette.surface, borderColor: palette.border}]}>
        <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Gallery status</Text>
        <Text style={[styles.cardBody, {color: palette.textSecondary}]}>
          No private media has been added yet. Gallery content will remain local and tied to protected access.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton label="Back home" onPress={() => navigation.navigate('PrivateHome')} />
          <PrimaryButton label="Open Settings" onPress={() => navigation.navigate('Settings')} variant="secondary" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
  },
  kicker: {
    fontSize: themeTokens.typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: themeTokens.typography.title,
    fontWeight: '800',
  },
  description: {
    fontSize: themeTokens.typography.body,
    lineHeight: 24,
  },
  card: {
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    ...themeTokens.shadows.card,
  },
  cardTitle: {
    fontSize: themeTokens.typography.body,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: themeTokens.typography.body,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
    marginTop: themeTokens.spacing.sm,
  },
});
