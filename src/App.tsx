import React from 'react';
import {ActivityIndicator, AppState, DeviceEventEmitter, View} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {AppNavigator} from './navigation/AppNavigator';
import {adsManager} from './services/ads/AdsManager';
import {nativeBridge} from './native';
import {protectionManager} from './services/protection/ProtectionManager';
import {localDataRepository} from './storage/LocalDataRepository';
import {launchCoordinator} from './services/launch/LaunchCoordinator';
import {secretAccessRouter} from './services/secret/SecretAccessRouter';
import {sessionManager} from './services/session/SessionManager';
import {useAppSecurityLifecycle} from './hooks/useAppSecurityLifecycle';
import type {RootStackParamList} from './navigation/routes';
import type {DisguiseType} from './types/domain';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function disguiseRoute(disguiseType: DisguiseType): keyof RootStackParamList {
  switch (disguiseType) {
    case 'calculator':
      return 'Calculator';
    case 'clock':
      return 'Clock';
    case 'calendar':
      return 'Calendar';
    case 'gallery':
      return 'Gallery';
    default:
      return 'PrivateHome';
  }
}

export default function App() {
  useAppSecurityLifecycle();
  const [initialRouteName, setInitialRouteName] = React.useState<keyof RootStackParamList>('Welcome');
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
        setInitialRouteName(settings.onboardingResumeRoute ?? 'Welcome');
        setReady(true);
        return;
      }

      const pendingAuth = await nativeBridge.getPendingAuthRequest().catch(() => null);
      if (!mounted) {
        return;
      }
      if (pendingAuth?.packageName) {
        const protection = await protectionManager.getProtection(pendingAuth.packageName);
        if (!mounted) {
          return;
        }
        launchCoordinator.restorePendingLaunch(pendingAuth.packageName, protection?.mode ?? null);
        await nativeBridge.clearPendingAuthRequest().catch(() => undefined);
        setInitialRouteName('AuthGate');
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
          setInitialRouteName(disguiseRoute(settings.disguiseType));
        }
      } else {
        launchCoordinator.restorePendingLaunch(null);
        setInitialRouteName(disguiseRoute(settings.disguiseType));
      }

      setReady(true);
    };

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;

    const syncShakeMonitoring = async () => {
      const settings = await localDataRepository.getSettings();
      if (!active) {
        return;
      }
      if (settings.onboardingComplete && settings.secretAccessType === 'shake') {
        await nativeBridge.startShakeMonitoring().catch(() => undefined);
      } else {
        await nativeBridge.stopShakeMonitoring().catch(() => undefined);
      }
    };

    void syncShakeMonitoring();
    const unsubscribe = localDataRepository.subscribeToSettings(() => {
      void syncShakeMonitoring();
    });

    const shakeSubscription = DeviceEventEmitter.addListener('secretShakeDetected', () => {
      if (!navigationRef.isReady()) {
        return;
      }
      const currentRoute = navigationRef.getCurrentRoute()?.name;
      if (currentRoute === 'AuthGate' || currentRoute === 'UnlockSuccess' || currentRoute === 'Vault') {
        return;
      }

      void secretAccessRouter.handleSecretAccess().then(next => {
        if (!navigationRef.isReady()) {
          return;
        }
        if (next === 'auth_required') {
          navigationRef.resetRoot({index: 0, routes: [{name: 'AuthGate'}]});
          return;
        }
        if (next === 'vault') {
          navigationRef.resetRoot({index: 0, routes: [{name: 'Vault'}]});
        }
      });
    });

    return () => {
      active = false;
      unsubscribe();
      shakeSubscription.remove();
      void nativeBridge.stopShakeMonitoring().catch(() => undefined);
    };
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active' || !navigationRef.isReady()) {
        return;
      }

      void nativeBridge.getPendingAuthRequest().then(async pendingAuth => {
        if (!pendingAuth?.packageName || !navigationRef.isReady()) {
          return;
        }

        const protection = await protectionManager.getProtection(pendingAuth.packageName);
        launchCoordinator.restorePendingLaunch(pendingAuth.packageName, protection?.mode ?? null);
        await nativeBridge.clearPendingAuthRequest().catch(() => undefined);
        navigationRef.resetRoot({index: 0, routes: [{name: 'AuthGate'}]});
      });
    });

    return () => subscription.remove();
  }, []);

  if (!ready) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator initialRouteName={initialRouteName} />
    </NavigationContainer>
  );
}
