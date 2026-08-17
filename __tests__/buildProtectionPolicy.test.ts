import {buildProtectionPolicy} from '../src/screens/app-picker/buildProtectionPolicy';

describe('buildProtectionPolicy', () => {
  it('creates a persisted app protection policy from the selected draft', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    const policy = buildProtectionPolicy({
      app: {
        packageName: 'com.example.app',
        label: 'Example App',
        systemApp: false,
      },
      mode: 'LOCK_HIDE',
      authMethod: 'PIN',
      autoLockSeconds: 120,
    });

    expect(policy).toEqual({
      packageName: 'com.example.app',
      label: 'Example App',
      appName: 'Example App',
      icon: undefined,
      iconUri: undefined,
      isHidden: true,
      isLocked: true,
      enabled: true,
      lockType: 'PIN',
      credentialRef: 'lock.primary',
      triggerType: 'triple_tap',
      mode: 'LOCK_HIDE',
      authMethod: 'PIN',
      autoLockSeconds: 120,
      updatedAt: 1234567890,
    });

    nowSpy.mockRestore();
  });
});
