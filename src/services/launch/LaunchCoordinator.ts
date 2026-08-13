import {nativeBridge} from '../../native';
import {protectionManager} from '../protection/ProtectionManager';
import {sessionManager} from '../session/SessionManager';

export class LaunchCoordinator {
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
      return 'auth_required';
    }

    await nativeBridge.launchApp(packageName);
    return 'launched';
  }
}

export const launchCoordinator = new LaunchCoordinator();
