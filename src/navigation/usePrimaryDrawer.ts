import React from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from './routes';

type DrawerDestination = {
  label: string;
  description: string;
  onPress: () => void;
};

export function usePrimaryDrawer() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const drawerDestinations = React.useMemo<DrawerDestination[]>(
    () => [
      {
        label: 'Home',
        description: 'Launcher',
        onPress: () => navigation.navigate('PrivateHome'),
      },
      {
        label: 'Hide Apps',
        description: 'Private apps',
        onPress: () => navigation.navigate('AddApps', {preset: 'HIDE', flow: 'APP_HIDE'}),
      },
      {
        label: 'App Lock',
        description: 'Secure apps',
        onPress: () => navigation.navigate('AddApps', {preset: 'LOCK', flow: 'APP_LOCK'}),
      },
      {
        label: 'Hide + Lock',
        description: 'Both',
        onPress: () => navigation.navigate('AddApps', {preset: 'LOCK_HIDE', flow: 'LOCK_HIDE'}),
      },
      {
        label: 'Vault',
        description: 'Hidden apps',
        onPress: () => navigation.navigate('Vault'),
      },
      {
        label: 'Smart Hide',
        description: 'Secret access',
        onPress: () => navigation.navigate('SecretEntry', {flow: 'SMART_HIDE'}),
      },
      {
        label: 'Dashboard',
        description: 'Protected apps',
        onPress: () => navigation.navigate('ManageApps'),
      },
      {
        label: 'Settings',
        description: 'Preferences',
        onPress: () => navigation.navigate('Settings'),
      },
      {
        label: 'Support',
        description: 'Privacy help',
        onPress: () => navigation.navigate('PrivacyCenter'),
      },
    ],
    [navigation],
  );

  return {
    drawerOpen,
    openDrawer: React.useCallback(() => setDrawerOpen(true), []),
    closeDrawer: React.useCallback(() => setDrawerOpen(false), []),
    drawerDestinations,
  };
}
