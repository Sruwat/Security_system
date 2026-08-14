import React from 'react';
import {AppState, type AppStateStatus} from 'react-native';
import {nativeBridge} from '../native';
import {clearTransientAccess} from '../services/session/TransientAccessManager';

export function useAppSecurityLifecycle() {
  React.useEffect(() => {
    void nativeBridge.setSecureScreen(true).catch(() => undefined);

    const handleStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'background') {
        return;
      }

      clearTransientAccess();
    };

    const subscription = AppState.addEventListener('change', handleStateChange);

    return () => {
      subscription.remove();
      void nativeBridge.setSecureScreen(false).catch(() => undefined);
    };
  }, []);
}
