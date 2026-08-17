export type ProtectionMode = 'NONE' | 'LOCK' | 'HIDE' | 'LOCK_HIDE';

export type AuthMethod = 'PIN' | 'PASSWORD' | 'PATTERN' | 'BIOMETRIC' | 'BIOMETRIC_FALLBACK';
export type PrimaryAuthMethod = 'PIN' | 'PASSWORD' | 'PATTERN';

export type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

export type SecretEntryMethod = 'DOUBLE_TAP' | 'TRIPLE_TAP' | 'LONG_PRESS' | 'PINCH' | 'CALCULATOR_CODE';
export type SecretAccessType = 'triple_tap' | 'shake' | 'calculator' | 'clock' | 'calendar' | 'gallery';
export type DisguiseType = 'default' | 'calculator' | 'clock' | 'calendar' | 'gallery';
export type OnboardingResumeRoute =
  | 'Welcome'
  | 'LauncherSetup'
  | 'PrimaryLock'
  | 'PinSetup'
  | 'PasswordSetup'
  | 'PatternSetup'
  | 'BiometricSetup'
  | 'ProtectionSaved'
  | 'AddApps'
  | 'ProtectionMode'
  | 'SecretEntry';

export interface AppProtection {
  packageName: string;
  label: string;
  appName?: string;
  iconUri?: string;
  icon?: string;
  isHidden: boolean;
  isLocked: boolean;
  enabled: boolean;
  lockType?: AuthMethod;
  credentialRef?: string;
  autoLockSeconds?: number;
  authMethod?: AuthMethod;
  mode?: ProtectionMode;
  updatedAt: number;
}

export interface AppSettings {
  onboardingComplete: boolean;
  onboardingResumeRoute?: OnboardingResumeRoute;
  theme: ThemeMode;
  disguiseType: DisguiseType;
  secretAccessType: SecretAccessType;
  calculatorSecret?: string;
  clockSecretValue?: string;
  calendarSecretDate?: string;
  gallerySecretConfig?: string;
  defaultLockType?: AuthMethod;
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

export interface LauncherState {
  isDefaultLauncher: boolean;
  activeDisguise: DisguiseType;
}

export type PermissionStatusState =
  | 'enabled'
  | 'not_enabled'
  | 'required'
  | 'running'
  | 'needs_attention'
  | 'optimized'
  | 'recommended_exception';

export interface PermissionStatus {
  key: 'defaultLauncher' | 'usageAccess' | 'accessibility' | 'backgroundProtection' | 'batteryOptimization';
  label: string;
  status: PermissionStatusState;
  settingsAction: string;
}

export interface LaunchDecision {
  launchable: boolean;
  requiresAuthentication: boolean;
  requiresSecretEntry: boolean;
  reason: string;
}
