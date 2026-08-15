import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigator} from './navigation/AppNavigator';
import {adsManager} from './services/ads/AdsManager';
import {nativeBridge} from './native';
import {protectionManager} from './services/protection/ProtectionManager';
import {localDataRepository} from './storage/LocalDataRepository';
import {launchCoordinator} from './services/launch/LaunchCoordinator';
import {sessionManager} from './services/session/SessionManager';
import {useAppSecurityLifecycle} from './hooks/useAppSecurityLifecycle';

export default function App() {
  useAppSecurityLifecycle();
  const [initialRouteName, setInitialRouteName] = React.useState<'Welcome' | 'RebootRestored' | 'AuthGate' | 'PrivateHome'>('Welcome');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    adsManager.initialize();
    adsManager.preloadBanner();
    adsManager.preloadNative();
    adsManager.preloadInterstitial();

    let mounted = true;

    const initialize = async () => {
      const settings = await localDataRepository.getSettings();
      if (!mounted) {
        return;
      }

      if (!settings.onboardingComplete) {
        setInitialRouteName('Welcome');
        setReady(true);
        return;
      }

      const transientAccess = await nativeBridge.getTransientAccess();
      if (!mounted) {
        return;
      }

      if (transientAccess && transientAccess.expiresAt > Date.now()) {
        const durationSeconds = Math.max(1, Math.ceil((transientAccess.expiresAt - Date.now()) / 1000));
        if (transientAccess.vaultUnlocked) {
          sessionManager.startVaultSession(durationSeconds);
          launchCoordinator.restorePendingLaunch(null);
          setInitialRouteName('RebootRestored');
        } else if (transientAccess.packageName) {
          sessionManager.startSession(transientAccess.packageName, durationSeconds);
          const protection = await protectionManager.getProtection(transientAccess.packageName);
          launchCoordinator.restorePendingLaunch(transientAccess.packageName, protection?.mode ?? null);
          setInitialRouteName('RebootRestored');
        } else {
          launchCoordinator.restorePendingLaunch(null);
          setInitialRouteName('AuthGate');
        }
      } else {
        launchCoordinator.restorePendingLaunch(null);
        setInitialRouteName('AuthGate');
      }

      setReady(true);
    };

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator initialRouteName={initialRouteName} />
    </NavigationContainer>
  );
}
