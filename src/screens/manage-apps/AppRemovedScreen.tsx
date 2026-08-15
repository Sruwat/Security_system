import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

type AppRemovedProps = NativeStackScreenProps<RootStackParamList, 'AppRemoved'>;

export function AppRemovedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AppRemovedProps['route']>();
  const palette = figmaPalette.dark;
  const label = route.params.label;

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
          <View style={[styles.stepPill, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.stepText, {color: palette.accent}]}>REMOVED</Text>
          </View>
        </View>

        <Text style={[styles.title, {color: palette.textPrimary}]}>App removed</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>{label} is no longer protected.</Text>

        <View style={[styles.heroCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <View style={[styles.heroIcon, {backgroundColor: palette.accentSoft}]}>
            <Text style={[styles.heroIconText, {color: palette.accent}]}>OK</Text>
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>The protection entry was removed from local storage.</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>You can add the app again from the installed app picker at any time.</Text>
        </View>

        <View style={[styles.statusCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.statusTitle, {color: palette.textPrimary}]}>What changed</Text>
          <Text style={[styles.statusBody, {color: palette.textSecondary}]}>The protection mode and temporary session are cleared for this app.</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton variant="dark" label="Back to Manage Apps" onPress={() => navigation.reset({index: 0, routes: [{name: 'ManageApps'}]})} />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  stepPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  title: {
    marginTop: 10,
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
  heroCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  heroTitle: {
    marginTop: 16,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 23,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
  },
  statusCard: {
    marginTop: 16,
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
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
