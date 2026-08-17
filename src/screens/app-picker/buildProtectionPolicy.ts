import type {AppProtection, AuthMethod, LaunchableApp, ProtectionMode} from '../../types/domain';
import {protectionFlagsFromMode} from '../../services/protection/protectionState';
import {APP_UNLOCK_CREDENTIAL_REF} from '../../services/security/credentialTypes';

export interface ProtectionDraft {
  app: LaunchableApp;
  apps?: LaunchableApp[];
  mode: ProtectionMode;
  authMethod: AuthMethod;
  autoLockSeconds: number;
  triggerType?: AppProtection['triggerType'];
}

export function buildProtectionPolicy(draft: ProtectionDraft): AppProtection {
  const flags = protectionFlagsFromMode(draft.mode);
  return {
    packageName: draft.app.packageName,
    label: draft.app.label,
    appName: draft.app.label,
    iconUri: draft.app.iconUri,
    icon: draft.app.iconUri,
    isHidden: flags.isHidden,
    isLocked: flags.isLocked,
    enabled: draft.mode !== 'NONE',
    lockType: draft.authMethod,
    credentialRef: APP_UNLOCK_CREDENTIAL_REF,
    triggerType: draft.triggerType ?? 'triple_tap',
    mode: draft.mode,
    authMethod: draft.authMethod,
    autoLockSeconds: draft.autoLockSeconds,
    updatedAt: Date.now(),
  };
}
