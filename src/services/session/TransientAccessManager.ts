import {launchCoordinator} from '../launch/LaunchCoordinator';
import {sessionManager} from './SessionManager';

export function clearTransientAccess() {
  sessionManager.clear();
  launchCoordinator.clearPendingLaunch();
}
