import {launchCoordinator} from '../src/services/launch/LaunchCoordinator';
import {secretAccessRouter} from '../src/services/secret/SecretAccessRouter';
import {sessionManager} from '../src/services/session/SessionManager';
import {localDataRepository} from '../src/storage/LocalDataRepository';

const mockedLocalDataRepository = localDataRepository as jest.Mocked<typeof localDataRepository>;

describe('SecretAccessRouter', () => {
  beforeEach(() => {
    sessionManager.clear();
    launchCoordinator.clearPendingLaunch();
  });

  afterEach(() => {
    sessionManager.clear();
    launchCoordinator.clearPendingLaunch();
  });

  it('returns empty and clears pending launch when no hidden apps exist', async () => {
    mockedLocalDataRepository.getProtectedApps = jest.fn().mockResolvedValue([
      {
        packageName: 'com.example.visible',
        label: 'Visible App',
        isHidden: false,
        isLocked: true,
        enabled: true,
        mode: 'LOCK',
        updatedAt: Date.now(),
      },
    ] as any);

    launchCoordinator.restorePendingLaunch('com.example.visible', 'LOCK');

    await expect(secretAccessRouter.handleSecretAccess()).resolves.toBe('empty');
    expect(launchCoordinator.getPendingLaunchPackageName()).toBeNull();
  });

  it('opens vault directly for hidden-only apps', async () => {
    mockedLocalDataRepository.getProtectedApps = jest.fn().mockResolvedValue([
      {
        packageName: 'com.example.hidden',
        label: 'Hidden App',
        isHidden: true,
        isLocked: false,
        enabled: true,
        mode: 'HIDE',
        updatedAt: Date.now(),
      },
    ] as any);

    await expect(secretAccessRouter.handleSecretAccess()).resolves.toBe('vault');
  });

  it('requires auth when hidden and locked apps exist without a vault session', async () => {
    mockedLocalDataRepository.getProtectedApps = jest.fn().mockResolvedValue([
      {
        packageName: 'com.example.lockhidden',
        label: 'Locked Hidden App',
        isHidden: true,
        isLocked: true,
        enabled: true,
        mode: 'LOCK_HIDE',
        updatedAt: Date.now(),
      },
    ] as any);

    await expect(secretAccessRouter.handleSecretAccess()).resolves.toBe('auth_required');
  });

  it('opens vault when a vault session is already active', async () => {
    mockedLocalDataRepository.getProtectedApps = jest.fn().mockResolvedValue([
      {
        packageName: 'com.example.lockhidden',
        label: 'Locked Hidden App',
        isHidden: true,
        isLocked: true,
        enabled: true,
        mode: 'LOCK_HIDE',
        updatedAt: Date.now(),
      },
    ] as any);

    sessionManager.startVaultSession(60);

    await expect(secretAccessRouter.handleSecretAccess()).resolves.toBe('vault');
  });
});
