import AsyncStorage from '@react-native-async-storage/async-storage';
import {nativeBridge} from '../native';
import {storageKeys} from './keys';
import type {AppProtection, AppSettings, OnboardingResumeRoute} from '../types/domain';
import {normalizeProtection, normalizeSettings} from '../services/protection/protectionState';

const defaultSettings: AppSettings = {
  onboardingComplete: false,
  disguiseType: 'default',
  secretAccessType: 'calculator',
  calculatorSecret: '2468',
  clockSecretValue: '5',
  calendarSecretDate: '18',
  gallerySecretConfig: 'triple_tap_cover',
  defaultLockType: 'PIN',
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
      return normalizeSettings({...defaultSettings, ...JSON.parse(raw)});
    } catch {
      return defaultSettings;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const normalized = normalizeSettings({...defaultSettings, ...settings});
    await AsyncStorage.setItem(storageKeys.settings, JSON.stringify(normalized));
    this.emitSettings(normalized);
  }

  async getProtectedApps(): Promise<AppProtection[]> {
    const raw = await AsyncStorage.getItem(storageKeys.protections);
    if (!raw) {
      await this.syncNativeProtectionMetadata([]);
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      const normalized = Array.isArray(parsed) ? parsed.map(item => normalizeProtection(item as AppProtection)) : [];
      const installedPackages = await nativeBridge.getInstalledPackages().catch(() => []);
      if (installedPackages.length === 0) {
        await this.syncNativeProtectionMetadata(normalized);
        return normalized;
      }

      const installedSet = new Set(installedPackages);
      const cleaned = normalized.filter(item => installedSet.has(item.packageName));
      if (cleaned.length !== normalized.length) {
        await this.saveProtectedApps(cleaned);
        const transient = await nativeBridge.getTransientAccess().catch(() => null);
        if (transient?.packageName && !installedSet.has(transient.packageName)) {
          await nativeBridge.clearTransientAccess().catch(() => undefined);
        }
      }
      await this.syncNativeProtectionMetadata(cleaned);
      return cleaned;
    } catch {
      await this.syncNativeProtectionMetadata([]);
      return [];
    }
  }

  async saveProtectedApps(apps: AppProtection[]): Promise<void> {
    const normalized = apps.map(app => normalizeProtection(app));
    await AsyncStorage.setItem(storageKeys.protections, JSON.stringify(normalized));
    await this.syncNativeProtectionMetadata(normalized);
    this.emitProtectedApps(normalized);
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

  private async syncNativeProtectionMetadata(apps: AppProtection[]): Promise<void> {
    await nativeBridge.syncProtectionMetadata(
      apps.map(app => ({
        packageName: app.packageName,
        isLocked: app.isLocked,
        credentialRef: app.credentialRef ?? app.packageName,
        lockType: app.lockType ?? app.authMethod ?? 'PIN',
        autoLockSeconds: app.autoLockSeconds ?? 30,
        enabled: app.enabled,
      })),
    ).catch(() => undefined);
  }
}

export const localDataRepository = new LocalDataRepository();
