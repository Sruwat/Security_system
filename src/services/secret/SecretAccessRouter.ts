import {launchCoordinator} from '../launch/LaunchCoordinator';
import {localDataRepository} from '../../storage/LocalDataRepository';
import {protectionModeFromFlags} from '../protection/protectionState';
import {sessionManager} from '../session/SessionManager';

export class SecretAccessRouter {
  async handleSecretAccess(): Promise<'empty' | 'vault' | 'auth_required'> {
    const protectedApps = await localDataRepository.getProtectedApps();
    const hiddenApps = protectedApps.filter(app => app.enabled && app.isHidden);

    if (hiddenApps.length === 0) {
      launchCoordinator.clearPendingLaunch();
      return 'empty';
    }

    const pendingPackageName = launchCoordinator.getPendingLaunchPackageName();
    if (pendingPackageName) {
      const pendingApp = hiddenApps.find(app => app.packageName === pendingPackageName);
      if (pendingApp && pendingApp.isLocked && !sessionManager.isValidFor(pendingPackageName)) {
        return 'auth_required';
      }
    }

    if (sessionManager.isVaultUnlocked()) {
      return 'vault';
    }

    const requiresPrivateAreaAuth = hiddenApps.some(app => protectionModeFromFlags(app) === 'LOCK_HIDE');
    return requiresPrivateAreaAuth ? 'auth_required' : 'vault';
  }
}

export const secretAccessRouter = new SecretAccessRouter();
