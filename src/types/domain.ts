export type ProtectionMode = 'NONE' | 'LOCK' | 'HIDE' | 'LOCK_HIDE';

export type AuthMethod = 'PIN' | 'PASSWORD' | 'PATTERN' | 'BIOMETRIC' | 'BIOMETRIC_FALLBACK';
export type PrimaryAuthMethod = 'PIN' | 'PASSWORD' | 'PATTERN';

export type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

export type SecretEntryMethod = 'DOUBLE_TAP' | 'TRIPLE_TAP' | 'LONG_PRESS' | 'PINCH' | 'CALCULATOR_CODE';

export interface AppProtection {
  packageName: string;
  label: string;
  mode: ProtectionMode;
  authMethod: AuthMethod;
  autoLockSeconds: number;
  updatedAt: number;
}

export interface AppSettings {
  onboardingComplete: boolean;
  theme: ThemeMode;
  secretEntryMethod: SecretEntryMethod;
  primaryAuthMethod: PrimaryAuthMethod;
  bannerEnabled: boolean;
  nativeAdEnabled: boolean;
  autoLockSecondsDefault: number;
}

export interface SessionState {
  packageName?: string;
  vaultUnlocked: boolean;
  expiresAt: number;
}

export interface LaunchableApp {
  packageName: string;
  label: string;
  iconUri?: string;
  systemApp: boolean;
}

export interface DeviceCapabilities {
  biometricsAvailable: boolean;
  biometricTypes: string[];
  secureScreenSupported: boolean;
  packageVisibilityRestricted: boolean;
}

export interface LaunchDecision {
  launchable: boolean;
  requiresAuthentication: boolean;
  requiresSecretEntry: boolean;
  reason: string;
}
