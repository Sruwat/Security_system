import {localDataRepository} from '../../storage/LocalDataRepository';
import type {AppProtection, LaunchDecision, ProtectionMode} from '../../types/domain';
import {sessionManager} from '../session/SessionManager';
import {normalizeProtection, protectionModeFromFlags} from './protectionState';

export class ProtectionManager {
  async getProtection(packageName: string): Promise<AppProtection | undefined> {
    const apps = await localDataRepository.getProtectedApps();
    return apps.find(item => item.packageName === packageName);
  }

  async listProtectedApps(): Promise<AppProtection[]> {
    return localDataRepository.getProtectedApps();
  }

  async upsertProtection(policy: AppProtection): Promise<void> {
    await localDataRepository.addProtectedApp(normalizeProtection(policy));
  }

  async removeProtection(packageName: string): Promise<void> {
    await localDataRepository.removeProtectedApp(packageName);
  }

  evaluateDecision(mode: ProtectionMode, packageName: string, hasSession = false): LaunchDecision {
    const sessionActive = hasSession || sessionManager.isValidFor(packageName);

    switch (mode) {
      case 'NONE':
        return {launchable: true, requiresAuthentication: false, requiresSecretEntry: false, reason: 'Unprotected app'};
      case 'LOCK':
        return {
          launchable: true,
          requiresAuthentication: !sessionActive,
          requiresSecretEntry: false,
          reason: sessionActive ? 'Valid temporary session' : 'Authentication required',
        };
      case 'HIDE':
        return {
          launchable: sessionActive,
          requiresAuthentication: true,
          requiresSecretEntry: true,
          reason: sessionActive ? 'Secret session already active' : 'Hidden from normal launcher surfaces',
        };
      case 'LOCK_HIDE':
        return {
          launchable: false,
          requiresAuthentication: true,
          requiresSecretEntry: true,
          reason: sessionActive ? 'Secret session active, authentication still required' : 'Hidden and protected',
        };
      default:
        return {launchable: false, requiresAuthentication: false, requiresSecretEntry: false, reason: 'Unknown mode'};
    }
  }

  evaluateProtection(protection: Pick<AppProtection, 'isHidden' | 'isLocked'>, packageName: string, hasSession = false): LaunchDecision {
    return this.evaluateDecision(protectionModeFromFlags(protection), packageName, hasSession);
  }
}

export const protectionManager = new ProtectionManager();
