import {NativeModules} from 'react-native';
import type {NativeBridge} from './types';

const fallback: NativeBridge = {
  async getLaunchableApps() {
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
  async getDeviceCapabilities() {
    return {
      biometricsAvailable: false,
      biometricTypes: [],
      secureScreenSupported: false,
      packageVisibilityRestricted: false,
    };
  },
};

export const nativeBridge: NativeBridge = NativeModules.SmartAppLockHideBridge ?? fallback;
