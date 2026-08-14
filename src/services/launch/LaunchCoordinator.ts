import {nativeBridge} from '../../native';
import {protectionManager} from '../protection/ProtectionManager';
import {sessionManager} from '../session/SessionManager';
import {localDataRepository} from '../../storage/LocalDataRepository';

export class LaunchCoordinator {
  private pendingLaunchPackageName: string | null = null;

  async launch(packageName: string): Promise<'launched' | 'auth_required' | 'secret_required'> {
    const protection = await protectionManager.getProtection(packageName);
    if (!protection) {
      await nativeBridge.launchApp(packageName);
      return 'launched';
    }

    const decision = protectionManager.evaluateDecision(protection.mode, packageName);

    if (decision.requiresSecretEntry) {
      return 'secret_required';
    }

    if (decision.requiresAuthentication && !sessionManager.isValidFor(packageName)) {
      this.pendingLaunchPackageName = packageName;
      return 'auth_required';
    }

    await nativeBridge.launchApp(packageName);
    return 'launched';
  }

  getPendingLaunchPackageName(): string | null {
    return this.pendingLaunchPackageName;
  }

  async completeAuthentication(): Promise<'vault_unlocked' | 'app_launched'> {
    const pendingPackageName = this.pendingLaunchPackageName;
    const settings = await localDataRepository.getSettings();

    if (!pendingPackageName) {
      this.pendingLaunchPackageName = null;
      sessionManager.startVaultSession(settings.autoLockSecondsDefault);
      return 'vault_unlocked';
    }

    const protection = await protectionManager.getProtection(pendingPackageName);
    const autoLockSeconds = protection?.autoLockSeconds ?? settings.autoLockSecondsDefault;
    sessionManager.startSession(pendingPackageName, autoLockSeconds);
    await nativeBridge.launchApp(pendingPackageName);
    this.pendingLaunchPackageName = null;
    return 'app_launched';
  }

  clearPendingLaunch(): void {
    this.pendingLaunchPackageName = null;
  }
}

export const launchCoordinator = new LaunchCoordinator();
