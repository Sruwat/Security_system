import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppSettings} from '../../types/domain';

type AdPlacement = 'banner' | 'native' | 'interstitial';
export type AdScreen =
  | 'private-home'
  | 'vault'
  | 'add-apps'
  | 'manage-apps'
  | 'gallery'
  | 'settings'
  | 'unlock-success'
  | 'reboot-restored';

const placementRules: Record<AdScreen, AdPlacement[]> = {
  'private-home': ['banner', 'native'],
  vault: ['banner', 'native'],
  'add-apps': [],
  'manage-apps': ['banner', 'native'],
  gallery: ['banner', 'native'],
  settings: ['banner'],
  'unlock-success': ['interstitial'],
  'reboot-restored': ['interstitial'],
};

class AdsManager {
  private ready = new Set<AdPlacement>();
  private settings: AppSettings | null = null;
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    void localDataRepository.getSettings().then(settings => {
      this.settings = settings;
    });
    localDataRepository.subscribeToSettings(settings => {
      this.settings = settings;
    });
  }

  preloadBanner(): void {
    this.ready.add('banner');
  }

  preloadNative(): void {
    this.ready.add('native');
  }

  preloadInterstitial(): void {
    this.ready.add('interstitial');
  }

  private isEnabled(placement: AdPlacement): boolean {
    if (!this.settings) {
      return placement === 'interstitial';
    }

    if (placement === 'banner') {
      return this.settings.bannerEnabled;
    }

    if (placement === 'native') {
      return this.settings.nativeAdEnabled;
    }

    return true;
  }

  canRenderPlacement(screen: AdScreen | undefined, placement: AdPlacement): boolean {
    if (!screen) {
      return this.isEnabled(placement) && this.ready.has(placement);
    }

    return placementRules[screen].includes(placement) && this.isEnabled(placement) && this.ready.has(placement);
  }

  isReady(placement: AdPlacement): boolean {
    return this.ready.has(placement);
  }

  getReadiness(): Record<AdPlacement, boolean> {
    return {
      banner: this.ready.has('banner'),
      native: this.ready.has('native'),
      interstitial: this.ready.has('interstitial'),
    };
  }

  showBanner(screen: AdScreen): boolean {
    return this.canRenderPlacement(screen, 'banner');
  }

  showNative(screen: AdScreen): boolean {
    return this.canRenderPlacement(screen, 'native');
  }

  showInterstitialIfReady(screen?: AdScreen): boolean {
    if (!this.canRenderPlacement(screen, 'interstitial')) {
      return false;
    }

    this.ready.delete('interstitial');
    return true;
  }
}

export const adsManager = new AdsManager();
