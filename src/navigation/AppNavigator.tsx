import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthGateScreen} from '../screens/auth/AuthGateScreen';
import {RebootRestoredScreen, UnlockSuccessScreen} from '../screens/auth/TransitionScreens';
import {AddAppsScreen} from '../screens/app-picker/AddAppsScreen';
import {GalleryScreen} from '../screens/gallery/GalleryScreen';
import {ManageAppsScreen} from '../screens/manage-apps/ManageAppsScreen';
import {RemoveAppScreen} from '../screens/manage-apps/RemoveAppScreen';
import {AppRemovedScreen} from '../screens/manage-apps/AppRemovedScreen';
import {PrivateHomeScreen} from '../screens/private-home/PrivateHomeScreen';
import {
  BiometricSetupScreen,
  PasswordSetupScreen,
  PatternSetupScreen,
  PinSetupScreen,
  ProtectionSavedScreen,
} from '../screens/onboarding/CredentialSetupScreens';
import {LauncherSetupScreen} from '../screens/onboarding/LauncherSetupScreen';
import {PrimaryLockScreen} from '../screens/onboarding/PrimaryLockScreen';
import {ProtectionModeScreen} from '../screens/onboarding/ProtectionModeScreen';
import {CalculatorScreen} from '../screens/secret-entry/CalculatorScreen';
import {CalendarDisguiseScreen, ClockDisguiseScreen} from '../screens/secret-entry/DisguiseScreens';
import {SecretEntryScreen} from '../screens/secret-entry/SecretEntryScreen';
import {AdManagerRulesScreen, AppearanceSettingsScreen, AutoLockSettingsScreen, PrivacyCenterScreen} from '../screens/settings/SettingsDetailScreens';
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
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
      <Stack.Screen name="PatternSetup" component={PatternSetupScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen name="ProtectionSaved" component={ProtectionSavedScreen} />
      <Stack.Screen name="RebootRestored" component={RebootRestoredScreen} />
      <Stack.Screen name="UnlockSuccess" component={UnlockSuccessScreen} />
      <Stack.Screen name="Calculator" component={CalculatorScreen} />
      <Stack.Screen name="Clock" component={ClockDisguiseScreen} />
      <Stack.Screen name="Calendar" component={CalendarDisguiseScreen} />
      <Stack.Screen name="AuthGate" component={AuthGateScreen} />
      <Stack.Screen name="PrivateHome" component={PrivateHomeScreen} />
      <Stack.Screen name="AddApps" component={AddAppsScreen} />
      <Stack.Screen name="ProtectionMode" component={ProtectionModeScreen} />
      <Stack.Screen name="ManageApps" component={ManageAppsScreen} />
      <Stack.Screen name="RemoveApp" component={RemoveAppScreen} />
      <Stack.Screen name="AppRemoved" component={AppRemovedScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="SecretEntry" component={SecretEntryScreen} />
      <Stack.Screen name="Vault" component={VaultScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
      <Stack.Screen name="AutoLockSettings" component={AutoLockSettingsScreen} />
      <Stack.Screen name="PrivacyCenter" component={PrivacyCenterScreen} />
      <Stack.Screen name="AdManagerRules" component={AdManagerRulesScreen} />
    </Stack.Navigator>
  );
}
