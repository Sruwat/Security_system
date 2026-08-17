import type {AppProtection, AppSettings, AuthMethod, ProtectionMode, SecretAccessType, SecretEntryMethod} from '../../types/domain';
import {APP_UNLOCK_CREDENTIAL_REF} from '../security/credentialTypes';

export function protectionModeFromFlags(protection: Pick<AppProtection, 'isHidden' | 'isLocked'>): ProtectionMode {
  if (protection.isHidden && protection.isLocked) {
    return 'LOCK_HIDE';
  }
  if (protection.isHidden) {
    return 'HIDE';
  }
  if (protection.isLocked) {
    return 'LOCK';
  }
  return 'NONE';
}

export function protectionFlagsFromMode(mode: ProtectionMode): Pick<AppProtection, 'isHidden' | 'isLocked'> {
  switch (mode) {
    case 'LOCK_HIDE':
      return {isHidden: true, isLocked: true};
    case 'HIDE':
      return {isHidden: true, isLocked: false};
    case 'LOCK':
      return {isHidden: false, isLocked: true};
    default:
      return {isHidden: false, isLocked: false};
  }
}

export function normalizeProtection(protection: AppProtection): AppProtection {
  const fallbackMode = protection.mode ?? 'NONE';
  const flags = typeof protection.isHidden === 'boolean' && typeof protection.isLocked === 'boolean'
    ? {isHidden: protection.isHidden, isLocked: protection.isLocked}
    : protectionFlagsFromMode(fallbackMode);
  const lockType = protection.lockType ?? protection.authMethod ?? 'PIN';

  return {
    ...protection,
    appName: protection.appName ?? protection.label,
    icon: protection.icon ?? protection.iconUri,
    triggerType: protection.triggerType ?? 'triple_tap',
    isHidden: flags.isHidden,
    isLocked: flags.isLocked,
    enabled: typeof protection.enabled === 'boolean' ? protection.enabled : flags.isHidden || flags.isLocked,
    lockType,
    credentialRef: protection.credentialRef ?? APP_UNLOCK_CREDENTIAL_REF,
    authMethod: protection.authMethod ?? lockType,
    autoLockSeconds: protection.autoLockSeconds ?? 30,
    mode: protectionModeFromFlags(flags),
    updatedAt: protection.updatedAt ?? Date.now(),
  };
}

export function describeProtection(protection: Pick<AppProtection, 'isHidden' | 'isLocked'>): string {
  if (protection.isHidden && protection.isLocked) {
    return 'Hidden • Locked';
  }
  if (protection.isHidden) {
    return 'Hidden';
  }
  if (protection.isLocked) {
    return 'Locked';
  }
  return 'Visible';
}

export function lockTypeLabel(lockType?: AuthMethod): string {
  switch (lockType) {
    case 'PASSWORD':
      return 'Password';
    case 'PATTERN':
      return 'Pattern';
    case 'BIOMETRIC':
    case 'BIOMETRIC_FALLBACK':
      return 'Biometric';
    default:
      return 'PIN';
  }
}

export function mapSecretEntryMethodToAccessType(method: SecretEntryMethod): SecretAccessType {
  switch (method) {
    case 'TRIPLE_TAP':
      return 'triple_tap';
    case 'CALCULATOR_CODE':
      return 'calculator';
    case 'DOUBLE_TAP':
    case 'LONG_PRESS':
    case 'PINCH':
    default:
      return 'triple_tap';
  }
}

export function mapSecretAccessTypeToEntryMethod(secretAccessType: SecretAccessType): SecretEntryMethod {
  switch (secretAccessType) {
    case 'triple_tap':
    case 'clock':
    case 'calendar':
    case 'gallery':
    case 'shake':
      return 'TRIPLE_TAP';
    case 'calculator':
      return 'CALCULATOR_CODE';
    default:
      return 'CALCULATOR_CODE';
  }
}

export function normalizeSettings(settings: AppSettings): AppSettings {
  const secretAccessType = settings.secretAccessType ?? mapSecretEntryMethodToAccessType(settings.secretEntryMethod);
  const disguiseType = settings.disguiseType ?? 'default';
  const defaultLockType = settings.defaultLockType ?? settings.primaryAuthMethod;

  return {
    ...settings,
    disguiseType,
    secretAccessType,
    defaultLockType,
    secretEntryMethod: settings.secretEntryMethod ?? mapSecretAccessTypeToEntryMethod(secretAccessType),
  };
}
