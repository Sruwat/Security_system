type AdPlacement = 'banner' | 'native' | 'interstitial';

class AdsManager {
  private ready = new Set<AdPlacement>();

  initialize(): void {
    return;
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

  showBanner(): boolean {
    return this.ready.has('banner');
  }

  showNative(): boolean {
    return this.ready.has('native');
  }

  showInterstitialIfReady(_context?: unknown): boolean {
    if (!this.ready.has('interstitial')) {
      return false;
    }
    this.ready.delete('interstitial');
    return true;
  }
}

export const adsManager = new AdsManager();
