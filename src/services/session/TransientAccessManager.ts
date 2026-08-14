import {nativeBridge} from '../../native';
import {launchCoordinator} from '../launch/LaunchCoordinator';
import {sessionManager} from './SessionManager';

export function clearTransientAccess() {
  sessionManager.clear();
  launchCoordinator.clearPendingLaunch();
  void nativeBridge.clearTransientAccess().catch(() => undefined);
}
