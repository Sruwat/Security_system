import {nativeBridge} from '../src/native';
import {launchCoordinator} from '../src/services/launch/LaunchCoordinator';
import {protectionManager} from '../src/services/protection/ProtectionManager';
import {sessionManager} from '../src/services/session/SessionManager';
import {localDataRepository} from '../src/storage/LocalDataRepository';

const mockedNativeBridge = nativeBridge as jest.Mocked<typeof nativeBridge>;
const mockedProtectionManager = protectionManager as jest.Mocked<typeof protectionManager>;
const mockedLocalDataRepository = localDataRepository as jest.Mocked<typeof localDataRepository>;

describe('LaunchCoordinator', () => {
  beforeEach(() => {
    sessionManager.clear();
    launchCoordinator.clearPendingLaunch();
    mockedNativeBridge.launchApp = jest.fn().mockResolvedValue(undefined);
    mockedNativeBridge.persistTransientAccess = jest.fn().mockResolvedValue(undefined);
    mockedNativeBridge.clearTransientAccess = jest.fn().mockResolvedValue(undefined);
    mockedLocalDataRepository.getSettings = jest.fn().mockResolvedValue({
      onboardingComplete: true,
      theme: 'SYSTEM',
      secretEntryMethod: 'DOUBLE_TAP',
      bannerEnabled: true,
      nativeAdEnabled: true,
      autoLockSecondsDefault: 300,
    });
  });

  afterEach(() => {
    sessionManager.clear();
    launchCoordinator.clearPendingLaunch();
  });

  it('stores a pending launch when authentication is required', async () => {
    mockedProtectionManager.getProtection = jest.fn().mockResolvedValue({
      packageName: 'com.example.app',
      label: 'Example App',
      mode: 'LOCK',
      authMethod: 'PIN',
      autoLockSeconds: 90,
      updatedAt: Date.now(),
    });

    const result = await launchCoordinator.launch('com.example.app');

    expect(result).toBe('auth_required');
    expect(launchCoordinator.getPendingLaunchPackageName()).toBe('com.example.app');
    expect(mockedNativeBridge.launchApp).not.toHaveBeenCalled();
  });

  it('unlocks the vault for returning users without a pending launch', async () => {
    const result = await launchCoordinator.completeAuthentication();

    expect(result).toBe('vault_unlocked');
    expect(sessionManager.getState()).toMatchObject({
      vaultUnlocked: true,
    });
    expect(mockedNativeBridge.persistTransientAccess).toHaveBeenCalledWith(null, true, expect.any(Number));
  });

  it('completes a pending protected launch after authentication', async () => {
    mockedProtectionManager.getProtection = jest.fn().mockResolvedValue({
      packageName: 'com.example.app',
      label: 'Example App',
      mode: 'LOCK',
      authMethod: 'BIOMETRIC',
      autoLockSeconds: 42,
      updatedAt: Date.now(),
    });

    await launchCoordinator.launch('com.example.app');
    const result = await launchCoordinator.completeAuthentication();

    expect(result).toBe('app_launched');
    expect(mockedNativeBridge.launchApp).toHaveBeenCalledWith('com.example.app');
    expect(sessionManager.getState()).toMatchObject({
      packageName: 'com.example.app',
      vaultUnlocked: false,
    });
    expect(launchCoordinator.getPendingLaunchPackageName()).toBeNull();
  });

  it('requires secret entry before opening a hidden app', async () => {
    mockedProtectionManager.getProtection = jest.fn().mockResolvedValue({
      packageName: 'com.example.hidden',
      label: 'Hidden App',
      mode: 'HIDE',
      authMethod: 'BIOMETRIC',
      autoLockSeconds: 60,
      updatedAt: Date.now(),
    });

    const result = await launchCoordinator.launch('com.example.hidden');

    expect(result).toBe('secret_required');
    expect(launchCoordinator.getPendingLaunchPackageName()).toBe('com.example.hidden');
    expect(launchCoordinator.getPendingLaunchMode()).toBe('HIDE');
    expect(mockedNativeBridge.launchApp).not.toHaveBeenCalled();
  });

  it('opens the vault after secret entry and launches the hidden app after authentication', async () => {
    mockedProtectionManager.getProtection = jest.fn().mockResolvedValue({
      packageName: 'com.example.hidden',
      label: 'Hidden App',
      mode: 'HIDE',
      authMethod: 'PIN',
      autoLockSeconds: 120,
      updatedAt: Date.now(),
    });

    await launchCoordinator.launch('com.example.hidden');

    const secretResult = await launchCoordinator.completeSecretEntry();
    expect(secretResult).toBe('vault_opened');
    expect(sessionManager.getState()).toMatchObject({
      vaultUnlocked: true,
    });
    expect(mockedNativeBridge.persistTransientAccess).toHaveBeenCalledWith(null, true, expect.any(Number));

    const authResult = await launchCoordinator.completeAuthentication();

    expect(authResult).toBe('app_launched');
    expect(mockedNativeBridge.launchApp).toHaveBeenCalledWith('com.example.hidden');
    expect(mockedNativeBridge.persistTransientAccess).toHaveBeenCalled();
    expect(launchCoordinator.getPendingLaunchPackageName()).toBeNull();
    expect(launchCoordinator.getPendingLaunchMode()).toBeNull();
  });

  it('keeps LOCK_HIDE launches gated until secret entry and authentication complete', async () => {
    mockedProtectionManager.getProtection = jest.fn().mockResolvedValue({
      packageName: 'com.example.lockhidden',
      label: 'Locked Hidden App',
      mode: 'LOCK_HIDE',
      authMethod: 'BIOMETRIC',
      autoLockSeconds: 180,
      updatedAt: Date.now(),
    });

    const launchResult = await launchCoordinator.launch('com.example.lockhidden');

    expect(launchResult).toBe('secret_required');
    expect(launchCoordinator.getPendingLaunchPackageName()).toBe('com.example.lockhidden');
    expect(launchCoordinator.getPendingLaunchMode()).toBe('LOCK_HIDE');

    const secretResult = await launchCoordinator.completeSecretEntry();
    expect(secretResult).toBe('vault_opened');
    expect(sessionManager.getState()).toMatchObject({
      vaultUnlocked: true,
    });
    expect(mockedNativeBridge.persistTransientAccess).toHaveBeenCalledWith(null, true, expect.any(Number));

    const authResult = await launchCoordinator.completeAuthentication();

    expect(authResult).toBe('app_launched');
    expect(mockedNativeBridge.launchApp).toHaveBeenCalledWith('com.example.lockhidden');
    expect(mockedNativeBridge.persistTransientAccess).toHaveBeenCalledWith('com.example.lockhidden', false, expect.any(Number));
    expect(sessionManager.getState()).toMatchObject({
      packageName: 'com.example.lockhidden',
      vaultUnlocked: false,
    });
    expect(launchCoordinator.getPendingLaunchPackageName()).toBeNull();
    expect(launchCoordinator.getPendingLaunchMode()).toBeNull();
  });
});
