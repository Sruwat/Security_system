import type {AppProtection, AuthMethod, LaunchableApp, ProtectionMode} from '../../types/domain';

export interface ProtectionDraft {
  app: LaunchableApp;
  apps?: LaunchableApp[];
  mode: ProtectionMode;
  authMethod: AuthMethod;
  autoLockSeconds: number;
}

export function buildProtectionPolicy(draft: ProtectionDraft): AppProtection {
  return {
    packageName: draft.app.packageName,
    label: draft.app.label,
    mode: draft.mode,
    authMethod: draft.authMethod,
    autoLockSeconds: draft.autoLockSeconds,
    updatedAt: Date.now(),
  };
}
