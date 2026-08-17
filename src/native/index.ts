import {NativeModules} from 'react-native';
import type {NativeBridge} from './types';

const fallback: NativeBridge = {
  async getLaunchableApps() {
    return [];
  },
  async getInstalledPackages() {
    return [];
  },
  async launchApp() {
    throw new Error('Native launch bridge is not linked yet.');
  },
  async createCredential() {
    throw new Error('Native security bridge is not linked yet.');
  },
  async verifyCredential() {
    throw new Error('Native security bridge is not linked yet.');
  },
  async deleteCredential() {
    return;
  },
  async authenticateBiometric() {
    return 'unavailable';
  },
  async setSecureScreen() {
    return;
  },
  async persistTransientAccess() {
    return;
  },
  async clearTransientAccess() {
    return;
  },
  async getTransientAccess() {
    return null;
  },
  async getPendingAuthRequest() {
    return null;
  },
  async clearPendingAuthRequest() {
    return;
  },
  async getDeviceCapabilities() {
    return {
      biometricsAvailable: false,
      biometricTypes: [],
      secureScreenSupported: false,
      packageVisibilityRestricted: false,
    };
  },
  async syncProtectionMetadata() {
    return;
  },
  async getLauncherState() {
    return {
      isDefaultLauncher: false,
      activeDisguise: 'default',
    };
  },
  async requestLauncherSelection() {
    return;
  },
  async getPermissionStatuses() {
    return [];
  },
  async openSystemSetting() {
    return;
  },
  async setLauncherDisguise(disguiseType) {
    return {
      isDefaultLauncher: false,
      activeDisguise: disguiseType,
    };
  },
  async startShakeMonitoring() {
    return;
  },
  async stopShakeMonitoring() {
    return;
  },
};

export const nativeBridge: NativeBridge = NativeModules.SmartAppLockHideBridge ?? fallback;
