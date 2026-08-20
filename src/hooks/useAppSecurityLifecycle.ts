import React from 'react';
import {AppState, type AppStateStatus} from 'react-native';

export function useAppSecurityLifecycle() {
  React.useEffect(() => {
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
    };
  }, []);
}
