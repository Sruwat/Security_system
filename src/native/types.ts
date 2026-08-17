import type {
  DeviceCapabilities,
  DisguiseType,
  LaunchableApp,
  LauncherState,
  PermissionStatus,
} from '../types/domain';

export interface TransientAccess {
  packageName: string | null;
  vaultUnlocked: boolean;
  expiresAt: number;
}

export interface PendingAuthRequest {
  packageName: string;
  createdAt: number;
}

export interface NativeBridge {
  getLaunchableApps(): Promise<LaunchableApp[]>;
  getInstalledPackages(): Promise<string[]>;
  launchApp(packageName: string): Promise<void>;
  createCredential(ref: string, type: string, value: string): Promise<void>;
  verifyCredential(ref: string, value: string): Promise<boolean>;
  deleteCredential(ref: string): Promise<void>;
  authenticateBiometric(): Promise<'success' | 'fail' | 'unavailable'>;
  setSecureScreen(enabled: boolean): Promise<void>;
  persistTransientAccess(packageName: string | null, vaultUnlocked: boolean, expiresAt: number): Promise<void>;
  clearTransientAccess(): Promise<void>;
  getTransientAccess(): Promise<TransientAccess | null>;
  getPendingAuthRequest(): Promise<PendingAuthRequest | null>;
  clearPendingAuthRequest(): Promise<void>;
  getDeviceCapabilities(): Promise<DeviceCapabilities>;
  syncProtectionMetadata(
    protections: Array<{
      packageName: string;
      isLocked: boolean;
      credentialRef: string;
      lockType: string;
      autoLockSeconds: number;
      enabled: boolean;
    }>,
  ): Promise<void>;
  getLauncherState(): Promise<LauncherState>;
  requestLauncherSelection(): Promise<void>;
  getPermissionStatuses(): Promise<PermissionStatus[]>;
  openSystemSetting(action: string): Promise<void>;
  setLauncherDisguise(disguiseType: DisguiseType): Promise<LauncherState>;
  startShakeMonitoring(): Promise<void>;
  stopShakeMonitoring(): Promise<void>;
}
