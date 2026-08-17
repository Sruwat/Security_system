import React from 'react';
import {AppState, type AppStateStatus} from 'react-native';
import {nativeBridge} from '../native';

export function useAppSecurityLifecycle() {
  React.useEffect(() => {
    void nativeBridge.setSecureScreen(true).catch(() => undefined);

    const handleStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        // Protected app handoffs briefly background this app. The session is
        // already persisted with an expiry, so do not clear it here.
        return;
      }
    };

    const subscription = AppState.addEventListener('change', handleStateChange);

    return () => {
      subscription.remove();
      void nativeBridge.setSecureScreen(false).catch(() => undefined);
    };
  }, []);
}
