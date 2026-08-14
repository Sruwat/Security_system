import {nativeBridge} from '../../native';
import {protectionManager} from '../protection/ProtectionManager';
import {sessionManager} from '../session/SessionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {ProtectionMode} from '../../types/domain';

export class LaunchCoordinator {
  private pendingLaunchPackageName: string | null = null;
  private pendingLaunchMode: ProtectionMode | null = null;

  async launch(packageName: string): Promise<'launched' | 'auth_required' | 'secret_required'> {
    const protection = await protectionManager.getProtection(packageName);
    if (!protection) {
      await nativeBridge.launchApp(packageName);
      return 'launched';
    }

    const decision = protectionManager.evaluateDecision(protection.mode, packageName);

    if (decision.requiresSecretEntry) {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = protection.mode;
      return 'secret_required';
    }

    if (decision.requiresAuthentication && !sessionManager.isValidFor(packageName)) {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = protection.mode;
      return 'auth_required';
    }

    await nativeBridge.launchApp(packageName);
    return 'launched';
  }

  private async syncTransientAccess(): Promise<void> {
    const state = sessionManager.getState();
    if (!state) {
      await nativeBridge.clearTransientAccess();
      return;
    }

    await nativeBridge.persistTransientAccess(state.packageName ?? null, state.vaultUnlocked, state.expiresAt);
  }

  getPendingLaunchPackageName(): string | null {
    return this.pendingLaunchPackageName;
  }

  getPendingLaunchMode(): ProtectionMode | null {
    return this.pendingLaunchMode;
  }

  async completeAuthentication(): Promise<'vault_unlocked' | 'app_launched'> {
    const pendingPackageName = this.pendingLaunchPackageName;
    const pendingMode = this.pendingLaunchMode;
    const settings = await localDataRepository.getSettings();

    if (!pendingPackageName) {
      this.pendingLaunchPackageName = null;
      this.pendingLaunchMode = null;
      sessionManager.startVaultSession(settings.autoLockSecondsDefault);
      await this.syncTransientAccess();
      return 'vault_unlocked';
    }

    const protection = await protectionManager.getProtection(pendingPackageName);
    const autoLockSeconds = protection?.autoLockSeconds ?? settings.autoLockSecondsDefault;
    if ((pendingMode === 'HIDE' || pendingMode === 'LOCK_HIDE') && !sessionManager.isValidFor(pendingPackageName)) {
      return 'vault_unlocked';
    }
    if (pendingMode === 'LOCK' || pendingMode === 'LOCK_HIDE') {
      sessionManager.startSession(pendingPackageName, autoLockSeconds);
    }
    await this.syncTransientAccess();
    await nativeBridge.launchApp(pendingPackageName);
    this.pendingLaunchPackageName = null;
    this.pendingLaunchMode = null;
    return 'app_launched';
  }

  async completeSecretEntry(): Promise<'vault_opened'> {
    const settings = await localDataRepository.getSettings();
    sessionManager.startVaultSession(settings.autoLockSecondsDefault);
    await this.syncTransientAccess();
    return 'vault_opened';
  }

  clearPendingLaunch(): void {
    this.pendingLaunchPackageName = null;
    this.pendingLaunchMode = null;
  }
}

export const launchCoordinator = new LaunchCoordinator();
