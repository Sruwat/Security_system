import {nativeBridge} from '../../native';
import {protectionManager} from '../protection/ProtectionManager';
import {protectionModeFromFlags} from '../protection/protectionState';
import {sessionManager} from '../session/SessionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';
import type {ProtectionMode} from '../../types/domain';

export class LaunchCoordinator {
  private pendingLaunchPackageName: string | null = null;
  private pendingLaunchMode: ProtectionMode | null = null;

  private isVaultUnlocked(): boolean {
    return sessionManager.isVaultUnlocked();
  }

  private hasPackageSession(packageName: string): boolean {
    return sessionManager.isValidFor(packageName);
  }

  private setPendingLaunch(packageName: string | null, mode: ProtectionMode | null = null): void {
    this.pendingLaunchPackageName = packageName;
    this.pendingLaunchMode = mode;
    this.syncPendingAuthRequest(packageName);
  }

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
    const hasPackageSession = this.hasPackageSession(packageName);
    const hasVaultSession = this.isVaultUnlocked();

    switch (mode) {
      case 'HIDE':
        if (!hasVaultSession) {
          this.setPendingLaunch(packageName, mode);
          return 'secret_required';
        }
        await nativeBridge.launchApp(packageName);
        return 'launched';
      case 'LOCK_HIDE':
        this.setPendingLaunch(packageName, mode);
        if (!hasVaultSession) {
          return 'secret_required';
        }
        if (!hasPackageSession) {
          return 'auth_required';
        }
        await nativeBridge.launchApp(packageName);
        this.clearPendingLaunch();
        return 'launched';
      case 'LOCK':
        if (!hasPackageSession) {
          this.setPendingLaunch(packageName, mode);
          return 'auth_required';
        }
        await nativeBridge.launchApp(packageName);
        return 'launched';
      default:
        await nativeBridge.launchApp(packageName);
        return 'launched';
    }
  }

  async launchFromVault(packageName: string): Promise<'launched' | 'auth_required'> {
    const protection = await protectionManager.getProtection(packageName);
    if (!protection) {
      await nativeBridge.launchApp(packageName);
      return 'launched';
    }

    const mode = protection.mode ?? protectionModeFromFlags(protection);

    if (mode === 'LOCK_HIDE') {
      if (!this.hasPackageSession(packageName)) {
        this.setPendingLaunch(packageName, mode);
        return 'auth_required';
      }
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
    this.setPendingLaunch(packageName, mode);
  }

  async completeAuthentication(): Promise<'vault_unlocked' | 'app_launched'> {
    const pendingPackageName = this.pendingLaunchPackageName;
    const pendingMode = this.pendingLaunchMode;
    const settings = await localDataRepository.getSettings();

    if (!pendingPackageName) {
      this.clearPendingLaunch();
      sessionManager.startVaultSession(settings.autoLockSecondsDefault);
      await this.syncTransientAccess();
      return 'vault_unlocked';
    }

    const protection = await protectionManager.getProtection(pendingPackageName);
    const autoLockSeconds = protection?.autoLockSeconds ?? settings.autoLockSecondsDefault;
    if (pendingMode === 'LOCK' || pendingMode === 'LOCK_HIDE') {
      sessionManager.startSession(pendingPackageName, autoLockSeconds, pendingMode === 'LOCK_HIDE');
    } else if (pendingMode === 'HIDE') {
      sessionManager.startVaultSession(autoLockSeconds);
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
    this.clearPendingLaunch();
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
      this.clearPendingLaunch();
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
