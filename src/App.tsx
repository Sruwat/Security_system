import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigator} from './navigation/AppNavigator';
import {localDataRepository} from './storage/LocalDataRepository';

export default function App() {
  const [initialRouteName, setInitialRouteName] = React.useState<'Welcome' | 'AuthGate'>('Welcome');
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    localDataRepository.getSettings().then(settings => {
      if (!mounted) {
        return;
      }
      setInitialRouteName(settings.onboardingComplete ? 'AuthGate' : 'Welcome');
      setReady(true);
    });

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
