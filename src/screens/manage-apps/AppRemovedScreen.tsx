import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, NativeStackScreenProps} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaInnerLayout, figmaPalette} from '../../components/FigmaKit';
import type {RootStackParamList} from '../../navigation/routes';

type AppRemovedProps = NativeStackScreenProps<RootStackParamList, 'AppRemoved'>;

export function AppRemovedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AppRemovedProps['route']>();
  const palette = figmaPalette.dark;
  const label = route.params.label;

  return (
    <FigmaInnerLayout variant="dark" title="Protection Removed" onBackPress={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>{label} is no longer in your protected apps list.</Text>

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
    </FigmaInnerLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  subtitle: {
    marginTop: 6,
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
