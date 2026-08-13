import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, LaunchDecision, ProtectionMode} from '../../types/domain';
import {sessionManager} from '../session/SessionManager';

export class ProtectionManager {
  async getProtection(packageName: string): Promise<AppProtection | undefined> {
    const apps = await localDataRepository.getProtectedApps();
    return apps.find(item => item.packageName === packageName);
  }

  async listProtectedApps(): Promise<AppProtection[]> {
    return localDataRepository.getProtectedApps();
  }

  async upsertProtection(policy: AppProtection): Promise<void> {
    await localDataRepository.addProtectedApp(policy);
  }

  async removeProtection(packageName: string): Promise<void> {
    await localDataRepository.removeProtectedApp(packageName);
  }

  evaluateDecision(mode: ProtectionMode, packageName: string): LaunchDecision {
    const hasSession = sessionManager.isValidFor(packageName);

    switch (mode) {
      case 'NONE':
        return {launchable: true, requiresAuthentication: false, requiresSecretEntry: false, reason: 'Unprotected app'};
      case 'LOCK':
        return {
          launchable: true,
          requiresAuthentication: !hasSession,
          requiresSecretEntry: false,
          reason: hasSession ? 'Valid temporary session' : 'Authentication required',
        };
      case 'HIDE':
        return {
          launchable: false,
          requiresAuthentication: true,
          requiresSecretEntry: true,
          reason: 'Hidden from normal launcher surfaces',
        };
      case 'LOCK_HIDE':
        return {
          launchable: false,
          requiresAuthentication: true,
          requiresSecretEntry: true,
          reason: 'Hidden and protected',
        };
      default:
        return {launchable: false, requiresAuthentication: false, requiresSecretEntry: false, reason: 'Unknown mode'};
    }
  }
}

export const protectionManager = new ProtectionManager();
