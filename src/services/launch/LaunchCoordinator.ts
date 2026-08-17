import {nativeBridge} from '../../native';
import {protectionManager} from '../protection/ProtectionManager';
import {protectionModeFromFlags} from '../protection/protectionState';
import {sessionManager} from '../session/SessionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {ProtectionMode} from '../../types/domain';

export class LaunchCoordinator {
  private pendingLaunchPackageName: string | null = null;
  private pendingLaunchMode: ProtectionMode | null = null;

  private syncPendingAuthRequest(packageName: string | null): void {
    if (packageName) {
      void nativeBridge.setPendingAuthRequest(packageName).catch(() => undefined);
      return;
    }

    void nativeBridge.clearPendingAuthRequest().catch(() => undefined);
  }

  async launch(packageName: string): Promise<'launched' | 'auth_required' | 'secret_required'> {
    const protection = await protectionManager.getProtection(packageName);
    if (!protection) {
      await nativeBridge.launchApp(packageName);
      return 'launched';
    }

    const mode = protection.mode ?? protectionModeFromFlags(protection);
    const decision = protectionManager.evaluateDecision(mode, packageName);
    const hasSession = sessionManager.isValidFor(packageName);

    if (decision.requiresSecretEntry && !hasSession) {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = mode;
      this.syncPendingAuthRequest(packageName);
      return 'secret_required';
    }

    if (mode === 'LOCK_HIDE' && hasSession) {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = mode;
      this.syncPendingAuthRequest(packageName);
      return 'auth_required';
    }

    if (decision.requiresAuthentication && !hasSession) {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = mode;
      this.syncPendingAuthRequest(packageName);
      return 'auth_required';
    }

    await nativeBridge.launchApp(packageName);
    return 'launched';
  }

  async launchFromVault(packageName: string): Promise<'launched' | 'auth_required'> {
    const protection = await protectionManager.getProtection(packageName);
    if (!protection) {
      await nativeBridge.launchApp(packageName);
      return 'launched';
    }

    const mode = protection.mode ?? protectionModeFromFlags(protection);

    if (mode === 'LOCK_HIDE') {
      this.pendingLaunchPackageName = packageName;
      this.pendingLaunchMode = mode;
      this.syncPendingAuthRequest(packageName);
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
    this.syncPendingAuthRequest(packageName);
  }

  async completeAuthentication(): Promise<'vault_unlocked' | 'app_launched'> {
    const pendingPackageName = this.pendingLaunchPackageName;
    const pendingMode = this.pendingLaunchMode;
    const settings = await localDataRepository.getSettings();

    if (!pendingPackageName) {
      this.pendingLaunchPackageName = null;
      this.pendingLaunchMode = null;
      this.syncPendingAuthRequest(null);
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
    return 'app_launched';
  }

  async launchPendingAfterAuthentication(): Promise<boolean> {
    const pendingPackageName = this.pendingLaunchPackageName;
    if (!pendingPackageName) {
      return false;
    }

    await nativeBridge.launchApp(pendingPackageName);
    this.pendingLaunchPackageName = null;
    this.pendingLaunchMode = null;
    this.syncPendingAuthRequest(null);
    return true;
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
      this.syncPendingAuthRequest(null);
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
    this.syncPendingAuthRequest(null);
  }
}

export const launchCoordinator = new LaunchCoordinator();
