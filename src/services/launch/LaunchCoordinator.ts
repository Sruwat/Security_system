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
    const hasSession = sessionManager.isValidFor(packageName);

    if (decision.requiresSecretEntry && !hasSession) {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = protection.mode;
      return 'secret_required';
    }

    if (protection.mode === 'LOCK_HIDE' && hasSession) {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = protection.mode;
      return 'auth_required';
    }

    if (decision.requiresAuthentication && !hasSession) {
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

  restorePendingLaunch(packageName: string | null, mode: ProtectionMode | null = null): void {
    this.pendingLaunchPackageName = packageName;
    this.pendingLaunchMode = mode;
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
    if (pendingMode === 'LOCK' || pendingMode === 'LOCK_HIDE') {
      sessionManager.startSession(pendingPackageName, autoLockSeconds);
    }
    await this.syncTransientAccess();
    await nativeBridge.launchApp(pendingPackageName);
    this.pendingLaunchPackageName = null;
    this.pendingLaunchMode = null;
    return 'app_launched';
  }

  async completeSecretEntry(): Promise<'vault_opened' | 'auth_required' | 'app_launched'> {
    const settings = await localDataRepository.getSettings();
    const pendingPackageName = this.pendingLaunchPackageName;
    const pendingMode = this.pendingLaunchMode;
    sessionManager.startVaultSession(settings.autoLockSecondsDefault);
    await this.syncTransientAccess();

    if (pendingPackageName && pendingMode === 'HIDE') {
      await nativeBridge.launchApp(pendingPackageName);
      this.pendingLaunchPackageName = null;
      this.pendingLaunchMode = null;
      return 'app_launched';
    }

    if (pendingPackageName && pendingMode === 'LOCK_HIDE') {
      return 'auth_required';
    }

    return 'vault_opened';
  }

  clearPendingLaunch(): void {
    this.pendingLaunchPackageName = null;
    this.pendingLaunchMode = null;
  }
}

export const launchCoordinator = new LaunchCoordinator();
