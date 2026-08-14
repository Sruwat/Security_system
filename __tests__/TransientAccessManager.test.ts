import {protectionManager} from '../src/services/protection/ProtectionManager';
import {clearTransientAccess} from '../src/services/session/TransientAccessManager';
import {launchCoordinator} from '../src/services/launch/LaunchCoordinator';
import {sessionManager} from '../src/services/session/SessionManager';

const mockedProtectionManager = protectionManager as jest.Mocked<typeof protectionManager>;

describe('TransientAccessManager', () => {
  beforeEach(() => {
    sessionManager.clear();
    launchCoordinator.clearPendingLaunch();
    mockedProtectionManager.getProtection = jest.fn();
  });

  it('clears sessions and pending launches on background', () => {
    mockedProtectionManager.getProtection.mockResolvedValue({
      packageName: 'com.example.hidden',
      label: 'Hidden App',
      mode: 'HIDE',
      authMethod: 'BIOMETRIC',
      autoLockSeconds: 60,
      updatedAt: Date.now(),
    });

    return launchCoordinator.launch('com.example.hidden').then(() => {
      sessionManager.startSession('com.example.app', 60);
      clearTransientAccess();

      expect(sessionManager.getState()).toBeNull();
      expect(launchCoordinator.getPendingLaunchPackageName()).toBeNull();
      expect(launchCoordinator.getPendingLaunchMode()).toBeNull();
    });
  });
});
