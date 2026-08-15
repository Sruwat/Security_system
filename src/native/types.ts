import type {DeviceCapabilities, LaunchableApp} from '../types/domain';

export interface TransientAccess {
  packageName: string | null;
  vaultUnlocked: boolean;
  expiresAt: number;
}

export interface NativeBridge {
  getLaunchableApps(): Promise<LaunchableApp[]>;
  launchApp(packageName: string): Promise<void>;
  createCredential(type: string, value: string): Promise<void>;
  verifyCredential(type: string, value: string): Promise<boolean>;
  authenticateBiometric(): Promise<'success' | 'fail' | 'unavailable'>;
  setSecureScreen(enabled: boolean): Promise<void>;
  persistTransientAccess(packageName: string | null, vaultUnlocked: boolean, expiresAt: number): Promise<void>;
  clearTransientAccess(): Promise<void>;
  getTransientAccess(): Promise<TransientAccess | null>;
  getDeviceCapabilities(): Promise<DeviceCapabilities>;
}
