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
        label: 'Protection Dashboard',
        description: 'Review protected apps, summaries, and shortcuts.',
        onPress: () => navigation.navigate('PrivateHome'),
      },
      {
        label: 'Hide Apps',
        description: 'Choose apps that should live only in the hidden area.',
        onPress: () => navigation.navigate('AddApps', {preset: 'HIDE'}),
      },
      {
        label: 'App Lock',
        description: 'Choose apps that stay visible but require unlock.',
        onPress: () => navigation.navigate('AddApps', {preset: 'LOCK'}),
      },
      {
        label: 'Hide + Lock',
        description: 'Choose apps that need both privacy protections.',
        onPress: () => navigation.navigate('AddApps', {preset: 'LOCK_HIDE'}),
      },
      {
        label: 'Hidden Apps',
        description: 'Open the private vault and review hidden apps.',
        onPress: () => navigation.navigate('Vault'),
      },
      {
        label: 'Smart Hide',
        description: 'Choose the secret trigger and disguise experience for Hidden Apps.',
        onPress: () => navigation.navigate('SecretEntry'),
      },
      {
        label: 'Settings',
        description: 'Update security, permissions, recovery, and appearance.',
        onPress: () => navigation.navigate('Settings'),
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
