import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FigmaActionButton, FigmaBanner, FigmaBottomNav, FigmaPage, figmaPalette} from '../../components/FigmaKit';
import {launchCoordinator} from '../../services/launch/LaunchCoordinator';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection} from '../../types/domain';
import type {RootStackParamList} from '../../navigation/routes';

export function PrivateHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [apps, setApps] = React.useState<AppProtection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const palette = figmaPalette.dark;

  const loadApps = React.useCallback(async () => {
    setLoading(true);
    try {
      setApps(await localDataRepository.getProtectedApps());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const visibleApps = apps.slice(0, 3);

  return (
    <FigmaPage variant="dark">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.time, {color: palette.textPrimary}]}>9:41</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Private Apps</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Your selected private apps.</Text>

        <FigmaBanner variant="dark" title="Banner ad" tone="surfaceElevated" />

        <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>My Private Apps</Text>

        {loading ? (
          <View style={[styles.emptyCard, {backgroundColor: palette.surface, borderColor: palette.border}]}>
            <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Loading protected apps...</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {visibleApps.map((app, index) => (
              <Pressable
                key={app.packageName}
                onPress={() => {
                  void launchCoordinator.launch(app.packageName).catch(error => {
                    Alert.alert('Launch failed', error instanceof Error ? error.message : 'Unable to launch app.');
                  });
                }}
                style={({pressed}) => [styles.gridCard, {backgroundColor: index % 2 === 0 ? palette.surface : palette.accentSoft, borderColor: palette.border, opacity: pressed ? 0.92 : 1}]}>
                <View style={[styles.iconBox, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.iconText, {color: palette.accent}]}>{app.label.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={[styles.appLabel, {color: palette.textPrimary}]}>{app.label}</Text>
                <View style={[styles.modePill, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.modeText, {color: palette.accent}]}>{app.mode}</Text>
                </View>
              </Pressable>
            ))}

            <Pressable onPress={() => navigation.navigate('AddApps')} style={({pressed}) => [styles.addCard, {borderColor: palette.accent, backgroundColor: palette.accentSoft, opacity: pressed ? 0.92 : 1}]}>
              <Text style={[styles.addGlyph, {color: palette.accent}]}>＋</Text>
              <Text style={[styles.addLabel, {color: palette.accent}]}>Add Apps</Text>
            </Pressable>
          </View>
        )}

        <Pressable onPress={() => navigation.navigate('ManageApps')} style={[styles.manageRow, {backgroundColor: palette.surface, borderColor: palette.border}]}>
          <Text style={[styles.manageText, {color: palette.textPrimary}]}>Manage Apps</Text>
        </Pressable>

        <FigmaBanner
          variant="dark"
          title="Native advertisement"
          subtitle="Placed after functional content"
          tone="surfaceElevated"
        />

        <View style={styles.bottomSpacer} />

        <FigmaBottomNav variant="dark" active="home" />
      </ScrollView>
    </FigmaPage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 17,
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
  sectionTitle: {
    marginTop: 18,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    width: 148,
    minHeight: 112,
    borderRadius: 21,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  addCard: {
    width: 148,
    minHeight: 112,
    borderRadius: 21,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 10,
    fontWeight: '700',
  },
  appLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
    marginTop: 6,
  },
  modePill: {
    minWidth: 54,
    alignSelf: 'flex-start',
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
  },
  addGlyph: {
    fontSize: 25,
    lineHeight: 28,
    fontWeight: '400',
  },
  addLabel: {
    marginTop: 18,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  manageRow: {
    marginTop: 16,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  manageText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  bottomSpacer: {
    height: 16,
  },
  emptyCard: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: 17,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  emptyText: {
    fontSize: 10,
    lineHeight: 13,
  },
});
