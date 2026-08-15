import React from 'react';
import {Appearance} from 'react-native';
import {localDataRepository} from '../storage/LocalDataRepository';
import type {FigmaVariant} from '../components/FigmaKit';

export function useAppVariant(): FigmaVariant {
  const [variant, setVariant] = React.useState<FigmaVariant>('dark');

  React.useEffect(() => {
    const syncVariant = async () => {
      const settings = await localDataRepository.getSettings();
      if (settings.theme === 'LIGHT') {
        setVariant('light');
        return;
      }

      if (settings.theme === 'DARK') {
        setVariant('dark');
        return;
      }

      setVariant(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
    };

    void syncVariant();

    const unsubscribeSettings = localDataRepository.subscribeToSettings(settings => {
      if (settings.theme === 'LIGHT') {
        setVariant('light');
        return;
      }

      if (settings.theme === 'DARK') {
        setVariant('dark');
        return;
      }

      setVariant(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
    });

    const appearanceSubscription = Appearance.addChangeListener(({colorScheme}) => {
      void localDataRepository.getSettings().then(settings => {
        if (settings.theme === 'SYSTEM') {
          setVariant(colorScheme === 'dark' ? 'dark' : 'light');
        }
      });
    });

    return () => {
      unsubscribeSettings();
      appearanceSubscription.remove();
    };
  }, []);

  return variant;
}
