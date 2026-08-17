import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaInnerLayout, figmaPalette} from '../../components/FigmaKit';
import {nativeBridge} from '../../native';
import type {RootStackParamList} from '../../navigation/routes';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {LauncherState} from '../../types/domain';

function LauncherRow(props: {title: string; subtitle: string; palette: typeof figmaPalette.light; onPress: () => void}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({pressed}) => [
        styles.row,
        {
          backgroundColor: props.palette.surface,
          borderColor: props.palette.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, {color: props.palette.textPrimary}]}>{props.title}</Text>
        <Text style={[styles.rowSubtitle, {color: props.palette.textSecondary}]}>{props.subtitle}</Text>
      </View>
      <Text style={[styles.chevron, {color: props.palette.textSecondary}]}>{'>'}</Text>
    </Pressable>
  );
}

export function LauncherSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const palette = figmaPalette.light;
  const [launcherState, setLauncherState] = React.useState<LauncherState>({isDefaultLauncher: false, activeDisguise: 'default'});

  const refreshLauncherState = React.useCallback(async () => {
    setLauncherState(await nativeBridge.getLauncherState());
  }, []);

  React.useEffect(() => {
    void localDataRepository.setOnboardingResumeRoute('LauncherSetup');
    void refreshLauncherState();
  }, [refreshLauncherState]);

  return (
    <FigmaInnerLayout variant="light" title="Required Permissions" onBackPress={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Give Hide and Lock the Android access they need.</Text>

        <View style={styles.rows}>
          <LauncherRow
            palette={palette}
            title="Default launcher"
            subtitle={launcherState.isDefaultLauncher ? 'Enabled on this device' : 'Set this app as Home launcher'}
            onPress={() => {
              void nativeBridge.requestLauncherSelection()
                .then(refreshLauncherState)
                .catch(error => {
                  Alert.alert('Launcher setup failed', error instanceof Error ? error.message : 'Unable to open launcher settings.');
                });
            }}
          />
          <LauncherRow
            palette={palette}
            title="App discovery"
            subtitle="Refresh installed apps and confirm package access is working."
            onPress={() => {
              void refreshLauncherState();
            }}
          />
          {launcherState.isDefaultLauncher ? (
            <LauncherRow
              palette={palette}
              title="Use phone launcher"
              subtitle="Open Android Home settings and switch back to your OEM launcher at any time."
              onPress={() => {
                void nativeBridge.openSystemSetting('home').catch(error => {
                  Alert.alert('Home settings unavailable', error instanceof Error ? error.message : 'Unable to open Home settings.');
                });
              }}
            />
          ) : null}
        </View>

        <View style={[styles.noteCard, {backgroundColor: palette.accentSoft, borderColor: palette.border}]}>
          <Text style={[styles.noteTitle, {color: palette.accent}]}>Hide works inside this Smart Launcher only.</Text>
          <Text style={[styles.noteBody, {color: palette.textSecondary}]}>Your OEM launcher stays available through Home settings. Android does not allow third-party apps to remove other apps from every launcher.</Text>
        </View>

        <View style={styles.spacer} />

        <FigmaActionButton
          variant="light"
          label="Continue"
          onPress={() => {
            void localDataRepository.setOnboardingResumeRoute('PrimaryLock');
            navigation.navigate('PrimaryLock');
          }}
        />
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
    fontSize: 14,
    lineHeight: 18,
  },
  rows: {
    marginTop: 24,
    gap: 14,
  },
  row: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  rowSubtitle: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
  },
  noteCard: {
    marginTop: 16,
    minHeight: 148,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  noteBody: {
    marginTop: 20,
    fontSize: 11,
    lineHeight: 15,
  },
  chevron: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
});
