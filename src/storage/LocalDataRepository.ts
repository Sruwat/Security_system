import AsyncStorage from '@react-native-async-storage/async-storage';
import {storageKeys} from './keys';
import type {AppProtection, AppSettings} from '../types/domain';

const defaultSettings: AppSettings = {
  onboardingComplete: false,
  theme: 'SYSTEM',
  secretEntryMethod: 'DOUBLE_TAP',
  bannerEnabled: true,
  nativeAdEnabled: true,
  autoLockSecondsDefault: 300,
};

export class LocalDataRepository {
  async getSettings(): Promise<AppSettings> {
    const raw = await AsyncStorage.getItem(storageKeys.settings);
    if (!raw) {
      return defaultSettings;
    }

    try {
      return {...defaultSettings, ...JSON.parse(raw)};
    } catch {
      return defaultSettings;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(storageKeys.settings, JSON.stringify(settings));
  }

  async getProtectedApps(): Promise<AppProtection[]> {
    const raw = await AsyncStorage.getItem(storageKeys.protections);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async saveProtectedApps(apps: AppProtection[]): Promise<void> {
    await AsyncStorage.setItem(storageKeys.protections, JSON.stringify(apps));
  }

  async addProtectedApp(policy: AppProtection): Promise<void> {
    const apps = await this.getProtectedApps();
    const index = apps.findIndex(item => item.packageName === policy.packageName);
    const next = index >= 0 ? apps.map(item => (item.packageName === policy.packageName ? policy : item)) : [...apps, policy];
    await this.saveProtectedApps(next);
  }

  async updateProtection(packageName: string, patch: Partial<AppProtection>): Promise<void> {
    const apps = await this.getProtectedApps();
    const next = apps.map(item => (item.packageName === packageName ? {...item, ...patch, updatedAt: Date.now()} : item));
    await this.saveProtectedApps(next);
  }

  async removeProtectedApp(packageName: string): Promise<void> {
    const apps = await this.getProtectedApps();
    await this.saveProtectedApps(apps.filter(item => item.packageName !== packageName));
  }

  async setOnboardingComplete(onboardingComplete: boolean): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({...settings, onboardingComplete});
  }
}

export const localDataRepository = new LocalDataRepository();
