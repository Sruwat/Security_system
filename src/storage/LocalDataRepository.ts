import AsyncStorage from '@react-native-async-storage/async-storage';
import {storageKeys} from './keys';
import type {AppProtection, AppSettings, OnboardingResumeRoute} from '../types/domain';

const defaultSettings: AppSettings = {
  onboardingComplete: false,
  theme: 'SYSTEM',
  secretEntryMethod: 'CALCULATOR_CODE',
  primaryAuthMethod: 'PIN',
  bannerEnabled: true,
  nativeAdEnabled: true,
  autoLockSecondsDefault: 30,
};

export class LocalDataRepository {
  private settingsListeners = new Set<(settings: AppSettings) => void>();
  private protectionListeners = new Set<(apps: AppProtection[]) => void>();

  private emitSettings(settings: AppSettings): void {
    this.settingsListeners.forEach(listener => listener(settings));
  }

  private emitProtectedApps(apps: AppProtection[]): void {
    this.protectionListeners.forEach(listener => listener(apps));
  }

  subscribeToSettings(listener: (settings: AppSettings) => void): () => void {
    this.settingsListeners.add(listener);
    return () => {
      this.settingsListeners.delete(listener);
    };
  }

  subscribeToProtectedApps(listener: (apps: AppProtection[]) => void): () => void {
    this.protectionListeners.add(listener);
    return () => {
      this.protectionListeners.delete(listener);
    };
  }

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
    this.emitSettings(settings);
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
    this.emitProtectedApps(apps);
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

  async setOnboardingResumeRoute(onboardingResumeRoute?: OnboardingResumeRoute): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({...settings, onboardingResumeRoute});
  }
}

export const localDataRepository = new LocalDataRepository();
