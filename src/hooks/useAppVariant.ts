import React from 'react';
import {Appearance} from 'react-native';
import {localDataRepository} from '../storage/LocalDataRepository';
import type {FigmaVariant} from '../components/FigmaKit';

export function useAppVariant(): FigmaVariant {
  const [variant, setVariant] = React.useState<FigmaVariant>('dark');

  React.useEffect(() => {
    let mounted = true;

    void (async () => {
      const settings = await localDataRepository.getSettings();
      if (!mounted) {
        return;
      }

      if (settings.theme === 'LIGHT') {
        setVariant('light');
        return;
      }

      if (settings.theme === 'DARK') {
        setVariant('dark');
        return;
      }

      setVariant(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return variant;
}
