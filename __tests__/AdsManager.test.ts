import {adsManager} from '../src/services/ads/AdsManager';

describe('AdsManager', () => {
  it('does not block if an interstitial is not ready', () => {
    expect(adsManager.showInterstitialIfReady()).toBe(false);
  });

  it('reports readiness for each placement', () => {
    adsManager.initialize();
    adsManager.preloadBanner();
    adsManager.preloadNative();

    expect(adsManager.isReady('banner')).toBe(true);
    expect(adsManager.isReady('native')).toBe(true);
    expect(adsManager.isReady('interstitial')).toBe(false);
    expect(adsManager.getReadiness()).toEqual({
      banner: true,
      native: true,
      interstitial: false,
    });
  });
});
