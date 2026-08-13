import {adsManager} from '../src/services/ads/AdsManager';

describe('AdsManager', () => {
  it('does not block if an interstitial is not ready', () => {
    expect(adsManager.showInterstitialIfReady()).toBe(false);
  });
});
