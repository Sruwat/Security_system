import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthGateScreen} from '../screens/auth/AuthGateScreen';
import {AddAppsScreen} from '../screens/app-picker/AddAppsScreen';
import {GalleryScreen} from '../screens/gallery/GalleryScreen';
import {ManageAppsScreen} from '../screens/manage-apps/ManageAppsScreen';
import {PrivateHomeScreen} from '../screens/private-home/PrivateHomeScreen';
import {LauncherSetupScreen} from '../screens/onboarding/LauncherSetupScreen';
import {PrimaryLockScreen} from '../screens/onboarding/PrimaryLockScreen';
import {ProtectionModeScreen} from '../screens/onboarding/ProtectionModeScreen';
import {SecretEntryScreen} from '../screens/secret-entry/SecretEntryScreen';
import {SettingsScreen} from '../screens/settings/SettingsScreen';
import {VaultScreen} from '../screens/vault/VaultScreen';
import {WelcomeScreen} from '../screens/onboarding/WelcomeScreen';
import type {RootStackParamList} from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator(props: {initialRouteName: keyof RootStackParamList}) {
  return (
    <Stack.Navigator initialRouteName={props.initialRouteName} screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="LauncherSetup" component={LauncherSetupScreen} />
      <Stack.Screen name="PrimaryLock" component={PrimaryLockScreen} />
      <Stack.Screen name="AuthGate" component={AuthGateScreen} />
      <Stack.Screen name="PrivateHome" component={PrivateHomeScreen} />
      <Stack.Screen name="AddApps" component={AddAppsScreen} />
      <Stack.Screen name="ProtectionMode" component={ProtectionModeScreen} />
      <Stack.Screen name="ManageApps" component={ManageAppsScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="SecretEntry" component={SecretEntryScreen} />
      <Stack.Screen name="Vault" component={VaultScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
